import type { HostBridgeGlobal, WebToAppMessage } from './protocol';

declare global {
  interface Window {
    /** react-native-webview's channel to the app. Absent in a plain browser. */
    ReactNativeWebView?: {
      postMessage(message: string): void;
    };
    /**
     * Injected by the app's web shells before content loads. Absent in a plain
     * browser and in every app build that predates it.
     */
    skkuverse?: { bridge?: HostBridgeGlobal };
  }
}

/**
 * Whether this page is running inside the skkuverse app's WebView.
 *
 * Feature detection, not a user-agent guess: the app's WebView provides the
 * channel, a browser does not. Being inside the app does not mean a given
 * message will be honoured — the app also gates by the page's origin — so use
 * `getCapabilities()` to decide what to offer.
 */
export function isInApp(): boolean {
  return typeof window !== 'undefined' && window.ReactNativeWebView != null;
}

/** The host's injected bridge object, if any. */
export function hostBridge(): HostBridgeGlobal | undefined {
  return typeof window === 'undefined' ? undefined : window.skkuverse?.bridge;
}

/**
 * Send one v1 message to the app. A no-op outside the app.
 *
 * Never assume it was handled: an app build that predates a message type drops
 * it without a word, and so does an app that does not grant this page's origin.
 * Prefer the named helpers (`haptic`, `openUrl`, ...); this is the escape hatch.
 */
export function postToApp(msg: WebToAppMessage): void {
  if (!isInApp()) return;
  window.ReactNativeWebView!.postMessage(JSON.stringify(msg));
}
