/**
 * Border — divider/spacer component.
 *
 * Converted from skkuverse-app `packages/sds/src/components/border/Border.tsx`.
 *
 * Types:
 *   'full'      — hairline, full width
 *   'padding24' — hairline, 24px horizontal padding
 *   'height16'  — 16px height spacer (no line)
 */
import React, { type HTMLAttributes } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { HAIRLINE, mergeStyles } from '../../internal/style';

export type BorderType = 'full' | 'padding24' | 'height16';

interface BaseProps {
  type?: BorderType;
  height?: number;
}

type Props = BaseProps & HTMLAttributes<HTMLDivElement>;

export default function Border({
  type = 'full',
  style,
  height,
  ...restProps
}: Props) {
  const adaptive = useAdaptive();

  if (type === 'height16') {
    return (
      <div
        style={mergeStyles(
          { height: height ?? 16, backgroundColor: adaptive.grey50 },
          style,
        )}
        {...restProps}
      />
    );
  }

  return (
    <div
      style={mergeStyles(
        { height: HAIRLINE, backgroundColor: adaptive.grey200 },
        // React Native's marginHorizontal has no CSS shorthand of its own.
        type === 'padding24' && { marginLeft: 24, marginRight: 24 },
        style,
      )}
      {...restProps}
    />
  );
}

export { Border };
