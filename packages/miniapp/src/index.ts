/**
 * The skkuverse miniapp SDK.
 *
 * Every function here is safe to call anywhere: outside the app each one is a
 * no-op or a browser fallback, never an error. None of them can tell whether the
 * app honoured a message, so a page must not depend on it — decide what to
 * offer with `getCapabilities()` instead.
 *
 * `@skkuverse/miniapp/protocol` holds the message types alone, and
 * `@skkuverse/miniapp/react` the hooks and components.
 */
export { isInApp, postToApp } from './transport';
export { getCapabilities, hasCapability, type HostInfo } from './sdk/capabilities';
export { haptic, type HapticStyle, type HapticOptions } from './sdk/haptic';
export { openUrl, handleLinkClick, type OpenUrlOptions } from './sdk/open-url';
export { canOpenMap, openMapPlace, canOpenMiniapp, openMiniapp } from './sdk/actions';
export { ready, track } from './sdk/lifecycle';
export type { Capability, WebToAppMessage, AppToWebMessage, MapSelectPayload } from './protocol';
