/**
 * The mechanical half of the miniapp spec. Each finding names the rule it
 * enforces; the rules themselves are defined in skkuverse-miniapp
 * `docs/reference/miniapp-spec.md`. Rules marked [review] there are not here.
 *
 * The check reads the source tree and the built `dist/`, so run it after
 * `build`. It never builds, installs or fetches anything.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { parseShellFields } from '@skkuverse/miniapp/protocol';
import { hostFor, type AppConfig } from './config.ts';

export type RuleId =
  | 'R1' | 'R2' | 'R3' | 'R4'
  | 'S1' | 'S2' | 'S3' | 'S4'
  | 'O1' | 'O2' | 'O3' | 'O4'
  | 'H1' | 'M1' | 'B1';

export interface Finding {
  rule: RuleId;
  level: 'error' | 'warn';
  message: string;
}

export interface CheckTarget {
  id: string;
  /** The miniapp package directory (`apps/<id>`). */
  dir: string;
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

export function checkApp(target: CheckTarget): Finding[] {
  const out: Finding[] = [];
  const add = (rule: RuleId, message: string, level: Finding['level'] = 'error') =>
    out.push({ rule, level, message });
  const { id, dir, config } = target;

  // R1
  if (!ID_PATTERN.test(id)) add('R1', `id "${id}" must match ${ID_PATTERN}`);
  if (basename(dir) !== id) add('R1', `directory "${basename(dir)}" must be named after the id "${id}"`);

  // S1
  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(dir, file))) add('S1', `missing ${file}`);
  }

  // S2, S3
  const pkg = readJson(join(dir, 'package.json'));
  if (isRecord(pkg)) {
    const scripts = isRecord(pkg.scripts) ? pkg.scripts : {};
    for (const name of REQUIRED_SCRIPTS) {
      if (typeof scripts[name] !== 'string') add('S3', `package.json has no "${name}" script`);
    }
    const deps = { ...asRecord(pkg.dependencies), ...asRecord(pkg.devDependencies) };
    for (const name of REQUIRED_DEPENDENCIES) {
      if (!(name in deps)) add('S2', `package.json does not depend on ${name}`);
    }
  } else if (existsSync(join(dir, 'package.json'))) {
    add('S1', 'package.json is not a JSON object');
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
  const main = readText(join(dir, 'src', 'main.tsx'));
  if (main !== null) checkRoot(main, id, add);

  // R4
  if (config !== null) {
    const host = hostFor(id, config);
    if (config.host !== undefined) {
      if (!config.hostReason) add('R4', `host ${host} is an exception and needs a hostReason`);
      else add('R4', `host ${host} is an exception: ${config.hostReason}`, 'warn');
    }
  }

  // B1
  const hasFunctions = existsSync(join(dir, 'functions'));
  if (config?.backend === 'functions') {
    if (!hasFunctions) add('B1', 'declares backend "functions" but has no functions/ directory');
    if (!existsSync(join(dir, 'wrangler.toml'))) add('B1', 'declares backend "functions" but has no wrangler.toml');
  } else if (hasFunctions) {
    add('B1', 'has a functions/ directory but deploy.config.json does not declare backend "functions"');
  }

  checkDist(join(dir, 'dist'), add);
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

function checkDist(dist: string, add: Add): void {
  if (!existsSync(dist)) {
    add('O1', 'no dist/ (run the build first)');
    return;
  }
  for (const file of ['index.html', 'skkuverse.json']) {
    if (!existsSync(join(dist, file))) add('O1', `dist/ has no ${file}`);
  }

  // O2
  for (const name of PLATFORM_FILES) {
    if (existsSync(join(dist, name))) add('O2', `dist/${name} is platform-owned or server code; remove it from the miniapp`);
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
  checkManifest(join(dist, 'skkuverse.json'), add);
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
