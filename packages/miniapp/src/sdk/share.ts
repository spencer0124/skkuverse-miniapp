import { isGranted, notify } from '../transport';

function isHttpUrl(value: string): boolean {
  if (value.length === 0 || value.length > 2048) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

export interface ShareOptions {
  /** What is shared: an http(s) link, usually one that opens the app. */
  url: string;
  /** The message that goes with it. */
  text?: string;
}

/**
 * How a `share` call ended. `shared` means a share sheet was shown, not that
 * anything was sent: neither the app's sheet nor the browser's says.
 * `copied` means there was no sheet and the link went to the clipboard, which
 * the page should say out loud.
 */
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Whether the app itself can share. `share` works without it, through the browser. */
export function canShare(): boolean {
  return isGranted('share.open');
}

/**
 * Share a link: the app's share sheet, else the browser's (Web Share), else
 * the clipboard. Call it from a tap: browsers allow Web Share and clipboard
 * writes only inside a user gesture.
 */
export async function share({ url, text: rawText }: ShareOptions): Promise<ShareResult> {
  // What the app would drop, fail here: its validator (protocol/messages.ts)
  // is silent, and a notification has no answer to say so.
  const text = rawText || undefined;
  if (!isHttpUrl(url) || (text !== undefined && text.length > 512)) return 'failed';
  if (isGranted('share.open')) {
    notify('share.open', text === undefined ? { url } : { url, text });
    return 'shared';
  }
  const nav = typeof navigator === 'undefined' ? undefined : navigator;
  if (typeof nav?.share === 'function') {
    try {
      await nav.share(text === undefined ? { url } : { url, text });
      return 'shared';
    } catch (error) {
      // Dismissing the sheet is an answer. Anything else (a webview that lists
      // `share` but refuses it) falls through to the clipboard.
      if ((error as { name?: string } | null)?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await nav!.clipboard.writeText(text === undefined ? url : `${text}\n${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
