import { parseShellPatch, type ShellPatch } from './manifest';
import type { Viewport } from './viewport';

/**
 * The messages a miniapp page and the skkuverse app exchange.
 *
 * Page → app, through `window.ReactNativeWebView.postMessage(JSON)`:
 * - a notification, `{ method, params }`: fire and forget.
 * - a request, `{ id, method, params }`: the app answers with exactly one
 *   response carrying the same `id`.
 *
 * App → page, through `window.skkuverse.receive(JSON)`:
 * - a response, `{ id, ok: true, result }` or `{ id, ok: false, error }`.
 * - an event, `{ event, data }`: unsolicited.
 *
 * Adding a feature is one entry in `NotifyMethods` or `RequestMethods`, one
 * validator in `PARAMS`, and the app's handler. Names are `<namespace>.<verb>`.
 *
 * Mini apps and games share this envelope, never their grants. The `game.*`
 * methods and events are a game page's alone: the app grants a game origin
 * `GAME_NOTIFY_METHODS` and a mini-app origin `NOTIFY_METHODS`, and the two
 * lists share no method.
 */

/** A mini app's haptic styles (`haptic.impact`). A game has its own set, `GameHapticStyle`. */
export type HapticStyle = 'light' | 'medium' | 'heavy';

/** Methods a mini-app page sends and forgets. Keyed by name, valued by params. */
export interface MiniappNotifyMethods {
  'haptic.impact': { style: HapticStyle };
  /**
   * Open a URL outside the page. `appUrl`, when set, is an app's own scheme
   * (`spotify:track:…`) the app tries first, falling back to `url`.
   */
  'link.open': { url: string; appUrl?: string };
  /** Close the page and open the campus map on `place` (`[<kind>:]<placeId>`). */
  'map.openPlace': { place: string };
  /** Open another registered miniapp: `<id>[/path]`. */
  'miniapp.open': { target: string };
  /**
   * Open the app's share sheet on `url`, with `text` as the message above it.
   * The sheet's outcome is the user's business: the page is not told.
   */
  'share.open': { url: string; text?: string };
  'analytics.track': { event: string; params?: Record<string, unknown> };
  /** The page has rendered. */
  'app.ready': Record<string, never>;
  'shell.set': ShellPatch;
}

/**
 * `light`, `medium`, `heavy`, `soft` and `rigid` are impact taps. `error` is a
 * short, hard tap for a slip, not the notification pattern, which is too long
 * to repeat. `success` is that notification pattern, for a moment that comes
 * at most once a run.
 */
export type GameHapticStyle = HapticStyle | 'soft' | 'rigid' | 'error' | 'success';

/** Where a game run is. `crashed` waits for the host: a revive, a restart or a reset. */
export type GamePhase = 'ready' | 'running' | 'paused' | 'crashed';

/** A rectangle in CSS pixels, relative to the web view, that the host draws over. */
export interface GameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A small map of finite numbers under plain keys, in the game's own vocabulary. */
export type GameStats = Readonly<Record<string, number>>;

/** A run's result, as the page reports it in `game.over`. */
export interface GameOver {
  /** A safe non-negative integer: for a ranked game it is what gets submitted. */
  score: number;
  ticks: number;
  /** What ended the run, in the game's own vocabulary. */
  hit: string | null;
  revives: number;
  /** How many more times the page would accept `game.revive` for this run. */
  revivesLeft: number;
  /**
   * The validator a ranked page was built for, `<gameId>@<n>`. Ranked results
   * are verified outside the page.
   */
  validator?: string;
  /** Figures the result card shows beside the score. Display only, never submitted. */
  stats?: GameStats;
  /** How the run was played. Never shown or submitted. */
  telemetry?: GameStats;
}

/** Methods a game page sends and forgets. */
export interface GameNotifyMethods {
  /** The page can be shown. `rect` is where the host may anchor its title. */
  'game.ready': { rect?: GameRect };
  /** A run began. Never before `game.init`. */
  'game.start': Record<string, never>;
  'game.phase': { phase: GamePhase };
  /** A rectangle the host draws over moved, after a resize for example. */
  'game.layout': { rect: GameRect };
  'game.haptic': { style: GameHapticStyle };
  'game.over': GameOver;
}

/** Every method a page sends and forgets, for the parser. Grants decide which a page may use. */
export interface NotifyMethods extends MiniappNotifyMethods, GameNotifyMethods {}

/**
 * Methods the page awaits, keyed by name, valued by `{ params, result }`. None
 * yet: the channel exists so that the first one is an entry here rather than a
 * protocol change.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RequestMethods {}

export type NotifyMethod = keyof NotifyMethods;
export type MiniappNotifyMethod = keyof MiniappNotifyMethods;
export type GameNotifyMethod = keyof GameNotifyMethods;
export type RequestMethod = keyof RequestMethods;
export type Method = NotifyMethod | RequestMethod;

/** What the host tells a game page in answer to `game.ready`. */
export interface GameInit {
  /** The host's game protocol (`GAME_PROTOCOL` of the SDK it was built with). */
  gameProtocol: number;
  /** The device best, in the game's own units. */
  hi: number;
  /** The player's sound setting. */
  sound: boolean;
}

/** Events the host sends a game page. The page obeys every one. */
export interface GameHostEvents {
  'game.init': GameInit;
  /** Stop the run's clock and its audio. */
  'game.pause': Record<string, never>;
  'game.resume': Record<string, never>;
  /** The player's sound setting changed. */
  'game.sound': { on: boolean };
  /** Back to the title, with no run started: the player closed the result. */
  'game.reset': Record<string, never>;
  /** Start a new run straight away. */
  'game.restart': Record<string, never>;
  /** Continue the crashed run: sent only after a rewarded ad paid out. */
  'game.revive': Record<string, never>;
}

/** Events the app sends, keyed by name, valued by data. */
export interface HostEvents extends GameHostEvents {
  'viewport.changed': Viewport;
}

export type HostEvent = keyof HostEvents;
export type GameHostEvent = keyof GameHostEvents;

export type ErrorCode = 'unsupported' | 'denied' | 'cancelled' | 'timeout' | 'failed';

export interface ProtocolError {
  code: ErrorCode;
  message: string;
}

export type Notification = {
  [M in NotifyMethod]: { id?: undefined; method: M; params: NotifyMethods[M] };
}[NotifyMethod];

/** A request as it arrives at the app. Its method may be one the app does not know. */
export interface Request {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export type PageMessage = Notification | Request;

export type Response =
  | { id: string; ok: true; result: unknown }
  | { id: string; ok: false; error: ProtocolError };

export type EventMessage = { [E in HostEvent]: { event: E; data: HostEvents[E] } }[HostEvent];

export type HostMessage = Response | EventMessage;

/** Bumped only when the envelope itself changes. Methods come and go freely. */
export const PROTOCOL_VERSION = 1;

/**
 * The game protocol this SDK speaks. The host sends its own in `game.init`, so
 * a page built for a newer one can leave out what an older host lacks. Bumped
 * when a `game.*` method, event or field is added.
 */
export const GAME_PROTOCOL = 1;

/** The DOM event the host's `receive` dispatches on `window`, with the message as `detail`. */
export const MESSAGE_EVENT = 'skkuverse:message';

/** Every mini-app notify method, for the app's capability list for a mini-app origin. */
export const NOTIFY_METHODS: readonly MiniappNotifyMethod[] = [
  'haptic.impact',
  'link.open',
  'map.openPlace',
  'miniapp.open',
  'share.open',
  'analytics.track',
  'app.ready',
  'shell.set',
];

/** Every game notify method, for the app's capability list for a game origin. */
export const GAME_NOTIFY_METHODS: readonly GameNotifyMethod[] = [
  'game.ready',
  'game.start',
  'game.phase',
  'game.layout',
  'game.haptic',
  'game.over',
];

/** Every event the host sends a game page. */
export const GAME_EVENTS: readonly GameHostEvent[] = [
  'game.init',
  'game.pause',
  'game.resume',
  'game.sound',
  'game.reset',
  'game.restart',
  'game.revive',
];

const MAX_MESSAGE = 4096;
const MAX_PARAMS = 2048;
const ID = /^[\w-]{1,64}$/;
const HAPTIC: ReadonlySet<string> = new Set<HapticStyle>(['light', 'medium', 'heavy']);
const GAME_HAPTIC: ReadonlySet<string> = new Set<GameHapticStyle>([
  'light',
  'medium',
  'heavy',
  'soft',
  'rigid',
  'error',
  'success',
]);
const GAME_PHASES: ReadonlySet<string> = new Set<GamePhase>(['ready', 'running', 'paused', 'crashed']);
const HIT_MAX_LENGTH = 32;
const STATS_MAX_KEYS = 8;
const TELEMETRY_MAX_KEYS = 12;
const STAT_KEY = /^[a-zA-Z][a-zA-Z0-9]{0,23}$/;
const VALIDATOR = /^[a-z0-9-]+@[0-9]+$/;
const VALIDATOR_MAX_LENGTH = 64;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function shortString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}

/** A non-negative integer that survives JSON exactly: a score is submitted as is. */
function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** A rectangle rebuilt from its four fields, or null. */
function parseRect(value: unknown): GameRect | null {
  if (!isRecord(value)) return null;
  const { x, y, width, height } = value;
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(width) || !isFiniteNumber(height)) return null;
  if (width < 0 || height < 0) return null;
  return { x, y, width, height };
}

/** A small map of finite numbers under plain keys, rebuilt; anything else is null. */
function parseStats(value: unknown, maxKeys: number): GameStats | null {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  if (entries.length === 0 || entries.length > maxKeys) return null;
  const out: Record<string, number> = {};
  for (const [key, n] of entries) {
    if (!STAT_KEY.test(key) || !isFiniteNumber(n)) return null;
    out[key] = n;
  }
  return out;
}

/**
 * `game.over`, rebuilt from its declared fields only, since the score is what
 * gets submitted. The counts are required; `validator`, `stats` and
 * `telemetry` are optional, and a malformed one is dropped alone rather than
 * the result.
 */
function parseGameOver(p: Record<string, unknown>): GameOver | null {
  if (!isCount(p.score) || !isCount(p.ticks) || !isCount(p.revives) || !isCount(p.revivesLeft)) return null;
  if (p.hit !== null && (typeof p.hit !== 'string' || p.hit.length > HIT_MAX_LENGTH)) return null;
  // `+ 0` turns a -0 into 0.
  const over: GameOver = {
    score: p.score + 0,
    ticks: p.ticks + 0,
    hit: p.hit,
    revives: p.revives + 0,
    revivesLeft: p.revivesLeft + 0,
  };
  if (typeof p.validator === 'string' && p.validator.length <= VALIDATOR_MAX_LENGTH && VALIDATOR.test(p.validator)) {
    over.validator = p.validator;
  }
  const stats = parseStats(p.stats, STATS_MAX_KEYS);
  if (stats) over.stats = stats;
  const telemetry = parseStats(p.telemetry, TELEMETRY_MAX_KEYS);
  if (telemetry) over.telemetry = telemetry;
  return over;
}

function isHttpUrl(value: unknown): value is string {
  if (!shortString(value, 2048)) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/** Per-method params validation: the validated params, or null to drop the message. */
const PARAMS: { [M in NotifyMethod]: (p: Record<string, unknown>) => NotifyMethods[M] | null } = {
  'haptic.impact': (p) =>
    typeof p.style === 'string' && HAPTIC.has(p.style) ? { style: p.style as HapticStyle } : null,
  'link.open': (p) => {
    if (!isHttpUrl(p.url)) return null;
    if (p.appUrl === undefined) return { url: p.url };
    return shortString(p.appUrl, 512) ? { url: p.url, appUrl: p.appUrl } : null;
  },
  'map.openPlace': (p) => (shortString(p.place, 128) ? { place: p.place } : null),
  'miniapp.open': (p) => (shortString(p.target, 128) ? { target: p.target } : null),
  'share.open': (p) => {
    if (!isHttpUrl(p.url)) return null;
    if (p.text === undefined) return { url: p.url };
    return shortString(p.text, 512) ? { url: p.url, text: p.text } : null;
  },
  'analytics.track': (p) => {
    if (!shortString(p.event, 64)) return null;
    if (p.params === undefined) return { event: p.event };
    return isRecord(p.params) ? { event: p.event, params: p.params } : null;
  },
  'app.ready': () => ({}),
  'shell.set': (p) => parseShellPatch(p),
  // A malformed rect is dropped alone: the handshake must not hang on it.
  'game.ready': (p) => {
    const rect = parseRect(p.rect);
    return rect ? { rect } : {};
  },
  'game.start': () => ({}),
  'game.phase': (p) =>
    typeof p.phase === 'string' && GAME_PHASES.has(p.phase) ? { phase: p.phase as GamePhase } : null,
  'game.layout': (p) => {
    const rect = parseRect(p.rect);
    return rect ? { rect } : null;
  },
  'game.haptic': (p) =>
    typeof p.style === 'string' && GAME_HAPTIC.has(p.style) ? { style: p.style as GameHapticStyle } : null,
  'game.over': (p) => parseGameOver(p),
};

/**
 * One message from the page, validated, or null. For the app: anything that
 * does not parse is dropped without a word, like any other untrusted input.
 *
 * A request (`id` present) is returned whatever its method, so the app can
 * answer `unsupported` instead of leaving the page to time out. A notification
 * must name a known method with valid params.
 */
export function parseMessage(raw: unknown): PageMessage | null {
  if (typeof raw !== 'string' || raw.length > MAX_MESSAGE) return null;
  let msg: unknown;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(msg) || typeof msg.method !== 'string' || msg.method.length > 64) return null;

  const params = msg.params === undefined ? {} : msg.params;
  if (!isRecord(params) || JSON.stringify(params).length > MAX_PARAMS) return null;

  if (msg.id !== undefined) {
    if (typeof msg.id !== 'string' || !ID.test(msg.id)) return null;
    return { id: msg.id, method: msg.method, params };
  }

  if (!Object.prototype.hasOwnProperty.call(PARAMS, msg.method)) return null;
  const method = msg.method as NotifyMethod;
  const valid = (PARAMS[method] as (p: Record<string, unknown>) => NotifyMethods[NotifyMethod] | null)(params);
  return valid ? ({ method, params: valid } as Notification) : null;
}

export type GameEventMessage = { [E in GameHostEvent]: { event: E; data: GameHostEvents[E] } }[GameHostEvent];

const EMPTY_GAME_EVENTS: ReadonlySet<string> = new Set<GameHostEvent>([
  'game.pause',
  'game.resume',
  'game.reset',
  'game.restart',
  'game.revive',
]);

/**
 * One game event as the page receives it (the `detail` of `MESSAGE_EVENT`),
 * validated and rebuilt, or null. For the page: the host is trusted, but a
 * malformed event is still ignored rather than acted on.
 */
export function parseGameEvent(message: unknown): GameEventMessage | null {
  if (!isRecord(message) || typeof message.event !== 'string') return null;
  const { event } = message;
  if (EMPTY_GAME_EVENTS.has(event)) return { event, data: {} } as GameEventMessage;
  const data = message.data;
  if (!isRecord(data)) return null;
  if (event === 'game.init') {
    const { gameProtocol, hi, sound } = data;
    if (!Number.isSafeInteger(gameProtocol) || (gameProtocol as number) < 1) return null;
    if (!isCount(hi) || typeof sound !== 'boolean') return null;
    return { event, data: { gameProtocol: gameProtocol as number, hi: hi + 0, sound } };
  }
  if (event === 'game.sound') return typeof data.on === 'boolean' ? { event, data: { on: data.on } } : null;
  return null;
}
