import { GAME_NOTIFY_METHODS, NOTIFY_METHODS, type GameInit, type Viewport } from '../protocol';

/**
 * A partial host state: what `createFakeHost` takes from a named preset. A field
 * the preset leaves out keeps `createFakeHost`'s own default, and a field the
 * caller passes beside the preset wins over it. A delay is `Infinity` or 0 to 2147483647 ms;
 * `createFakeHost` throws a `RangeError` for any other value.
 */
export interface HostPreset {
  /** Methods the host grants. */
  capabilities?: readonly string[];
  viewport?: Viewport;
  /** What the host answers `game.ready` with, or `false` to leave `init()` to the test. */
  init?: Partial<GameInit> | false;
  /**
   * Milliseconds before `install()` takes effect: the page boots first and the
   * host appears later. `Infinity` is a host that never appears.
   */
  hostDelayMs?: number;
  /** Milliseconds the host waits before it answers `game.ready` with `game.init`. `Infinity` is never. */
  initDelayMs?: number;
}

/**
 * What a host does to one request method, keyed by method name. It changes only
 * the method it names.
 *
 * - `'denied'`: answers at once with a `denied` error.
 * - `'failed'`: answers at once with a `failed` error.
 * - `'timeout'`: never answers, so the page's own timeout fires.
 * - `{ slowMs }`: answers `null` after that many milliseconds, or never for `Infinity`.
 */
export type FailureMode = 'denied' | 'timeout' | 'failed' | { slowMs: number };

export type FailureModes = Readonly<Record<string, FailureMode>>;

/** What a page sees for each failure mode, one line each. */
export const FAILURE_MODE_NOTES = {
  denied: 'The request rejects at once with a `MiniappError` whose `code` is `denied`.',
  failed: 'The request rejects at once with a `MiniappError` whose `code` is `failed`.',
  timeout: 'The host never answers, so the request rejects with `timeout` after its own `timeoutMs`, 10 s by default.',
  slowMs: 'The host answers with a `null` result after the given milliseconds.',
} as const;

/**
 * The iPhone overlay layout of the app's shell: 47 px of status bar plus a 44 px
 * header on top (inset 91 px), and a 34 px home indicator at the bottom. Measured
 * on the playground prototype, which draws the same overlay header.
 */
export const IPHONE_VIEWPORT: Viewport = {
  safeArea: { top: 47, bottom: 34, left: 0, right: 0 },
  contentSafeArea: { top: 44, bottom: 0, left: 0, right: 0 },
  chrome: 'glass',
};

/** Longer than `bootGame`'s `HOST_WAIT_MS` (10 s), so a game page gives up on the host before it appears. */
const LATE_HOST_MS = 15_000;
const SLOW_INIT_MS = 2_000;

const EVERY_METHOD: readonly string[] = [...NOTIFY_METHODS, ...GAME_NOTIFY_METHODS];

/** A preset and the sentence the docs give it. */
export interface HostPresetEntry extends HostPreset {
  note: string;
}

/**
 * The fixed presets. The app grants one method list per origin, a miniapp's
 * `NOTIFY_METHODS` or a game's `GAME_NOTIFY_METHODS`. These grant both, so one
 * preset serves either kind of page. Pass `capabilities` beside a preset to
 * assert an exact list.
 */
export const HOST_PRESETS = {
  granted: {
    note: 'Grants every method of both lists, on the iPhone viewport.',
    capabilities: EVERY_METHOD,
    viewport: IPHONE_VIEWPORT,
  },
  'nothing-granted': {
    note: 'The host is there and grants no method, so every SDK call takes its fallback.',
    capabilities: [],
    viewport: IPHONE_VIEWPORT,
  },
  'no-host': {
    note: 'No host ever appears: `install()` does nothing, as in a plain browser.',
    capabilities: [],
    hostDelayMs: Infinity,
  },
  'late-host': {
    note: `The host appears ${LATE_HOST_MS} ms after \`install()\`, later than a game page waits before it calls \`onNoHost\`.`,
    capabilities: EVERY_METHOD,
    viewport: IPHONE_VIEWPORT,
    hostDelayMs: LATE_HOST_MS,
  },
  'slow-init': {
    note: `The host answers \`game.ready\` with \`game.init\` ${SLOW_INIT_MS} ms late.`,
    capabilities: EVERY_METHOD,
    viewport: IPHONE_VIEWPORT,
    initDelayMs: SLOW_INIT_MS,
  },
} as const satisfies Record<string, HostPresetEntry>;

/**
 * The methods each published `@skkuverse/miniapp` release added to the app's
 * grant lists, from `CHANGELOG.md`. `old-host:<version>` grants everything added
 * up to and including that release, which is what an app built on it grants.
 */
export const HOST_METHODS_ADDED = {
  '0.2.0': ['haptic.impact', 'link.open', 'map.openPlace', 'miniapp.open', 'analytics.track', 'app.ready', 'shell.set'],
  '0.2.1': [],
  '0.3.0': ['share.open'],
  '0.4.0': ['game.ready', 'game.start', 'game.phase', 'game.layout', 'game.haptic', 'game.over'],
  '0.4.1': [],
  '0.4.2': [],
} as const satisfies Record<string, readonly string[]>;

export type OldHostVersion = keyof typeof HOST_METHODS_ADDED;

export type HostPresetName = keyof typeof HOST_PRESETS | `old-host:${OldHostVersion}`;

/** The capability list of the app that shipped with `version`. */
export function oldHostCapabilities(version: OldHostVersion): readonly string[] {
  if (!Object.prototype.hasOwnProperty.call(HOST_METHODS_ADDED, version)) {
    throw new Error(`unknown old-host version "${version}". Known versions: ${Object.keys(HOST_METHODS_ADDED).join(', ')}`);
  }
  const versions = Object.keys(HOST_METHODS_ADDED);
  const upTo = versions.slice(0, versions.indexOf(version) + 1) as OldHostVersion[];
  return upTo.flatMap((v) => HOST_METHODS_ADDED[v]);
}

const OLD_HOST = /^old-host:(.+)$/;

/** The preset a name stands for. Throws for a name no preset has, so a typo cannot leave a test on the default host. */
export function resolvePreset(name: HostPresetName): HostPreset {
  if (Object.prototype.hasOwnProperty.call(HOST_PRESETS, name)) return HOST_PRESETS[name as keyof typeof HOST_PRESETS];
  const version = OLD_HOST.exec(name)?.[1];
  if (version !== undefined && Object.prototype.hasOwnProperty.call(HOST_METHODS_ADDED, version)) {
    return { capabilities: oldHostCapabilities(version as OldHostVersion), viewport: IPHONE_VIEWPORT };
  }
  const known = [...Object.keys(HOST_PRESETS), ...Object.keys(HOST_METHODS_ADDED).map((v) => `old-host:${v}`)];
  throw new Error(`unknown host preset "${name}". Known presets: ${known.join(', ')}`);
}
