/**
 * Badge — small label component.
 *
 * Built to the @toss/tds-mobile v2 contract. The web Badge takes a **semantic**
 * colour name rather than SDS's free-form `color` / `backgroundColor` strings,
 * and derives both foreground and background from it, so a badge cannot be
 * given a combination the design system never sanctioned.
 *
 * Usage:
 *   <Badge color="blue" variant="fill" size="small">New</Badge>
 */
import React from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap, type TypographyKeys } from '../../foundation/typography';
import { mergeStyles, type Style } from '../../internal/style';

export type BadgeVariant = 'fill' | 'weak';
export type BadgeSize = 'xsmall' | 'small' | 'medium' | 'large';
export type BadgeColor = 'blue' | 'teal' | 'green' | 'red' | 'yellow' | 'elephant';

export interface BadgeProps {
  children: string;
  variant: BadgeVariant;
  size: BadgeSize;
  color: BadgeColor;
  style?: Style;
}

/**
 * `elephant` is the design system's neutral grey. The rest map onto the token
 * palette's 500 (fill) and 50 (weak) steps.
 */
const palette: Record<BadgeColor, { strong: string; weak: string }> = {
  blue: { strong: SdsColors.blue500, weak: SdsColors.blue50 },
  teal: { strong: SdsColors.teal500, weak: SdsColors.teal50 },
  green: { strong: SdsColors.green500, weak: SdsColors.green50 },
  red: { strong: SdsColors.red500, weak: SdsColors.red50 },
  yellow: { strong: SdsColors.yellow500, weak: SdsColors.yellow50 },
  elephant: { strong: SdsColors.grey600, weak: SdsColors.grey100 },
};

const sizeTypography: Record<BadgeSize, TypographyKeys> = {
  xsmall: 'st13',
  small: 't7',
  medium: 't6',
  large: 't5',
};

const sizeBox: Record<BadgeSize, { padX: number; padY: number; radius: number }> = {
  xsmall: { padX: 4, padY: 1, radius: 4 },
  small: { padX: 6, padY: 2, radius: 6 },
  medium: { padX: 8, padY: 3, radius: 8 },
  large: { padX: 10, padY: 4, radius: 10 },
};

export default function Badge({ children, variant, size, color, style }: BadgeProps) {
  const { typography } = useTypographyTheme();
  const tone = palette[color];
  const box = sizeBox[size];
  const typo = typography[sizeTypography[size]];

  const colors =
    variant === 'fill'
      ? { backgroundColor: tone.strong, color: SdsColors.background }
      : { backgroundColor: tone.weak, color: tone.strong };

  return (
    <span
      style={mergeStyles(
        {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
          fontFamily: FONT_FAMILY,
          fontSize: typo.fontSize,
          lineHeight: `${typo.lineHeight}px`,
          fontWeight: fontWeightMap.bold,
          paddingLeft: box.padX,
          paddingRight: box.padX,
          paddingTop: box.padY,
          paddingBottom: box.padY,
          borderRadius: box.radius,
        },
        colors,
        style,
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
