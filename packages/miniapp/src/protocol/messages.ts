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
 */

export type HapticStyle = 'light' | 'medium' | 'heavy';

/** Methods the page sends and forgets. Keyed by name, valued by params. */
export interface NotifyMethods {
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
  'analytics.track': { event: string; params?: Record<string, unknown> };
  /** The page has rendered. */
  'app.ready': Record<string, never>;
  'shell.set': ShellPatch;
}

/**
 * Methods the page awaits, keyed by name, valued by `{ params, result }`. None
 * yet: the channel exists so that the first one is an entry here rather than a
 * protocol change.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RequestMethods {}

export type NotifyMethod = keyof NotifyMethods;
export type RequestMethod = keyof RequestMethods;
export type Method = NotifyMethod | RequestMethod;

/** Events the app sends, keyed by name, valued by data. */
export interface HostEvents {
  'viewport.changed': Viewport;
}

export type HostEvent = keyof HostEvents;

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

/** The DOM event the host's `receive` dispatches on `window`, with the message as `detail`. */
export const MESSAGE_EVENT = 'skkuverse:message';

/** Every notify method, for the app's capability lists. */
export const NOTIFY_METHODS: readonly NotifyMethod[] = [
  'haptic.impact',
  'link.open',
  'map.openPlace',
  'miniapp.open',
  'analytics.track',
  'app.ready',
  'shell.set',
];

const MAX_MESSAGE = 4096;
const MAX_PARAMS = 2048;
const ID = /^[\w-]{1,64}$/;
const HAPTIC: ReadonlySet<string> = new Set<HapticStyle>(['light', 'medium', 'heavy']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function shortString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
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
  'analytics.track': (p) => {
    if (!shortString(p.event, 64)) return null;
    if (p.params === undefined) return { event: p.event };
    return isRecord(p.params) ? { event: p.event, params: p.params } : null;
  },
  'app.ready': () => ({}),
  'shell.set': (p) => parseShellPatch(p),
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
