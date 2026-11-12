import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

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

/** The repository a command runs in: the nearest folder at or above `start` that holds `deploy.config.json`. */
export function findRoot(start: string): string {
  for (let dir = resolve(start); ; dir = dirname(dir)) {
    if (existsSync(join(dir, CONFIG_FILE))) return dir;
    if (dirname(dir) === dir) throw new Error(`no ${CONFIG_FILE} in ${resolve(start)} or above; run inside the repository or pass --root`);
  }
}

/** The repository `--root` names, which must hold `deploy.config.json` as one `findRoot` finds does. */
export function namedRoot(path: string): string {
  const dir = resolve(path);
  if (!existsSync(join(dir, CONFIG_FILE))) throw new Error(`no ${CONFIG_FILE} in ${dir}; --root must name the folder that holds it`);
  return dir;
}

/** The prefix of every Pages project in a section, so no entry deploys over a package of the other kind. */
const PROJECT_PREFIX: Record<Kind, string> = { app: 'miniapp-', game: 'game-' };

export function loadConfig(root: string): DeployConfig {
  const raw: unknown = JSON.parse(readFileSync(join(root, CONFIG_FILE), 'utf8'));
  if (typeof raw !== 'object' || raw === null || !('apps' in raw)) {
    throw new Error(`${CONFIG_FILE}: expected an object with "apps"`);
  }
  const config = { ...(raw as DeployConfig) };
  const deployedBy = new Map<string, string>();
  for (const kind of KINDS) {
    const section = FOLDER[kind];
    const entries: unknown = section in raw ? (raw as Record<string, unknown>)[section] : {};
    if (typeof entries !== 'object' || entries === null || Array.isArray(entries)) {
      throw new Error(`${CONFIG_FILE}: "${section}" must be an object`);
    }
    config[section] = entries as Record<string, AppConfig>;
    for (const [id, entry] of Object.entries(config[section])) {
      const where = `${section}.${id}`;
      const project: unknown = (entry as Partial<AppConfig> | null)?.project;
      if (typeof project !== 'string') throw new Error(`${CONFIG_FILE}: ${where} has no "project"`);
      if (!project.startsWith(PROJECT_PREFIX[kind])) {
        throw new Error(`${CONFIG_FILE}: ${where} deploys to "${project}"; a ${kind === 'app' ? 'miniapp' : 'game'}'s Pages project starts with "${PROJECT_PREFIX[kind]}"`);
      }
      const other = deployedBy.get(project);
      if (other !== undefined) throw new Error(`${CONFIG_FILE}: ${where} deploys to "${project}", which ${other} deploys to`);
      deployedBy.set(project, where);
    }
  }
  return config;
}

/** The entries of one kind. */
export function entriesOf(config: DeployConfig, kind: Kind): Record<string, AppConfig> {
  return config[FOLDER[kind]];
}

/** The entry of one kind for `id`, never a property every object inherits, such as `constructor`. */
export function entryOf(config: DeployConfig, kind: Kind, id: string): AppConfig | undefined {
  const entries = entriesOf(config, kind);
  return Object.hasOwn(entries, id) ? entries[id] : undefined;
}
