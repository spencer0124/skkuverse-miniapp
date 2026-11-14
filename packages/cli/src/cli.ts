#!/usr/bin/env node
/**
 * The miniapp CLI. It works on a repository of miniapps and games: the nearest
 * folder at or above the working directory that holds `deploy.config.json`, or
 * the one `--root` names. A `check --dir` of a miniapp needs neither. `USAGE`
 * lists the commands. `check --dir` is for a package outside apps/ and games/,
 * such as a club's submission, and `ship` takes the kind from deploy.config.json.
 */
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { checkApp, checkIdNamespace } from './check.ts';
import { findRoot, loadConfig, namedRoot, parseKind } from './config.ts';
import { scaffold } from './new.ts';
import { report, reportJson } from './report.ts';
import { checkRepo, type PackageReport } from './repo.ts';
import { ship } from './ship.ts';

const USAGE = `usage: miniapp-cli <command> [--root <path>]

  check [<id>...] [--kind app|game] [--json]           check every package, or the ones named
  check --dir <path> --id <id> [--kind game] [--json]  check a package outside apps/ and games/
  new [--kind game] <id>                               scaffold apps/<id>, or games/<id> for a game
  ship <id> [--preview]                                build, check and deploy

check --json prints every finding as one JSON array on stdout, and errors on stderr.

The repository is the nearest folder at or above the working directory that
holds deploy.config.json, or the folder --root names.`;

function main(argv: string[]): number {
  const [command, ...rest] = argv;
  if (command === 'help' || argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    return 0;
  }
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      dir: { type: 'string' },
      id: { type: 'string' },
      json: { type: 'boolean', default: false },
      kind: { type: 'string' },
      preview: { type: 'boolean', default: false },
      root: { type: 'string' },
    },
  });
  const root = () => (values.root === undefined ? findRoot(process.cwd()) : namedRoot(values.root));
  const kind = values.kind === undefined ? undefined : parseKind(values.kind);
  if (values.json && (command === 'new' || command === 'ship')) throw new Error('--json is only for check');

  switch (command) {
    case 'check': {
      const reports: PackageReport[] = [];
      if (values.dir !== undefined) {
        if (values.id === undefined) throw new Error('--dir needs --id');
        const dir = resolve(values.dir);
        const k = kind ?? 'app';
        const findings = checkApp({ id: values.id, dir, kind: k, config: null });
        if (k === 'game') findings.push(...checkIdNamespace(root(), values.id, dir, loadConfig(root())));
        reports.push({ id: values.id, kind: k, findings });
      } else {
        const ids = positionals.length > 0 ? positionals : undefined;
        reports.push(...checkRepo(root(), { ids, kind }));
      }
      const ok = values.json ? reportJson(reports) : reports.map(({ id, findings }) => report(id, findings)).every(Boolean);
      return ok ? 0 : 1;
    }
    case 'ship': {
      const [id] = positionals;
      if (id === undefined || positionals.length > 1) throw new Error('usage: ship <id> [--preview]');
      ship(root(), id, { preview: values.preview });
      return 0;
    }
    case 'new': {
      const [id] = positionals;
      if (id === undefined || positionals.length > 1) throw new Error('usage: new [--kind game] <id>');
      const k = kind ?? 'app';
      const dir = scaffold(root(), id, k);
      console.log(`created ${dir}`);
      console.log(
        k === 'app'
          ? `next: add "${id}" to deploy.config.json, pnpm install, then ask the platform maintainers to register it`
          : `next: add "${id}" to deploy.config.json "games" (project game-${id}), pnpm install, then ask the platform maintainers to register it`,
      );
      return 0;
    }
    default:
      throw new Error(USAGE);
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

