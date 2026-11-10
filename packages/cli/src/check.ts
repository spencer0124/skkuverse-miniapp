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
import { entryOf, FOLDER, hostFor, type AppConfig, type DeployConfig, type Kind } from './config.ts';

/**
 * Every rule `check` raises, with the anchor of the spec heading that defines
 * it (`docs/reference/miniapp-spec.md`). `spec-coverage.test.ts` holds this
 * table, the spec's tables and the tests to one set of rules and one set of
 * headings, so a rule added to the spec or to the checker fails the build until
 * the other side has it.
 */
export const RULE_SECTIONS = {
  R1: 'identity', R2: 'identity', R3: 'identity', R4: 'identity', G1: 'identity',
  S1: 'package', S2: 'package', S3: 'package', S4: 'package',
  O1: 'build-output', O2: 'build-output', O3: 'build-output', O4: 'build-output',
  H1: 'page', G2: 'page',
  M1: 'manifest',
  B1: 'backend', G3: 'backend',
  G4: 'what-the-platform-writes', G5: 'what-the-platform-writes',
} as const;

export type RuleId = keyof typeof RULE_SECTIONS;

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
/**
 * The lowest `@skkuverse/miniapp` a miniapp or a game may ship with (S4). One
 * floor for both kinds, so it moves only for what both need: a game's own
 * behaviour, such as coming back from a late host, is held by `game-contract`.
 */
export const SDK_FLOOR = '0.4.0';
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
/**
 * What the game headers let a URL in the built page load (G5), by the element
 * that names it. `data` is true where the policy allows inline data: images
 * (`img-src 'self' data:`) and media (`media-src 'self' data:`). Fonts, styles
 * and links fall to `default-src 'self'`, and frames and plugins are closed.
 * A `<script src>` is H1's, for both kinds.
 */
const GAME_URL_ATTRIBUTES: Readonly<Record<string, readonly { attr: string; data: boolean; list?: boolean }[]>> = {
  img: [{ attr: 'src', data: true }, { attr: 'srcset', data: true, list: true }],
  input: [{ attr: 'src', data: true }],
  audio: [{ attr: 'src', data: true }],
  video: [{ attr: 'src', data: true }, { attr: 'poster', data: true }],
  source: [{ attr: 'src', data: true }, { attr: 'srcset', data: true, list: true }],
  track: [{ attr: 'src', data: true }],
  link: [{ attr: 'href', data: false }],
};
/** Elements the game headers never load: `frame-src 'none'`, `object-src 'none'`. */
const GAME_CLOSED_ELEMENTS = new Set(['iframe', 'frame', 'object', 'embed']);

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
  if (config !== null && entryOf(config, 'app', id) !== undefined) {
    out.push({ rule: 'G1', level: 'error', message: `deploy.config.json lists ${id} under "apps"` });
  }
  return out;
}

type Add = (rule: RuleId, message: string, level?: Finding['level']) => void;

/**
 * R2, R3 over every `<MiniappRoot>` tag outside a comment, so a tag the page
 * does not render cannot stand in for the one it does.
 */
function checkRoot(source: string, id: string, add: Add): void {
  // Props must be literals for this to read them, which is also what makes
  // them reviewable. A `>` inside an expression prop would end the match early.
  const tags = [...stripComments(source).matchAll(/<MiniappRoot\b([^>]*)>/g)];
  if (tags.length === 0) {
    add('R2', 'src/main.tsx does not render <MiniappRoot>');
    return;
  }
  for (const tag of tags) {
    const props = tag[1] ?? '';
    if (/\{\s*\.\.\./.test(props)) add('R2', '<MiniappRoot> takes no spread props; a spread could replace its literal id');
    const rootId = /\bid=["']([^"']*)["']/.exec(props)?.[1];
    if (rootId === undefined) add('R2', '<MiniappRoot> needs a string literal id');
    else if (rootId !== id) add('R2', `<MiniappRoot id="${rootId}"> does not match the id "${id}"`);
    const browser = /\bbrowser=["']([^"']*)["']/.exec(props)?.[1];
    if (browser === undefined) add('R3', '<MiniappRoot> needs an explicit browser="block" or browser="allow"');
    else if (browser !== 'block' && browser !== 'allow') add('R3', `browser="${browser}" is neither "block" nor "allow"`);
  }
}

/**
 * G2: a game reaches the host only through `bootGame`. Reads every source file
 * under `src/`, comments aside, for the bridge and the host globals.
 */
function checkGameSource(dir: string, add: Add): void {
  const src = join(dir, 'src');
  if (!existsSync(src)) {
    add('G2', `no src/, so nothing shows the page boots through bootGame from ${GAME_CLIENT}`);
    return;
  }
  let boots = false;
  for (const file of walk(src)) {
    if (!SOURCE_FILE.test(file)) continue;
    const text = stripComments(readText(file) ?? '');
    if (callsBootGame(text)) boots = true;
    const lines = text.split('\n');
    for (const { pattern, what } of HOST_REACH) {
      const line = lines.findIndex((l) => pattern.test(l));
      if (line >= 0) add('G2', `${relative(dir, file)}:${line + 1} ${what}; only bootGame from ${GAME_CLIENT} may`);
    }
  }
  if (!boots) add('G2', `src/ does not call bootGame imported from ${GAME_CLIENT}`);
}

/**
 * Whether one source file imports `bootGame` from the game client and calls
 * it, by the name it imported it under or through a namespace import.
 */
function callsBootGame(source: string): boolean {
  const from = String.raw`\s*from\s*['"]${escapeRegExp(GAME_CLIENT)}['"]`;
  const callees: string[] = [];
  for (const [, names = ''] of source.matchAll(new RegExp(String.raw`\bimport\s*(?:[A-Za-z_$][\w$]*\s*,\s*)?\{([^}]*)\}${from}`, 'g'))) {
    for (const name of names.split(',')) {
      const local = /^\s*bootGame(?:\s+as\s+([A-Za-z_$][\w$]*))?\s*$/.exec(name);
      if (local) callees.push(escapeRegExp(local[1] ?? 'bootGame'));
    }
  }
  for (const [, ns = ''] of source.matchAll(new RegExp(String.raw`\bimport\s*\*\s*as\s+([A-Za-z_$][\w$]*)${from}`, 'g'))) {
    callees.push(String.raw`${escapeRegExp(ns)}\s*\.\s*bootGame`);
  }
  return callees.some((callee) => new RegExp(String.raw`(?<![\w$.])${callee}\s*\(`).test(source));
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
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
  else checkGameOutput(dist, files, add);
}

/**
 * G5: what the build loads stays inside the game headers (G4). A page that
 * breaks them still deploys, and fails only in the web view, so the check
 * reads the output the way the policy will: HTML, CSS and the sound a script
 * would fetch.
 */
function checkGameOutput(dist: string, files: readonly string[], add: Add): void {
  const scripts: { rel: string; text: string }[] = [];
  for (const file of files) {
    const rel = `dist/${relative(dist, file)}`;
    if (file.endsWith('.html')) checkGameHtml(rel, readText(file) ?? '', add);
    else if (file.endsWith('.css')) checkGameCss(rel, readText(file) ?? '', add);
    else if (/\.[cm]?js$/.test(file)) scripts.push({ rel, text: readText(file) ?? '' });
  }
  // Web Audio decodes bytes a fetch returned, and `connect-src 'self'` blocks
  // fetching a data: URI. Played through <audio> instead, inline audio is
  // allowed (media-src data:), so only a page that decodes is held to files.
  if (scripts.some((s) => s.text.includes('decodeAudioData'))) {
    for (const { rel, text } of scripts) {
      if (/data:audio\//i.test(text)) {
        add('G5', `${rel} inlines a data:audio URI, and the page decodes sound through fetch, which connect-src 'self' blocks for data: URIs; keep the sound a file (assetsInlineLimit)`);
      }
    }
  }
}

function checkGameHtml(rel: string, source: string, add: Add): void {
  // A space, not nothing: the text on either side of a comment must not join into a tag.
  const html = source.replace(/<!--[\s\S]*?-->/g, ' ');
  if (/<style\b/i.test(html)) add('G5', `${rel}: an inline <style> is blocked by the game headers (default-src 'self'); move it to a .css file`);
  for (const match of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    const name = (match[1] ?? '').toLowerCase();
    const attrs = match[2] ?? '';
    if (attribute(attrs, 'style') !== undefined) {
      add('G5', `${rel}: a style= attribute on <${name}> is blocked by the game headers; style it from a .css file`);
    }
    if (GAME_CLOSED_ELEMENTS.has(name)) {
      add('G5', `${rel}: <${name}> is blocked by the game headers (frame-src and object-src 'none')`);
      continue;
    }
    for (const { attr, data, list } of GAME_URL_ATTRIBUTES[name] ?? []) {
      const value = attribute(attrs, attr);
      if (value === undefined) continue;
      // An icon is an image to the policy (img-src data:); any other link is not.
      const allowData = data || (name === 'link' && /\bicon\b/i.test(attribute(attrs, 'rel') ?? ''));
      for (const url of list ? srcsetUrls(value) : [value]) {
        const where = originOf(url);
        if (where === 'other' || (where === 'data' && !allowData)) {
          add('G5', `${rel}: <${name} ${attr}="${shorten(url)}"> is blocked by the game headers; load it from the game's own origin${data ? ' or inline it as data' : ''}`);
        }
      }
    }
  }
}

function checkGameCss(rel: string, source: string, add: Add): void {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  // Fonts fall to default-src 'self': a file on the game's own origin, never
  // inline data. Vite inlines a font under its size limit, so a small one does.
  for (const face of css.matchAll(/@font-face\s*\{[^}]*\}/gi)) {
    for (const url of cssUrls(face[0])) {
      const where = originOf(url);
      if (where === 'data') add('G5', `${rel}: an @font-face src of url(${shorten(url)}) is blocked by the game headers (default-src 'self'); emit the font as a file`);
      else if (where === 'other') add('G5', `${rel}: an @font-face src of url(${shorten(url)}) is off the game's origin and blocked by the game headers`);
    }
  }
  const rest = css.replace(/@font-face\s*\{[^}]*\}/gi, '');
  for (const imp of rest.matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi)) {
    if (originOf(imp[1] ?? '') !== 'self') add('G5', `${rel}: @import of ${shorten(imp[1] ?? '')} is blocked by the game headers; bundle the stylesheet`);
  }
  // Everything else a stylesheet loads is an image (img-src 'self' data:).
  for (const url of cssUrls(rest.replace(/@import[^;]*;?/gi, ''))) {
    if (originOf(url) === 'other') add('G5', `${rel}: url(${shorten(url)}) is off the game's origin and blocked by the game headers`);
  }
}

/** Where a URL in the page points, as the game headers see it. */
function originOf(url: string): 'self' | 'data' | 'other' {
  const u = url.trim();
  if (/^data:/i.test(u)) return 'data';
  // Protocol-relative, including the backslash forms a browser reads as `//`.
  if (/^[\\/]{2}/.test(u)) return 'other';
  return /^[a-z][a-z0-9+.-]*:/i.test(u) ? 'other' : 'self';
}

/** An attribute's value, quoted or bare; `undefined` when the tag has none. */
function attribute(attrs: string, name: string): string | undefined {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i').exec(attrs);
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : undefined;
}

/** The URLs of a `srcset`. A data: URL holds a comma, so a candidate runs to whitespace. */
function srcsetUrls(value: string): string[] {
  return [...value.matchAll(/(?:^|,)\s*([^\s,][^\s]*)/g)].map((m) => (m[1] ?? '').replace(/,$/, ''));
}

function cssUrls(css: string): string[] {
  return [...css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)].map((m) => m[1] ?? m[2] ?? m[3] ?? '');
}

function shorten(url: string): string {
  return url.length > 60 ? `${url.slice(0, 57)}...` : url;
}

function checkHtml(html: string, add: Add): void {
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) add('H1', 'index.html: <html> has no lang');
  const viewport = /<meta\b[^>]*\bname=["']viewport["'][^>]*>/i.exec(html)?.[0];
  if (!viewport) add('H1', 'index.html: no viewport <meta>');
  else if (!/viewport-fit\s*=\s*cover/i.test(viewport)) add('H1', 'index.html: the viewport <meta> needs viewport-fit=cover');

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi)) {
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
