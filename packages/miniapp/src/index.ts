/**
 * The skkuverse miniapp SDK.
 *
 * Every function is safe to call anywhere: outside the app each one is a no-op
 * or a browser fallback, never an error. Notifications have no answer, so a
 * page never depends on one having been handled; it checks
 * `getCapabilities()` before offering a feature.
 *
 * `@skkuverse/miniapp/protocol` is the contract alone, `@skkuverse/miniapp/react`
 * the root component and hooks, `@skkuverse/miniapp/react/ui` the SDS-styled
 * components.
 */
export { isInApp, notify, request, onEvent, MiniappError } from './transport';
export { getCapabilities, hasCapability, type HostInfo } from './sdk/capabilities';
export { haptic, type HapticStyle, type HapticOptions } from './sdk/haptic';
export { openUrl, handleLinkClick, type OpenUrlOptions } from './sdk/open-url';
export { canOpenMap, openMapPlace, canOpenMiniapp, openMiniapp } from './sdk/actions';
export { canShare, share, type ShareOptions, type ShareResult } from './sdk/share';
export { ready, track } from './sdk/lifecycle';
export { getViewport, onViewportChange, setShell } from './sdk/shell';
export type { Viewport, Insets, Chrome, ShellPatch, ShellConfig, Method } from './protocol';
