#!/usr/bin/env node
/**
 * `game-contract`: plays every built game against the fake host and holds it
 * to the protocol contract. Run it from the repository root after the games
 * are built.
 *
 *   game-contract [<id>...]                           every game under games/, or the ones named
 *   game-contract --entry <module> --html <index.html> [--player <module>]  any page, by its entry module (source or built)
 *
 * A game is played from its build: the module `dist/index.html` loads. A game
 * whose runs need playing to end ships `contract.player.ts` beside its page,
 * which plays them (`ContractPlayer` in `src/harness.ts`). Each page is played
 * twice, each time in a vitest process of its own (see `src/harness.ts` for why
 * not a browser): once with the host there almost at once, and once with a
 * host that appears only after `bootGame` called `onNoHost` (`LATE_HOST_MS`).
 * Exits non-zero when any page breaks the contract, naming the rule it broke.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const tool = resolve(import.meta.dirname, '..');
const root = process.cwd();
const vitestBin = join(dirname(createRequire(import.meta.url).resolve('vitest/package.json')), 'vitest.mjs');

interface Page {
  name: string;
  entry: string;
  html: string;
  /** The game's `contract.player.ts`, when it has one. */
  player?: string;
}

/** Where a game keeps its player, beside its page. */
const PLAYER_FILE = 'contract.player.ts';

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
  const player = join(root, 'games', id, PLAYER_FILE);
  return { name: id, entry: builtEntry(dist), html: join(dist, 'index.html'), ...(existsSync(player) ? { player } : {}) };
}

function listGames(): string[] {
  const games = join(root, 'games');
  if (!existsSync(games)) return [];
  return readdirSync(games, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/** The two hosts a page is played against; `page.contract.ts` reads `CONTRACT_HOST`. */
const SESSIONS = [
  { label: '', host: undefined },
  { label: ', host after onNoHost', host: 'late' },
] as const;

function play(page: Page, session: (typeof SESSIONS)[number]): boolean {
  console.log(`\n▶ ${page.name}${session.label}`);
  const result = spawnSync(
    process.execPath,
    [vitestBin, 'run', '--config', join(tool, 'dist', 'vitest.contract.config.js')],
    {
      cwd: tool,
      stdio: 'inherit',
      env: {
        ...process.env,
        CONTRACT_ENTRY: page.entry,
        CONTRACT_HTML: page.html,
        CONTRACT_NAME: page.name,
        ...(page.player ? { CONTRACT_PLAYER: page.player } : {}),
        ...(session.host ? { CONTRACT_HOST: session.host } : {}),
      },
    },
  );
  return result.status === 0;
}

function main(argv: string[]): number {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { entry: { type: 'string' }, html: { type: 'string' }, name: { type: 'string' }, player: { type: 'string' } },
  });
  let pages: Page[];
  if (values.entry !== undefined) {
    if (values.html === undefined) throw new Error('--entry needs --html');
    const entry = resolve(values.entry);
    pages = [
      {
        name: values.name ?? values.entry,
        entry,
        html: resolve(values.html),
        ...(values.player !== undefined ? { player: resolve(values.player) } : {}),
      },
    ];
  } else {
    if (!existsSync(join(root, 'deploy.config.json'))) {
      throw new Error(`no deploy.config.json in ${root}; run game-contract from the repository root`);
    }
    const ids = positionals.length > 0 ? positionals : listGames();
    if (ids.length === 0) {
      console.log('no games under games/');
      return 0;
    }
    pages = ids.map(gamePage);
  }
  const failed = pages.flatMap((page) =>
    SESSIONS.filter((session) => !play(page, session)).map((session) => `${page.name}${session.label}`),
  );
  console.log(failed.length === 0 ? `\n✓ ${pages.length} page(s) keep the game contract` : `\n✗ broke the game contract: ${failed.join('; ')}`);
  return failed.length === 0 ? 0 : 1;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
