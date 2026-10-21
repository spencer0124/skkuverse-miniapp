/**
 * The mechanical half of the miniapp spec. Each finding names the rule it
 * enforces; the rules themselves are defined in skkuverse-miniapp
 * `docs/reference/miniapp-spec.md`. Rules marked [review] there are not here.
 *
 * The check reads the source tree and the built `dist/`, so run it after
 * `build`. It never builds, installs or fetches anything.
 *
 * Each rule applies to miniapps, games or both (the spec's For column). A rule
 * for one kind is never checked against the other.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { parseShellFields } from '@skkuverse/miniapp/protocol';
import { FOLDER, hostFor, type AppConfig, type DeployConfig, type Kind } from './config.ts';

export type RuleId =
  | 'R1' | 'R2' | 'R3' | 'R4'
  | 'S1' | 'S2' | 'S3' | 'S4'
  | 'O1' | 'O2' | 'O3' | 'O4'
  | 'H1' | 'M1' | 'B1'
  | 'G1' | 'G2' | 'G3' | 'G4';

export interface Finding {
  rule: RuleId;
  level: 'error' | 'warn';
  message: string;
}

export interface CheckTarget {
  id: string;
  /** The package directory (`apps/<id>` or `games/<id>`). */
  dir: string;
  /** Which rules apply. A miniapp when left out. */
  kind?: Kind;
  /**
   * The operator's deploy entry. `null` checks a miniapp nobody has registered
   * yet (a club's submission), which skips R4 and treats B1 as undeclared.
   */
  config: AppConfig | null;
}

export const ID_PATTERN = /^[a-z0-9-]+$/;
/** The lowest `@skkuverse/miniapp` a miniapp may ship with (S4). */
export const SDK_FLOOR = '0.3.0';
export const REQUIRED_FILES = [
  'package.json',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'public/skkuverse.json',
  'src/main.tsx',
  'README.md',
] as const;
export const REQUIRED_SCRIPTS = ['dev', 'build', 'typecheck'] as const;
export const REQUIRED_DEPENDENCIES = ['@skkuverse/miniapp', 'react', 'react-dom', 'vite', 'typescript'] as const;
/** Files only the platform writes, or that would run server code (O2). */
export const PLATFORM_FILES = ['_headers', '_redirects', '_routes.json', '_worker.js', 'functions'] as const;
// Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
export const MAX_FILES = 20_000;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** The server's manifest fetch cap (skkuverse-server `miniapps.manifest.ts`). */
export const MAX_MANIFEST_BYTES = 16 * 1024;
const SHELL_KEYS = ['bar', 'header', 'statusBar', 'background'] as const;
/** Vite names emitted assets `<name>-<hash>.<ext>`; the immutable cache relies on it. */
const HASHED_ASSET = /-[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/;
/** `<script type>` values a browser does not execute, which CSP does not govern. */
const DATA_SCRIPT_TYPES = new Set(['application/json', 'application/ld+json', 'importmap']);
/** Where a game's page code lives; G2 reads it. */
const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/;
/** The module a game boots through (G2). */
export const GAME_CLIENT = '@skkuverse/miniapp/game';
/**
 * What only `bootGame` may touch (G2): the native bridge, and the host globals
 * as properties of the global object, by dot, bracket or `defineProperty`.
 */
const HOST_REACH: readonly { pattern: RegExp; what: string }[] = [
  { pattern: /\bReactNativeWebView\b/, what: 'reaches window.ReactNativeWebView itself' },
  { pattern: /\b__host\b/, what: 'touches the retired window.__host' },
  {
    pattern: /\b(?:window|globalThis|self)\s*(?:\?\.|\.)\s*skkuverse\b|\[\s*['"`]skkuverse['"`]\s*\]|defineProperty\(\s*(?:window|globalThis|self)\s*,\s*['"`]skkuverse['"`]/,
    what: 'reads, defines or replaces window.skkuverse itself',
  },
];
/** Header files a game might ship next to its build; only `ship` writes headers (G4). */
const GAME_HEADER_FILES = ['_headers', 'public/_headers'] as const;

export function checkApp(target: CheckTarget): Finding[] {
  const out: Finding[] = [];
  const add = (rule: RuleId, message: string, level: Finding['level'] = 'error') =>
    out.push({ rule, level, message });
  const { id, dir, config } = target;
  const kind = target.kind ?? 'app';
  const app = kind === 'app';

  // R1
  if (!ID_PATTERN.test(id)) add('R1', `id "${id}" must match ${ID_PATTERN}`);
  if (basename(dir) !== id) add('R1', `directory "${basename(dir)}" must be named after the id "${id}"`);

  // S1
  if (app) {
    for (const file of REQUIRED_FILES) {
      if (!existsSync(join(dir, file))) add('S1', `missing ${file}`);
    }
  }

  // S2 (miniapps), S3
  const pkg = readJson(join(dir, 'package.json'));
  if (isRecord(pkg)) {
    const scripts = isRecord(pkg.scripts) ? pkg.scripts : {};
    for (const name of REQUIRED_SCRIPTS) {
      if (typeof scripts[name] !== 'string') add('S3', `package.json has no "${name}" script`);
    }
    const deps = { ...asRecord(pkg.dependencies), ...asRecord(pkg.devDependencies) };
    if (app) {
      for (const name of REQUIRED_DEPENDENCIES) {
        if (!(name in deps)) add('S2', `package.json does not depend on ${name}`);
      }
    }
  } else if (existsSync(join(dir, 'package.json'))) {
    add(app ? 'S1' : 'S3', 'package.json is not a JSON object');
  } else if (!app) {
    add('S3', 'missing package.json');
  }

  // S4: the installed copy, not the declared range. A 0.x caret never crosses
  // a minor, so `^0.2.1` silently stays below the floor.
  const sdkPkg = readJson(join(dir, 'node_modules', '@skkuverse', 'miniapp', 'package.json'));
  const sdkVersion = isRecord(sdkPkg) && typeof sdkPkg.version === 'string' ? sdkPkg.version : null;
  if (sdkVersion === null) {
    add('S4', '@skkuverse/miniapp is not installed (run pnpm install)');
  } else if (compareVersions(sdkVersion, SDK_FLOOR) < 0) {
    add('S4', `@skkuverse/miniapp ${sdkVersion} is below the floor ${SDK_FLOOR}`);
  }

  // R2, R3
  if (app) {
    const main = readText(join(dir, 'src', 'main.tsx'));
    if (main !== null) checkRoot(main, id, add);
  }

  // R4
  if (config !== null) {
    const host = hostFor(id, config, kind);
    if (config.host !== undefined) {
      if (!config.hostReason) add('R4', `host ${host} is an exception and needs a hostReason`);
      else add('R4', `host ${host} is an exception: ${config.hostReason}`, 'warn');
    }
  }

  const hasFunctions = existsSync(join(dir, 'functions'));
  if (app) {
    // B1
    if (config?.backend === 'functions') {
      if (!hasFunctions) add('B1', 'declares backend "functions" but has no functions/ directory');
      if (!existsSync(join(dir, 'wrangler.toml'))) add('B1', 'declares backend "functions" but has no wrangler.toml');
    } else if (hasFunctions) {
      add('B1', 'has a functions/ directory but deploy.config.json does not declare backend "functions"');
    }
  } else {
    // G3
    if (hasFunctions) add('G3', 'a game has no backend; remove functions/');
    if (config?.backend !== undefined) add('G3', `a game has no backend; remove "backend" from its deploy.config.json entry`);
    // G4
    for (const file of GAME_HEADER_FILES) {
      if (existsSync(join(dir, file))) add('G4', `${file}: a game ships no headers of its own; ship writes the game headers`);
    }
    // G2
    checkGameSource(dir, add);
  }

  checkDist(join(dir, 'dist'), kind, add);
  return out;
}

/**
 * G1, for a game: the id names no other package. `dir` is the game being
 * checked, which may sit outside the repository (`check --dir`); a folder at
 * the same path is the game itself.
 */
export function checkIdNamespace(root: string, id: string, dir: string, config: DeployConfig | null): Finding[] {
  const out: Finding[] = [];
  const self = resolve(dir);
  const inRepo = self === resolve(root, FOLDER.game, id);
  const appDir = join(root, FOLDER.app, id);
  if (existsSync(appDir)) {
    const where = inRepo ? `${FOLDER.game}/${id}` : `the game at ${dir}`;
    out.push({ rule: 'G1', level: 'error', message: `${where} and ${FOLDER.app}/${id} share the id` });
  }
  if (!inRepo && existsSync(join(root, FOLDER.game, id))) {
    out.push({ rule: 'G1', level: 'error', message: `the id is taken by ${FOLDER.game}/${id}` });
  }
  if (config !== null && id in config.apps) {
    out.push({ rule: 'G1', level: 'error', message: `deploy.config.json lists ${id} under "apps"` });
  }
  return out;
}

type Add = (rule: RuleId, message: string, level?: Finding['level']) => void;

function checkRoot(source: string, id: string, add: Add): void {
  // Props must be literals for this to read them, which is also what makes
  // them reviewable. A `>` inside an expression prop would end the match early.
  const tag = /<MiniappRoot\b([^>]*)>/.exec(source);
  if (!tag) {
    add('R2', 'src/main.tsx does not render <MiniappRoot>');
    return;
  }
  const props = tag[1] ?? '';
  const rootId = /\bid=["']([^"']*)["']/.exec(props)?.[1];
  if (rootId === undefined) add('R2', '<MiniappRoot> needs a string literal id');
  else if (rootId !== id) add('R2', `<MiniappRoot id="${rootId}"> does not match the id "${id}"`);
  const browser = /\bbrowser=["']([^"']*)["']/.exec(props)?.[1];
  if (browser === undefined) add('R3', '<MiniappRoot> needs an explicit browser="block" or browser="allow"');
  else if (browser !== 'block' && browser !== 'allow') add('R3', `browser="${browser}" is neither "block" nor "allow"`);
}

/**
 * G2: a game reaches the host only through `bootGame`. Reads every source file
 * under `src/`, comments aside, for the bridge and the host globals.
 */
function checkGameSource(dir: string, add: Add): void {
  const src = join(dir, 'src');
  if (!existsSync(src)) return;
  let boots = false;
  for (const file of walk(src)) {
    if (!SOURCE_FILE.test(file)) continue;
    const text = stripComments(readText(file) ?? '');
    if (text.includes(`'${GAME_CLIENT}'`) || text.includes(`"${GAME_CLIENT}"`)) boots = true;
    const lines = text.split('\n');
    for (const { pattern, what } of HOST_REACH) {
      const line = lines.findIndex((l) => pattern.test(l));
      if (line >= 0) add('G2', `${relative(dir, file)}:${line + 1} ${what}; only bootGame from ${GAME_CLIENT} may`);
    }
  }
  // An error once @skkuverse/miniapp ships ./game (0.4.0) and the template boots through it.
  if (!boots) add('G2', `src/ does not import bootGame from ${GAME_CLIENT} yet`, 'warn');
}

/** Blanks comments out, keeping every line where it was. */
function stripComments(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, ' ');
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[\s;{}(),])(\/\/.*)$/gm, (_, lead: string, comment: string) => lead + blank(comment));
}

function checkDist(dist: string, kind: Kind, add: Add): void {
  if (!existsSync(dist)) {
    add('O1', 'no dist/ (run the build first)');
    return;
  }
  for (const file of kind === 'app' ? ['index.html', 'skkuverse.json'] : ['index.html']) {
    if (!existsSync(join(dist, file))) add('O1', `dist/ has no ${file}`);
  }

  // O2
  for (const name of PLATFORM_FILES) {
    if (existsSync(join(dist, name))) add('O2', `dist/${name} is platform-owned or server code; remove it from the ${kind === 'app' ? 'miniapp' : 'game'}`);
  }

  // O3, O4, and 404.html at any depth (Pages uses the nearest one, which
  // turns off the single-page fallback for that subtree).
  const files = walk(dist);
  if (files.length > MAX_FILES) add('O4', `dist/ has ${files.length} files; the limit is ${MAX_FILES}`);
  for (const file of files) {
    const rel = relative(dist, file);
    if (basename(file) === '404.html') add('O2', `dist/${rel}: a 404.html replaces the single-page fallback`);
    if (statSync(file).size > MAX_FILE_BYTES) add('O4', `dist/${rel} is larger than 25 MiB`);
    if (rel.startsWith(`assets/`) && !HASHED_ASSET.test(basename(file))) {
      add('O3', `dist/${rel} has no content hash but is served as immutable`);
    }
  }

  const html = readText(join(dist, 'index.html'));
  if (html !== null) checkHtml(html, add);
  if (kind === 'app') checkManifest(join(dist, 'skkuverse.json'), add);
}

function checkHtml(html: string, add: Add): void {
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) add('H1', 'index.html: <html> has no lang');
  const viewport = /<meta\b[^>]*\bname=["']viewport["'][^>]*>/i.exec(html)?.[0];
  if (!viewport) add('H1', 'index.html: no viewport <meta>');
  else if (!/viewport-fit\s*=\s*cover/i.test(viewport)) add('H1', 'index.html: the viewport <meta> needs viewport-fit=cover');

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = match[1] ?? '';
    const body = match[2] ?? '';
    const type = /\btype=["']([^"']*)["']/i.exec(attrs)?.[1]?.toLowerCase();
    if (type !== undefined && DATA_SCRIPT_TYPES.has(type)) continue;
    const src = /\bsrc=["']([^"']*)["']/i.exec(attrs)?.[1];
    if (src === undefined) {
      if (body.trim() !== '') add('H1', 'index.html: an inline <script> is blocked by the CSP');
      else add('H1', 'index.html: a <script> without src');
    } else if (!src.startsWith('/') || src.startsWith('//')) {
      add('H1', `index.html: <script src="${src}"> must be same-origin and root-absolute`);
    }
  }
  for (const tag of html.matchAll(/<[a-z][^>]*>/gi)) {
    const handler = /\s(on[a-z]+)\s*=/i.exec(tag[0]);
    if (handler) add('H1', `index.html: an inline ${handler[1]} handler is blocked by the CSP`);
  }
}

function checkManifest(path: string, add: Add): void {
  if (!existsSync(path)) return; // O1 already reported it
  const bytes = statSync(path).size;
  if (bytes > MAX_MANIFEST_BYTES) add('M1', `skkuverse.json is ${bytes} bytes; the server reads at most ${MAX_MANIFEST_BYTES}`);
  const raw = readJson(path);
  if (!isRecord(raw)) {
    add('M1', 'skkuverse.json is not a JSON object');
    return;
  }
  for (const key of Object.keys(raw)) {
    if (key !== 'shell') add('M1', `skkuverse.json: unknown top-level key "${key}"`);
  }
  const shell = raw.shell;
  if (!isRecord(shell)) {
    add('M1', 'skkuverse.json: "shell" must be an object');
    return;
  }
  // The SDK's parser drops anything it cannot use without saying so. Diffing
  // its output against the input turns each silent drop into an error.
  const parsed: Record<string, unknown> = { ...parseShellFields(shell) };
  for (const key of Object.keys(shell)) {
    if (!(SHELL_KEYS as readonly string[]).includes(key)) add('M1', `skkuverse.json: unknown shell key "${key}"`);
  }
  for (const key of SHELL_KEYS) {
    if (!(key in shell)) add('M1', `skkuverse.json: shell.${key} is missing`);
    else if (!(key in parsed)) add('M1', `skkuverse.json: shell.${key} = ${JSON.stringify(shell[key])} is not a valid value`);
  }
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

/** -1, 0 or 1. Plain `major.minor.patch`; a prerelease tag ranks below its release. */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [core = '', pre] = v.split('-', 2);
    const nums = core.split('.').map((n) => Number.parseInt(n, 10) || 0);
    return { nums, pre };
  };
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    const d = (pa.nums[i] ?? 0) - (pb.nums[i] ?? 0);
    if (d !== 0) return Math.sign(d);
  }
  if (pa.pre !== undefined && pb.pre === undefined) return -1;
  if (pa.pre === undefined && pb.pre !== undefined) return 1;
  return 0;
}

function readText(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function readJson(path: string): unknown {
  const text = readText(path);
  if (text === null) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}
