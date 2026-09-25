/**
 * CSS adapter for the vendored design tokens.
 *
 * The token files are byte copies of React Native source, registered as
 * contracts in the umbrella's `contracts/manifest.json`. Editing them here
 * turns CI red, so every unit conversion the browser needs lives in this file
 * instead.
 *
 * Two shape differences matter:
 *   - `fontSize`, `lineHeight`, spacing and radius are unitless numbers meaning
 *     px. CSS needs the unit.
 *   - `fontWeight` is already a numeric string, which CSS accepts unchanged.
 *
 * `SdsColors` needs no adapter: hex and `rgba()` strings are valid CSS.
 */
import { SdsRadius } from './radius';
import { SdsSpacing } from './spacing';
import { SdsTypo, type SdsTextStyle } from './typography';

/** A text token expressed as CSS, keyed the way React's `style` prop expects. */
export interface CssTextStyle {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
}

type PxScale<T> = { [K in keyof T]: string };

function toPxScale<T extends Record<string, number>>(scale: T): PxScale<T> {
  return Object.fromEntries(
    Object.entries(scale).map(([key, value]) => [key, `${value}px`]),
  ) as PxScale<T>;
}

/** Convert one React Native text token to CSS. */
export function textStyleToCss(style: SdsTextStyle): CssTextStyle {
  return {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    lineHeight: `${style.lineHeight}px`,
    fontWeight: style.fontWeight,
  };
}

/** Every typography level, converted. Same keys as `SdsTypo`. */
export const CssTypo = Object.fromEntries(
  Object.entries(SdsTypo).map(([key, style]) => [key, textStyleToCss(style)]),
) as { [K in keyof typeof SdsTypo]: CssTextStyle };

/** Spacing scale in px. Same keys as `SdsSpacing`. */
export const CssSpacing = toPxScale(SdsSpacing);

/** Radius scale in px. Same keys as `SdsRadius`. */
export const CssRadius = toPxScale(SdsRadius);
