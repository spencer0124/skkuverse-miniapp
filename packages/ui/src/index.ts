/**
 * Web build of the SKKU Design System.
 *
 * Ported from skkuverse-app `packages/sds/src`. The theming layer here is the
 * part of that library that never depended on React Native: five providers of
 * pure React context, plus two token foundations.
 *
 * Five of the seven files are byte-identical to their upstream originals, so
 * they can be registered as `mode: copy` contracts when the component layer
 * settles. Two differ by one line each — `foundation/colors.ts` and
 * `core/ThemeProvider.tsx` import `SdsColors` from `@skkuverse/tokens` rather
 * than `@skkuverse/shared`, since the app's shared package cannot be evaluated
 * in a browser. Until they are registered, keeping them in step with upstream
 * is manual.
 *
 * Not ported: `foundation/easings.ts`, which is a Reanimated bezier tuple with
 * no browser meaning, and every component under `sds/src/components`, all of
 * which import `react-native` directly.
 */

// ── Providers ──
export { SDSProvider, type SDSProviderProps } from './core/SDSProvider';
export {
  ThemeProvider,
  useTheme,
  defaultSeedToken,
  type ThemeToken,
  type ThemeProviderProps,
  type SeedToken,
  type DerivedToken,
  type ButtonDerivedTheme,
} from './core/ThemeProvider';
export { AdaptiveColorProvider, useAdaptive } from './core/AdaptiveColorProvider';
export { TypographyProvider, useTypographyTheme, type TypographyTheme, type TypographyMap } from './core/TypographyProvider';
export { OverlayProvider, useOverlay } from './core/OverlayProvider';

// ── Components ──
// Hand-converted from sds/src/components. Same semantic props as upstream; the
// style prop takes React.CSSProperties instead of a React Native style array.
export * from './components';

// ── Utils ── vendored verbatim from sds/src/utils; both are platform-free.
export { useControlled } from './utils/useControlled';
export { mergeRefs } from './utils/mergeRefs';

// ── Conversion helpers, for components living outside this package ──
export { mergeStyles, lineClamp, withAlpha, toBoxShadow, HAIRLINE, type Style } from './internal/style';
export { useColorScheme, type ColorSchemeName } from './internal/useColorScheme';

// ── Foundation ──
export { getAdaptiveColors, colorSeeds, type ColorPreference, type ColorSeeds } from './foundation/colors';
export {
  typographyMap,
  fontWeightMap,
  fontFamilyByWeight,
  FONT_FAMILY,
  type TypographyKeys,
  type TypographyStyle,
  type FontWeight,
  type FontWeightKeys,
} from './foundation/typography';

// ── Lottie ── loaded on demand; see internal/LottiePlayer.tsx for why.
export { LottiePlayer, type LottiePlayerProps } from './internal/LottiePlayer';
export { useLottieData } from './internal/useLottieData';
