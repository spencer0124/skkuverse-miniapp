import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The two kinds of package the platform hosts. The folder is the kind: a
 * package under `apps/` is a miniapp and one under `games/` is a game. They
 * share the id namespace (spec G1) and nothing that grants trust.
 */
export type Kind = 'app' | 'game';

export const KINDS: readonly Kind[] = ['app', 'game'];

/** The repository folder, and the `deploy.config.json` section, of each kind. */
export const FOLDER: Record<Kind, 'apps' | 'games'> = { app: 'apps', game: 'games' };

/** The host every package of a kind is served at, unless its entry names an exception (spec R4). */
const HOST_SUFFIX: Record<Kind, string> = { app: 'mini.skkuverse.com', game: 'game.skkuverse.com' };

/** One package's line in `deploy.config.json`, a miniapp's or a game's. */
export interface AppConfig {
  /** The Cloudflare Pages project `ship` deploys to (`miniapp-<id>` or `game-<id>`). */
  project: string;
  /** Set only for an exception to the kind's host rule (spec R4). */
  host?: string;
  /** Why the host is an exception. Required with `host`. */
  hostReason?: string;
  /** A first-party same-origin Functions backend (spec B1). Never on a game (spec G3). */
  backend?: 'functions';
}

export interface DeployConfig {
  apps: Record<string, AppConfig>;
  games: Record<string, AppConfig>;
}

export const CONFIG_FILE = 'deploy.config.json';

export function hostFor(id: string, entry: AppConfig | undefined, kind: Kind = 'app'): string {
  return entry?.host ?? `${id}.${HOST_SUFFIX[kind]}`;
}

export function parseKind(value: string): Kind {
  if ((KINDS as readonly string[]).includes(value)) return value as Kind;
  throw new Error(`--kind must be one of ${KINDS.join(', ')}; got "${value}"`);
}

export function loadConfig(root: string): DeployConfig {
  const raw: unknown = JSON.parse(readFileSync(join(root, CONFIG_FILE), 'utf8'));
  if (typeof raw !== 'object' || raw === null || !('apps' in raw)) {
    throw new Error(`${CONFIG_FILE}: expected an object with "apps"`);
  }
  const games = 'games' in raw ? raw.games : {};
  if (typeof games !== 'object' || games === null || Array.isArray(games)) {
    throw new Error(`${CONFIG_FILE}: "games" must be an object`);
  }
  return { ...(raw as DeployConfig), games: games as DeployConfig['games'] };
}

/** The entries of one kind. */
export function entriesOf(config: DeployConfig, kind: Kind): Record<string, AppConfig> {
  return config[FOLDER[kind]];
}
