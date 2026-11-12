#!/usr/bin/env node
/**
 * `game-contract`: plays every built game against the fake host and holds it
 * to the protocol contract. `USAGE` says how to run it.
 *
 * A game is played from its build: the module `dist/index.html` loads. A game
 * whose runs need playing to end ships `contract.player.ts` beside its page,
 * which plays them (`ContractPlayer` in `src/harness.ts`). Each page is played
 * twice, each time in a vitest process of its own (see `src/harness.ts` for why
 * not a browser): once with the host there almost at once, and once with a
 * host that appears only after `bootGame` called `onNoHost` (`LATE_HOST_MS`).
 * Exits 1 when a page breaks the contract, naming the rule it broke, and 2 when
 * a session ended without a verdict (`Outcome` in `src/outcome.ts`). A usage
 * error, found before any session starts, also exits 1.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { outcomeOf, type Outcome } from './outcome.ts';

const USAGE = `usage: game-contract [<id>...]
       game-contract --entry <module> --html <index.html> [--player <module>] [--name <name>]

  <id>...            play every built game under games/, or the ones named
  --entry <module>   play one page by its entry module, source or built
  --html <file>      the page's index.html, which --entry needs
  --player <module>  the module that plays the page's runs
  --name <name>      the name the report gives the page

Run it from the folder that holds deploy.config.json, after the games are built.
GAME_CONTRACT_SESSION_TIMEOUT_MS sets, in milliseconds, how long a session may run
before it is killed.
Exits 0 when every page keeps the game contract, 1 when a page breaks it or on a
usage error, and 2 when a session ends without a verdict.`;

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

/**
 * The module a built game's `index.html` loads, as a path under `dist/`: the
 * first `<script type="module" src>`, its attributes in any order, its `src`
 * from the site root (`/assets/…`) or relative to the page (`./assets/…`).
 */
function builtEntry(dist: string): string {
  const page = join(dist, 'index.html');
  for (const [, attrs = ''] of readFileSync(page, 'utf8').matchAll(/<script\b([^>]*)>/gi)) {
    if (scriptAttribute(attrs, 'type')?.toLowerCase() !== 'module') continue;
    const src = scriptAttribute(attrs, 'src');
    if (src === undefined) continue;
    if (/^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i.test(src)) throw new Error(`${page} loads its module script from another origin: ${src}`);
    return src.startsWith('/') ? join(dist, src) : resolve(dist, src);
  }
  throw new Error(`${page} loads no module script`);
}

/** An attribute's value, quoted or bare; `undefined` when the tag has none. */
function scriptAttribute(attrs: string, name: string): string | undefined {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i').exec(attrs);
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : undefined;
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

/** The caller's environment without the session's own keys, which `play` sets per page and session. */
const { CONTRACT_ENTRY: _entry, CONTRACT_HTML: _html, CONTRACT_NAME: _name, CONTRACT_PLAYER: _player, CONTRACT_HOST: _host, ...inheritedEnv } = process.env;

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
        ...inheritedEnv,
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
    options: {
      entry: { type: 'string' },
      html: { type: 'string' },
      name: { type: 'string' },
      player: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(USAGE);
    return 0;
  }
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
