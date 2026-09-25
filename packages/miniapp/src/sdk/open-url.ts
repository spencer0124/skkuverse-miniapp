import { isInApp, postToApp } from '../transport';

export interface OpenUrlOptions {
  /**
   * An app's own scheme (`spotify:track:…`, `youtube://…`) that the host tries
   * first, falling back to `url` when nothing on the device handles it — the
   * rejected open is the probe, so no native allowlist is needed. A host that
   * predates `appUrl` ignores it and opens `url`, which is still a working link.
   */
  appUrl?: string;
}

function send(url: string, appUrl: string | undefined): void {
  postToApp(appUrl ? { type: 'web:open-url', url, appUrl } : { type: 'web:open-url', url });
}

/**
 * Open `url` outside this page: through the app inside it, in a new tab
 * outside it.
 */
export function openUrl(url: string, options: OpenUrlOptions = {}): void {
  if (isInApp()) {
    send(url, options.appUrl);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * The click handler for an `<a href target="_blank">` that leaves the page.
 *
 * Inside the app, the tap goes to the app and the anchor's default is
 * cancelled. In a browser the handler steps aside and the anchor's own `href`
 * does the work, which is what keeps middle-click, long-press and popup
 * blockers behaving.
 */
export function handleLinkClick(
  event: { preventDefault(): void },
  url: string,
  options: OpenUrlOptions = {},
): void {
  if (!isInApp()) return;
  event.preventDefault();
  send(url, options.appUrl);
}
