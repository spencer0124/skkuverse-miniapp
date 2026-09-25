/**
 * Shared helpers for the React Native to DOM conversion.
 *
 * The components in this package are hand-converted from skkuverse-app
 * `packages/sds/src/components`. React Native's style model differs from CSS in
 * a few fixed ways, and every conversion hits the same ones, so they are solved
 * once here rather than per component.
 */
import type { CSSProperties } from 'react';

/** A style value in the shape components accept: nullable and nestable. */
export type Style = CSSProperties | false | null | undefined;

/**
 * Flatten and merge styles, later entries winning.
 *
 * React Native takes `style={[a, b && c, d]}` and DOM takes a single object, so
 * every converted component funnels its style layers through this.
 */
export function mergeStyles(...styles: (Style | Style[])[]): CSSProperties {
  const out: CSSProperties = {};
  for (const entry of styles) {
    if (!entry) continue;
    if (Array.isArray(entry)) {
      Object.assign(out, mergeStyles(...entry));
    } else {
      Object.assign(out, entry);
    }
  }
  return out;
}

/**
 * React Native's `StyleSheet.hairlineWidth` is the thinnest line the device can
 * draw. The browser equivalent is one CSS pixel, which a high-density display
 * already renders as a sub-pixel line.
 */
export const HAIRLINE = 1;

/**
 * Clamp text to a fixed number of lines, the CSS equivalent of React Native's
 * `numberOfLines`. Returns nothing when unset, so callers can spread it
 * unconditionally.
 *
 * `WebkitBoxOrient` is not in React's CSSProperties despite being universally
 * supported, hence the assertion.
 */
export function lineClamp(numberOfLines?: number): CSSProperties {
  if (!numberOfLines) return {};
  if (numberOfLines === 1) {
    return { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  }
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: numberOfLines,
    overflow: 'hidden',
  } as CSSProperties;
}

/**
 * Compose a React Native shadow config into a CSS `boxShadow`.
 *
 * React Native splits a shadow across four iOS properties plus an Android
 * `elevation`; CSS states it in one string. Colour arrives as hex or `rgba()`,
 * and opacity is a separate multiplier, so a hex colour is expanded here rather
 * than at every call site.
 */
export function toBoxShadow(
  color: string,
  offsetX: number,
  offsetY: number,
  blurRadius: number,
  opacity: number,
): string {
  return `${offsetX}px ${offsetY}px ${blurRadius}px ${withAlpha(color, opacity)}`;
}

/** Apply an alpha to a `#RGB` or `#RRGGBB` colour. Non-hex input is returned unchanged. */
export function withAlpha(color: string, alpha: number): string {
  if (!color.startsWith('#')) return color;
  const h = color.slice(1);
  const expand = (s: string) => parseInt(s.length === 1 ? s.repeat(2) : s, 16);
  const [r, g, b] =
    h.length === 3
      ? [expand(h.slice(0, 1)), expand(h.slice(1, 2)), expand(h.slice(2, 3))]
      : [expand(h.slice(0, 2)), expand(h.slice(2, 4)), expand(h.slice(4, 6))];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
