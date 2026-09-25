/**
 * ProgressBar — determinate progress track.
 *
 * Built to the @toss/tds-mobile v2 contract. `progress` is a 0–1 fraction, and
 * `animate` opts into a width transition rather than a jump. The React Native
 * original measured the track with onLayout and animated pixels, because
 * percentage widths were not available to it; CSS just takes a percentage.
 *
 * Usage:
 *   <ProgressBar progress={0.4} size="normal" animate />
 */
import React from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { mergeStyles, type Style } from '../../internal/style';

export type ProgressBarSize = 'light' | 'normal' | 'bold';

export interface ProgressBarProps {
  /** 0.0 to 1.0. */
  progress: number;
  /** @default 'normal' */
  size?: ProgressBarSize;
  /** @default SdsColors.blue400 */
  color?: string;
  /** @default false */
  animate?: boolean;
  className?: string;
  style?: Style;
}

const sizeHeight: Record<ProgressBarSize, number> = {
  light: 2,
  normal: 4,
  bold: 8,
};

export default function ProgressBar({
  progress,
  size = 'normal',
  color,
  animate = false,
  className,
  style,
}: ProgressBarProps) {
  const adaptive = useAdaptive();
  const height = sizeHeight[size];
  // Clamp rather than trust the caller: a value outside 0–1 would otherwise
  // paint outside the track.
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <div
      className={className}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={mergeStyles(
        {
          width: '100%',
          height,
          borderRadius: height / 2,
          backgroundColor: adaptive.grey200,
          overflow: 'hidden',
        },
        style,
      )}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color ?? SdsColors.blue400,
          transition: animate ? 'width 300ms cubic-bezier(0.33, 1, 0.68, 1)' : undefined,
        }}
      />
    </div>
  );
}

export { ProgressBar };
