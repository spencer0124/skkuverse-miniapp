/**
 * Paragraph — the text component.
 *
 * Built to the @toss/tds-mobile v2 contract, not to SDS's `Txt`. The web design
 * system has no `Txt`: text is a `Paragraph` root carrying `typography`, with
 * `.Text`, `.Icon`, `.Badge` and `.Link` as children.
 *
 * Usage:
 *   <Paragraph typography="t5">
 *     <Paragraph.Text>동해물과 백두산이</Paragraph.Text>
 *     <Paragraph.Badge color="blue" variant="fill">우리</Paragraph.Badge>
 *   </Paragraph>
 */
import React, { forwardRef, type AnchorHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import {
  FONT_FAMILY,
  fontWeightMap,
  type TypographyKeys,
} from '../../foundation/typography';
import { lineClamp, mergeStyles } from '../../internal/style';
import { Badge, type BadgeColor, type BadgeVariant } from '../badge';

/**
 * The web system's weight vocabulary. Narrower than SDS's `FontWeightKeys`, and
 * spelled `semibold` rather than `semiBold`.
 */
export type ParagraphFontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

const weightValue: Record<ParagraphFontWeight, string> = {
  regular: fontWeightMap.regular,
  medium: fontWeightMap.medium,
  semibold: fontWeightMap.semiBold,
  bold: fontWeightMap.bold,
};

export interface ParagraphProps extends Omit<HTMLAttributes<HTMLParagraphElement>, 'color'> {
  /** @default 't5' */
  typography?: TypographyKeys;
  /** @default 'regular' */
  fontWeight?: ParagraphFontWeight;
  /** @default adaptive.grey800 */
  color?: string;
  numberOfLines?: number;
  textAlign?: CSSProperties['textAlign'];
  children: ReactNode;
}

function useParagraphStyle(
  typography: TypographyKeys,
  fontWeight: ParagraphFontWeight,
  color: string,
): CSSProperties {
  const { typography: theme } = useTypographyTheme();
  const typo = theme[typography];
  return {
    fontFamily: FONT_FAMILY,
    fontSize: typo.fontSize,
    // React leaves lineHeight unitless, where the token's absolute 25.5 would
    // mean 25.5x the font size.
    lineHeight: `${typo.lineHeight}px`,
    fontWeight: weightValue[fontWeight],
    color,
  };
}

const ParagraphRoot = forwardRef<HTMLParagraphElement, ParagraphProps>(function Paragraph(
  { typography = 't5', fontWeight = 'regular', color, numberOfLines, textAlign, style, children, ...rest },
  ref,
) {
  const adaptive = useAdaptive();
  const base = useParagraphStyle(typography, fontWeight, color ?? adaptive.grey800);

  return (
    <p
      ref={ref}
      style={mergeStyles(base, { margin: 0, textAlign }, lineClamp(numberOfLines), style)}
      {...rest}
    >
      {children}
    </p>
  );
});

// ── Paragraph.Text ──

export interface ParagraphTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  typography?: TypographyKeys;
  fontWeight?: ParagraphFontWeight;
  color?: string;
  children: ReactNode;
}

const ParagraphText = forwardRef<HTMLSpanElement, ParagraphTextProps>(function ParagraphText(
  { typography, fontWeight, color, style, children, ...rest },
  ref,
) {
  const { typography: theme } = useTypographyTheme();
  const typo = typography ? theme[typography] : undefined;

  return (
    <span
      ref={ref}
      // Everything is optional: unset props inherit the Paragraph root, which is
      // what makes mixed-emphasis text read naturally.
      style={mergeStyles(
        typo ? { fontSize: typo.fontSize, lineHeight: `${typo.lineHeight}px` } : undefined,
        fontWeight ? { fontWeight: weightValue[fontWeight] } : undefined,
        color ? { color } : undefined,
        style,
      )}
      {...rest}
    >
      {children}
    </span>
  );
});

// ── Paragraph.Icon ──

export interface ParagraphIconProps {
  /** A rendered icon element. */
  children?: ReactNode;
  /** @default 'middle' */
  verticalAlign?: CSSProperties['verticalAlign'];
  style?: CSSProperties;
}

function ParagraphIcon({ children, verticalAlign = 'middle', style }: ParagraphIconProps) {
  return (
    <span style={mergeStyles({ display: 'inline-flex', verticalAlign }, style)} aria-hidden>
      {children}
    </span>
  );
}

// ── Paragraph.Badge ──

export interface ParagraphBadgeProps {
  color: BadgeColor;
  variant: BadgeVariant;
  children: string;
}

function ParagraphBadge({ color, variant, children }: ParagraphBadgeProps) {
  return (
    <Badge color={color} variant={variant} size="small" style={{ verticalAlign: 'middle' }}>
      {children}
    </Badge>
  );
}

// ── Paragraph.Link ──

export interface ParagraphLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color' | 'type'> {
  /** @default 'none' */
  type?: 'underline' | 'none';
  /** @default adaptive.blue500 */
  color?: string;
  children: ReactNode;
}

function ParagraphLink({ type = 'none', color, style, children, ...rest }: ParagraphLinkProps) {
  const adaptive = useAdaptive();
  return (
    <a
      style={mergeStyles(
        { color: color ?? adaptive.blue500, textDecoration: type === 'underline' ? 'underline' : 'none' },
        style,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}

export const Paragraph = Object.assign(ParagraphRoot, {
  Text: ParagraphText,
  Icon: ParagraphIcon,
  Badge: ParagraphBadge,
  Link: ParagraphLink,
});

export default Paragraph;
