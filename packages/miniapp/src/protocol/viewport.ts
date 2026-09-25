/**
 * Where a page may put its content, in CSS pixels, relative to the WebView.
 *
 * Two layers, after Telegram's model:
 * - `safeArea` is the device's own: the status bar, a notch, the home
 *   indicator, wherever they overlap the WebView. It is zero on an edge the
 *   WebView does not reach.
 * - `contentSafeArea` is the app's: the header and the bottom bar, wherever
 *   they are drawn over the page.
 *
 * A page paints its background edge to edge and keeps content inside both:
 * `padding-top: var(--sv-inset-top)` is the sum. The app injects these values
 * itself rather than leaving pages to `env(safe-area-inset-*)`, which reads zero
 * on recent Android WebViews and doubles up on iOS when the scroll view insets
 * as well.
 */

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * - `glass`: the app's header and bars are translucent Liquid Glass (iOS 26+),
 *   so a background painted beneath them shows through, blurred.
 * - `opaque`: they are solid (earlier iOS, Android); nothing beneath shows.
 */
export type Chrome = 'glass' | 'opaque';

export interface Viewport {
  safeArea: Insets;
  contentSafeArea: Insets;
  chrome: Chrome;
}

export const ZERO_INSETS: Readonly<Insets> = Object.freeze({ top: 0, bottom: 0, left: 0, right: 0 });

export const ZERO_VIEWPORT: Readonly<Viewport> = Object.freeze({
  safeArea: ZERO_INSETS,
  contentSafeArea: ZERO_INSETS,
  chrome: 'opaque',
});

const EDGES = ['top', 'bottom', 'left', 'right'] as const;

/**
 * The CSS custom properties a viewport sets on `<html>`:
 * `--sv-safe-*`, `--sv-content-*`, and `--sv-inset-*` (their sum), for each of
 * top, bottom, left and right. `data-sv-chrome` carries `chrome`.
 */
export function viewportCssVars(viewport: Viewport): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const edge of EDGES) {
    const safe = viewport.safeArea[edge];
    const content = viewport.contentSafeArea[edge];
    vars[`--sv-safe-${edge}`] = `${safe}px`;
    vars[`--sv-content-${edge}`] = `${content}px`;
    vars[`--sv-inset-${edge}`] = `${safe + content}px`;
  }
  return vars;
}

export function sameViewport(a: Viewport, b: Viewport): boolean {
  return (
    a.chrome === b.chrome &&
    EDGES.every((e) => a.safeArea[e] === b.safeArea[e] && a.contentSafeArea[e] === b.contentSafeArea[e])
  );
}

function isInsets(value: unknown): value is Insets {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return EDGES.every((e) => typeof v[e] === 'number' && Number.isFinite(v[e]) && (v[e] as number) >= 0);
}

export function isViewport(value: unknown): value is Viewport {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return isInsets(v.safeArea) && isInsets(v.contentSafeArea) && (v.chrome === 'glass' || v.chrome === 'opaque');
}
