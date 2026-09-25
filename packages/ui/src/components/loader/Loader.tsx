/**
 * Loader — spinner with an optional label.
 *
 * Built to the @toss/tds-mobile v2 contract. The React Native original drew an
 * SVG arc animated by Reanimated; here it is a bordered circle rotated by a CSS
 * keyframe, which needs no animation runtime at all.
 *
 * Usage:
 *   <Loader size="large" type="primary" label="불러오는 중이에요" />
 */
import React, { type CSSProperties } from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTheme } from '../../core/ThemeProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { mergeStyles, withAlpha } from '../../internal/style';
import { ensureKeyframes } from '../../internal/keyframes';

export type LoaderSize = 'small' | 'medium' | 'large';
export type LoaderType = 'primary' | 'dark' | 'light';

export interface LoaderProps {
  /** @default 'medium' */
  size?: LoaderSize;
  /** @default 'primary' */
  type?: LoaderType;
  /** Text below the spinner. Supports multiple lines. */
  label?: string;
  style?: CSSProperties;
  className?: string;
  id?: string;
}

const sizePx: Record<LoaderSize, { box: number; stroke: number }> = {
  small: { box: 20, stroke: 2 },
  medium: { box: 28, stroke: 3 },
  large: { box: 40, stroke: 4 },
};

export default function Loader({ size = 'medium', type = 'primary', label, style, className, id }: LoaderProps) {
  ensureKeyframes();
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { typography } = useTypographyTheme();
  const dim = sizePx[size];

  const color =
    type === 'primary'
      ? token.color.primary
      : type === 'dark'
        ? adaptive.grey700
        : SdsColors.background;

  const typo = typography.t6;

  return (
    <div
      id={id}
      className={className}
      role="status"
      aria-live="polite"
      aria-label={label ?? 'loading'}
      style={mergeStyles(
        { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
        style,
      )}
    >
      <span
        style={{
          width: dim.box,
          height: dim.box,
          borderRadius: '50%',
          boxSizing: 'border-box',
          // A full ring in a faded tint with one solid quadrant reads as an arc
          // once it spins, and costs nothing but a border.
          border: `${dim.stroke}px solid ${withAlpha(color, 0.18)}`,
          borderTopColor: color,
          animation: 'sds-spin 700ms linear infinite',
        }}
      />
      {label ? (
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: typo.fontSize,
            lineHeight: `${typo.lineHeight}px`,
            fontWeight: fontWeightMap.medium,
            color: type === 'light' ? SdsColors.background : adaptive.grey600,
            textAlign: 'center',
            whiteSpace: 'pre-line',
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

export { Loader };
