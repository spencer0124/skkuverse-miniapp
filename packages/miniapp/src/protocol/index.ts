/**
 * The miniapp ↔ app contract, and nothing else: no DOM at import time, no
 * React, no dependencies. The app imports it for the parser and the scripts it
 * injects, skkuverse-server for the manifest parser, and the SDK for the types.
 *
 * Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
 * areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.
 */
export {
  PROTOCOL_VERSION,
  MESSAGE_EVENT,
  NOTIFY_METHODS,
  parseMessage,
  type HapticStyle,
  type NotifyMethods,
  type RequestMethods,
  type NotifyMethod,
  type RequestMethod,
  type Method,
  type HostEvents,
  type HostEvent,
  type ErrorCode,
  type ProtocolError,
  type Notification,
  type Request,
  type PageMessage,
  type Response,
  type EventMessage,
  type HostMessage,
} from './messages';
export {
  DEFAULT_SHELL,
  MANIFEST_PATH,
  parseManifest,
  parseShellFields,
  parseShellPatch,
  mergeShell,
  type ShellBar,
  type ShellHeader,
  type ShellStatusBar,
  type ShellConfig,
  type ShellPatch,
  type Manifest,
} from './manifest';
export {
  ZERO_INSETS,
  ZERO_VIEWPORT,
  viewportCssVars,
  sameViewport,
  isViewport,
  type Insets,
  type Chrome,
  type Viewport,
} from './viewport';
export { hostBootstrapScript, hostDeliverScript, type HostGlobal } from './host';
