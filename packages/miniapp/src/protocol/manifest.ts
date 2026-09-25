/**
 * The shell a miniapp asks the app to draw around it.
 *
 * A miniapp declares it in `public/skkuverse.json`, served from its own
 * origin. skkuverse-server fetches that file for first-party miniapps and
 * merges it into the registry's `GET /miniapps/:id`, so the app knows the shell
 * before it creates the WebView and the first frame is already right.
 * `shell.set` changes the parts that may change mid-session.
 *
 * Parsing is tolerant everywhere: an unknown key or a bad value is dropped and
 * the default takes its place. A miniapp with a broken manifest still opens.
 */

export type ShellBar = 'top' | 'bottom' | 'none';
export type ShellHeader = 'opaque' | 'overlay';
export type ShellStatusBar = 'dark' | 'light';

export interface ShellConfig {
  /**
   * Where the app draws the miniapp's name pill.
   * - `top`: in the header, beside the back button.
   * - `bottom`: a floating bar at the bottom with back/forward buttons.
   * - `none`: nowhere. The header keeps only back and more.
   */
  bar: ShellBar;
  /**
   * - `opaque`: the header is a solid band and the page starts below it.
   * - `overlay`: the page starts at the top of the screen, under the status
   *   bar and a transparent header. Pad content with `--sv-inset-top`.
   */
  header: ShellHeader;
  /** Status bar icon colour: `dark` icons for a light page, `light` for a dark one. */
  statusBar: ShellStatusBar;
  /** `#RRGGBB` painted behind the WebView: while loading, and on overscroll. */
  background: string;
}

/** What `shell.set` may change at runtime. `bar` is layout, so manifest only. */
export type ShellPatch = Partial<Pick<ShellConfig, 'header' | 'statusBar' | 'background'>>;

export interface Manifest {
  shell: ShellConfig;
}

export const DEFAULT_SHELL: Readonly<ShellConfig> = Object.freeze({
  bar: 'bottom',
  header: 'opaque',
  statusBar: 'dark',
  background: '#FFFFFF',
});

/** Where a miniapp serves its manifest, relative to its origin. */
export const MANIFEST_PATH = '/skkuverse.json';

const BARS: ReadonlySet<string> = new Set<ShellBar>(['top', 'bottom', 'none']);
const HEADERS: ReadonlySet<string> = new Set<ShellHeader>(['opaque', 'overlay']);
const STATUS_BARS: ReadonlySet<string> = new Set<ShellStatusBar>(['dark', 'light']);
const HEX = /^#[0-9A-Fa-f]{6}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pick<T extends string>(value: unknown, allowed: ReadonlySet<string>): T | undefined {
  return typeof value === 'string' && allowed.has(value) ? (value as T) : undefined;
}

/**
 * The valid fields of an untrusted shell object, and nothing else. The result
 * may be empty; merge it over a base with `mergeShell`.
 */
export function parseShellFields(value: unknown): Partial<ShellConfig> {
  if (!isRecord(value)) return {};
  const out: Partial<ShellConfig> = {};
  const bar = pick<ShellBar>(value.bar, BARS);
  if (bar) out.bar = bar;
  const header = pick<ShellHeader>(value.header, HEADERS);
  if (header) out.header = header;
  const statusBar = pick<ShellStatusBar>(value.statusBar, STATUS_BARS);
  if (statusBar) out.statusBar = statusBar;
  if (typeof value.background === 'string' && HEX.test(value.background)) {
    out.background = value.background.toUpperCase();
  }
  return out;
}

/** A `shell.set` payload, or null when it carries nothing valid. */
export function parseShellPatch(value: unknown): ShellPatch | null {
  const { header, statusBar, background } = parseShellFields(value);
  const patch: ShellPatch = {};
  if (header) patch.header = header;
  if (statusBar) patch.statusBar = statusBar;
  if (background) patch.background = background;
  return Object.keys(patch).length > 0 ? patch : null;
}

/** `base` with every field `over` sets replacing it. */
export function mergeShell(base: ShellConfig, over: Partial<ShellConfig>): ShellConfig {
  return { ...base, ...over };
}

/** A whole manifest from untrusted JSON. Never throws; falls back to defaults. */
export function parseManifest(value: unknown): Manifest {
  const shell = isRecord(value) ? parseShellFields(value.shell) : {};
  return { shell: mergeShell(DEFAULT_SHELL, shell) };
}
