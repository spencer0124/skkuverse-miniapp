#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { CONFIG_FILE, entryOf, findRoot, hostFor, loadConfig, namedRoot } from '@skkuverse/miniapp-cli/config';
import { judgeN1 } from './observe/n1.ts';
import { judgeN2, queryKeys } from './observe/n2.ts';
import { judgeN3 } from './observe/n3.ts';
import { backendOrigins, judgeN4, unjudgedFindings } from './observe/n4.ts';
import { toJson, type Finding } from './rules.ts';
import { serve } from './serve.ts';
import { BrowserMissingError, crawl, RunnerError, withSession } from './session.ts';

const USAGE = `usage: miniapp-contract [<id>...] [--root <path>] [--json]
       miniapp-contract --dir <path> [--id <id>] [--json]
       miniapp-contract serve (<id> | --dir <path>) [--root <path>] [--port <n>]
       miniapp-contract install

  <id>...        judge every built miniapp under apps/, or the ones named
  --root <path>  the folder that holds deploy.config.json; by default the
                 nearest one at or above the working directory
  --dir <path>   judge one built miniapp folder outside a repository
  --id <id>      its id, by default the folder's name
  --json         print the findings as JSON. Unlike check --json, which
                 prints one array, this prints one JSON object per line
  serve          serve a build with the production headers until stopped
  install        download the Chromium the runner drives

Build the miniapps first. Exits 0 when every miniapp keeps N1 to N4, 1 when one
breaks a rule, and 2 when the runner could not judge: a usage error, a missing
browser, a page that does not load, or a backend that cannot be reached.`;

const require = createRequire(import.meta.url);

interface Target {
  id: string;
  dir: string;
  productionOrigin: string;
  operatorPaths: string[];
  queryParams: string[];
}

class UsageError extends RunnerError {}

function repositoryTargets(root: string, ids: string[]): Target[] {
  const config = loadConfig(root);
  const folder = join(root, 'apps');
  const named = ids.length > 0 ? ids : existsSync(folder) ? readdirSync(folder, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort() : [];
  return named.map((id) => {
    const entry = entryOf(config, 'app', id);
    if (!entry) throw new UsageError(`${id} is not under "apps" in ${CONFIG_FILE}`);
    return {
      id,
      dir: join(folder, id),
      productionOrigin: `https://${hostFor(id, entry)}`,
      operatorPaths: entry.operatorPaths ?? [],
      queryParams: entry.queryParams ?? [],
    };
  });
}

/** The repository `--root` names, or the nearest one above the working directory. */
function rootOf(root: string | undefined): string {
  try {
    return root === undefined ? findRoot(process.cwd()) : namedRoot(root);
  } catch (error) {
    throw new UsageError(`${(error as Error).message}, or --dir`);
  }
}

function folderTarget(dir: string, id = basename(resolve(dir))): Target {
  return { id, dir: resolve(dir), productionOrigin: `https://${hostFor(id, undefined)}`, operatorPaths: [], queryParams: [] };
}

function distOf({ id, dir }: Target): string {
  const dist = join(dir, 'dist');
  if (!existsSync(join(dist, 'index.html'))) throw new UsageError(`${id} is not built: ${join(dist, 'index.html')} does not exist`);
  return dist;
}

async function judge(target: Target): Promise<Finding[]> {
  const dist = distOf(target);
  const keys = queryKeys(dist).filter((key) => !target.queryParams.includes(key));
  return withSession(dist, async (session) => {
    const { visits, routes } = await crawl(session);
    return [
      ...judgeN1(visits),
      ...target.queryParams.map((key): Finding => ({
        rule: 'N2',
        level: 'warn',
        message: `did not load / with the query key "${key}", because queryParams in ${CONFIG_FILE} lists it`,
      })),
      ...(await judgeN2(session, keys)),
      ...(await judgeN3(session, routes, target.operatorPaths)),
      ...(await judgeN4(session.visits, backendOrigins(target.dir), target.productionOrigin)),
      ...unjudgedFindings(session.unjudged),
    ];
  });
}

function playwrightVersion(): string {
  return (JSON.parse(readFileSync(require.resolve('playwright/package.json'), 'utf8')) as { version: string }).version;
}

/** Downloads the headless Chromium this package's Playwright drives, and nothing else. */
function install(): number {
  const cli = join(dirname(require.resolve('playwright/package.json')), 'cli.js');
  const result = spawnSync(process.execPath, [cli, 'install', '--only-shell', '--no-remove', 'chromium'], { stdio: 'inherit' });
  return result.status === 0 ? 0 : 2;
}

function print(id: string, findings: Finding[], json: boolean): void {
  if (json) {
    for (const finding of findings) console.log(JSON.stringify(toJson(id, finding)));
    return;
  }
  for (const f of findings) console.log(`${f.level === 'error' ? '✗' : '!'} ${id} ${f.rule} ${f.message}`);
  if (findings.every((f) => f.level !== 'error')) console.log(`✓ ${id}`);
}

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      root: { type: 'string' },
      dir: { type: 'string' },
      id: { type: 'string' },
      port: { type: 'string' },
      json: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(USAGE);
    return 0;
  }
  const [command, ...rest] = positionals;
  if (command === 'install') return install();

  const serving = command === 'serve';
  const ids = serving ? rest : positionals;
  if (values.dir !== undefined && ids.length > 0) throw new UsageError('pass either --dir or ids, not both');
  const targets =
    values.dir !== undefined ? [folderTarget(values.dir, values.id)] : repositoryTargets(rootOf(values.root), ids);

  if (serving) {
    if (targets.length !== 1) throw new UsageError('serve takes one miniapp: an id or --dir');
    const port = values.port === undefined ? 0 : Number(values.port);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new UsageError(`--port must be a port number, not ${values.port}`);
    const { origin } = await serve(distOf(targets[0]!), port);
    console.log(`serving ${targets[0]!.id} at ${origin} with the production headers; Ctrl-C stops it`);
    return new Promise<number>(() => {});
  }

  if (targets.length === 0) {
    if (!values.json) console.log('no miniapps under apps/');
    return 0;
  }
  let broken = false;
  for (const target of targets) {
    const findings = await judge(target);
    print(target.id, findings, values.json === true);
    broken ||= findings.some((f) => f.level === 'error');
  }
  return broken ? 1 : 0;
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  if (error instanceof BrowserMissingError) {
    console.error(`miniapp-contract: Chromium for Playwright ${playwrightVersion()} is not installed. Install it with: npx miniapp-contract install`);
  } else {
    console.error(`miniapp-contract: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof UsageError || (error as { code?: string }).code?.startsWith('ERR_PARSE_ARGS')) console.error(USAGE);
  }
  process.exitCode = 2;
}
