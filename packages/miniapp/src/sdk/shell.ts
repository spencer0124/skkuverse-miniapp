import { ZERO_VIEWPORT, type ShellPatch, type Viewport } from '../protocol';
import { host, notify, onEvent } from '../transport';

/**
 * Where content may go, relative to the WebView. Outside the app everything is
 * zero. Prefer the CSS variables (`var(--sv-inset-top)`) for layout, which the
 * app keeps current; read this for canvas games and other JS layout.
 */
export function getViewport(): Viewport {
  return host()?.getViewport() ?? ZERO_VIEWPORT;
}

/** Called with the new viewport whenever it changes: rotation, shell changes. */
export function onViewportChange(callback: (viewport: Viewport) => void): () => void {
  return onEvent('viewport.changed', callback);
}

/**
 * Change the shell mid-session: `header: 'overlay'` to play full-bleed,
 * `statusBar: 'light'` over a dark scene. The initial shell comes from the
 * miniapp's `public/skkuverse.json`, so the first frame never waits for this.
 */
export function setShell(patch: ShellPatch): void {
  notify('shell.set', patch);
}
