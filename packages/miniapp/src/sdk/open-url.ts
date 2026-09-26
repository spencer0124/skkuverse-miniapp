import { isGranted, notify } from '../transport';

export interface OpenUrlOptions {
  /**
   * An app's own scheme (`spotify:track:…`, `youtube://…`) the app tries first,
   * falling back to `url` when nothing on the device handles it. Leave it off
   * for a site whose https links its app already claims, such as Instagram: an
   * app that takes the scheme but ignores its path never reaches `url`.
   */
  appUrl?: string;
}

function send(url: string, appUrl: string | undefined): void {
  notify('link.open', appUrl ? { url, appUrl } : { url });
}

/** Open `url` outside this page: through the app inside it, in a new tab outside it. */
export function openUrl(url: string, options: OpenUrlOptions = {}): void {
  if (isGranted('link.open')) {
    send(url, options.appUrl);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * The click handler for an `<a href target="_blank">` that leaves the page.
 * Inside the app the tap goes to the app and the default is cancelled; in a
 * browser the anchor's own `href` does the work, which keeps middle-click,
 * long-press and popup blockers behaving.
 */
export function handleLinkClick(event: { preventDefault(): void }, url: string, options: OpenUrlOptions = {}): void {
  if (!isGranted('link.open')) return;
  event.preventDefault();
  send(url, options.appUrl);
}
