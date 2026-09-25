/**
 * Protocol v2 — reserved, not yet spoken by any host.
 *
 * v1 (`./v1.ts`) is fire-and-forget: a page posts `{ type, ... }` and never
 * learns whether anything happened. That is enough for haptics and links, and
 * not enough for anything that answers back: a rewarded ad, a sign-in token, a
 * launch token. v2 adds a request/response envelope for those, beside v1 rather
 * than instead of it.
 *
 * The two coexist on one channel because they cannot be confused: a v2 message
 * has `v` and no `type`, so a host that only knows v1 fails its `type` check and
 * drops it silently, and a v1 message has no `v`.
 *
 * Nothing here is sent yet. These types exist so the SDK's shape is decided
 * before the first host implements it; see docs/PROTOCOL.md for the flows.
 */

/** Page → host. `id` is unique per page load; the response echoes it. */
export interface V2Request<M extends string = string, P = unknown> {
  v: 2;
  id: string;
  method: M;
  params?: P;
}

export interface V2Error {
  /** Stable, machine-readable. `unsupported` means the host lacks the method. */
  code: 'unsupported' | 'denied' | 'cancelled' | 'timeout' | 'failed' | (string & {});
  message: string;
}

/** Host → page, exactly one per request. */
export type V2Response<R = unknown> =
  | { v: 2; id: string; ok: true; result: R }
  | { v: 2; id: string; ok: false; error: V2Error };

/** Host → page, unsolicited. */
export interface V2Event<E extends string = string, D = unknown> {
  v: 2;
  event: E;
  data?: D;
}

/**
 * Capability names. A page asks `getCapabilities()` and checks for these before
 * offering a feature, instead of guessing from a user agent or an app version.
 *
 * The first five are derivable from v1 signals today. The last three are
 * reserved for v2 and no host advertises them yet.
 */
export const CAPABILITIES = [
  'haptic',
  'openUrl',
  'openUrl.appUrl',
  'action.map',
  'action.miniapp',
  /** Show an AdMob rewarded ad. The grant is confirmed server-side (SSV), never by the page. */
  'ads.rewarded',
  /** A short-lived, server-signed token naming the signed-in user, audience = this miniapp. */
  'auth.idToken',
  /** The host opened this page with a launch token, required by the miniapp's data APIs. */
  'launchToken',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * What a host puts on `window.skkuverse.bridge` before the page's own script
 * runs. v1 hosts set `actions` only; `protocol` and `capabilities` are what a v2
 * host adds. `receive` is installed by the SDK, not the host: it is the entry
 * point a v2 host calls, through `injectJavaScript`, to deliver a response or an
 * event.
 */
export interface HostBridgeGlobal {
  /** `web:action` types this host accepts. v1. */
  actions?: readonly string[];
  /** Highest protocol this host speaks. Absent means 1. */
  protocol?: number;
  /** Capability names this host grants this page. */
  capabilities?: readonly string[];
  /** Host → page delivery, v2. */
  receive?: (json: string) => void;
}
