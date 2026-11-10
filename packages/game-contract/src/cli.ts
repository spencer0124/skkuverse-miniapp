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
 * Exits 1 when a page breaks the contract, naming the rule it broke, and 2 when
 * a session ended without a verdict (`Outcome` in `src/outcome.ts`).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { outcomeOf, type Outcome } from './outcome.ts';

const tool = resolve(import.meta.dirname, '..');
const root = process.cwd();

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

/**
 * How long one session may run before it is killed: the page contract's
 * two-minute test timeout and a minute for vitest to start and stop. A page
 * stuck in a synchronous loop never lets that test timeout fire.
 */
const SESSION_TIMEOUT_MS = 180_000;

function sessionTimeoutMs(): number {
  const value = process.env.GAME_CONTRACT_SESSION_TIMEOUT_MS;
  if (value === undefined) return SESSION_TIMEOUT_MS;
  const ms = Number(value);
  if (!Number.isInteger(ms) || ms <= 0) {
    throw new Error(`GAME_CONTRACT_SESSION_TIMEOUT_MS must be a whole number of milliseconds above 0, not ${value}`);
  }
  return ms;
}

function play(page: Page, session: (typeof SESSIONS)[number], timeout: number): Outcome {
  const name = `${page.name}${session.label}`;
  console.log(`\n▶ ${name}`);
  const result = spawnSync(
    process.execPath,
    [join(tool, 'dist', 'session.js')],
    {
      cwd: tool,
      stdio: 'inherit',
      timeout,
      killSignal: 'SIGKILL',
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
  if ((result.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT') {
    console.log(`\n✗ ${name} did not finish within ${timeout / 1000} s, so its session was killed`);
  }
  return outcomeOf(result.status);
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
  const timeout = sessionTimeoutMs();
  const played = pages.flatMap((page) =>
    SESSIONS.map((session) => ({ name: `${page.name}${session.label}`, outcome: play(page, session, timeout) })),
  );
  const named = (outcome: Outcome) => played.filter((p) => p.outcome === outcome).map((p) => p.name);
  const broken = named('broken');
  const errors = named('error');
  if (broken.length === 0 && errors.length === 0) {
    console.log(`\n✓ ${pages.length} page(s) keep the game contract`);
    return 0;
  }
  if (broken.length > 0) console.log(`\n✗ broke the game contract: ${broken.join('; ')}`);
  if (errors.length > 0) console.log(`\n✗ runner error, contract not checked: ${errors.join('; ')}`);
  return errors.length > 0 ? 2 : 1;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
