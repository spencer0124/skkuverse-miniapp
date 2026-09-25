/**
 * Gradient — linear or radial fill.
 *
 * The React Native original drew this through `react-native-svg`, because
 * React Native has no gradient primitive. CSS does, so this is a background
 * declaration and no SVG at all.
 *
 * Usage:
 *   <Gradient type="linear" degree={180} colors={['#00000000', '#000000']} />
 */
import React, { type ReactNode } from 'react';
import { mergeStyles, type Style } from '../../internal/style';

export type GradientType = 'linear' | 'radial';

export interface GradientProps {
  /** @default 'linear' */
  type?: GradientType;
  /** Two or more CSS colours. */
  colors: string[];
  /** Stop positions 0–1, one per colour. Evenly spaced when omitted. */
  locations?: number[];
  /** Linear only. CSS angle: 180 points downward. @default 180 */
  degree?: number;
  /** Radial only. @default 'center' */
  position?: string;
  children?: ReactNode;
  style?: Style;
}

export default function Gradient({
  type = 'linear',
  colors,
  locations,
  degree = 180,
  position = 'center',
  children,
  style,
}: GradientProps) {
  const stops = colors
    .map((c, i) => {
      const at = locations?.[i];
      return at == null ? c : `${c} ${at * 100}%`;
    })
    .join(', ');

  const background =
    type === 'radial'
      ? `radial-gradient(circle at ${position}, ${stops})`
      : `linear-gradient(${degree}deg, ${stops})`;

  return <div style={mergeStyles({ background }, style)}>{children}</div>;
}

export { Gradient };
