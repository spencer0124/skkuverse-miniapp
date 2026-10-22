/**
 * `pnpm contract`: plays every built game against the fake host and holds it
 * to the protocol contract. Run it after the games are built.
 *
 *   pnpm contract [<id>...]                           every game under games/, or the ones named
 *   pnpm contract --entry <module> --html <index.html>  any page, by its entry module (source or built)
 *
 * A game is played from its build: the module `dist/index.html` loads. Each
 * page runs in a vitest process of its own (see `src/harness.ts` for why not
 * a browser). Exits non-zero when any page breaks the contract, naming the
 * rule it broke.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const tool = resolve(import.meta.dirname, '..');
const root = resolve(tool, '..', '..');

interface Page {
  name: string;
  entry: string;
  html: string;
}

/** The module a built game's `index.html` loads, as a path under `dist/`. */
function builtEntry(dist: string): string {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const src = /<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']\/([^"']+)["']/i.exec(html)?.[1];
  if (!src) throw new Error(`${join(dist, 'index.html')} loads no module script`);
  return join(dist, src);
}

function gamePage(id: string): Page {
  const dist = join(root, 'games', id, 'dist');
  if (!existsSync(join(dist, 'index.html'))) {
    throw new Error(`games/${id} is not built: pnpm --filter ./games/${id} build`);
  }
  return { name: id, entry: builtEntry(dist), html: join(dist, 'index.html') };
}

function listGames(): string[] {
  const games = join(root, 'games');
  if (!existsSync(games)) return [];
  return readdirSync(games, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function play(page: Page): boolean {
  console.log(`\n▶ ${page.name}`);
  const result = spawnSync(
    process.execPath,
    [join(tool, 'node_modules', 'vitest', 'vitest.mjs'), 'run', '--config', 'vitest.contract.config.ts'],
    {
      cwd: tool,
      stdio: 'inherit',
      env: { ...process.env, CONTRACT_ENTRY: page.entry, CONTRACT_HTML: page.html, CONTRACT_NAME: page.name },
    },
  );
  return result.status === 0;
}

function main(argv: string[]): number {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { entry: { type: 'string' }, html: { type: 'string' }, name: { type: 'string' } },
  });
  let pages: Page[];
  if (values.entry !== undefined) {
    if (values.html === undefined) throw new Error('--entry needs --html');
    const entry = resolve(values.entry);
    pages = [{ name: values.name ?? values.entry, entry, html: resolve(values.html) }];
  } else {
    const ids = positionals.length > 0 ? positionals : listGames();
    if (ids.length === 0) {
      console.log('no games under games/');
      return 0;
    }
    pages = ids.map(gamePage);
  }
  const failed = pages.filter((page) => !play(page)).map((page) => page.name);
  console.log(failed.length === 0 ? `\n✓ ${pages.length} page(s) keep the game contract` : `\n✗ broke the game contract: ${failed.join(', ')}`);
  return failed.length === 0 ? 0 : 1;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
