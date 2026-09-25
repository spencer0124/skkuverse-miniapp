/**
 * TextButton — text-only button with arrow/underline/clear variants.
 *
 * Built to the @toss/tds-mobile v2 contract, where the size scale is a
 * t-shirt scale and `size` is required. SDS took a `typography` key instead;
 * v2 renamed it, so this maps size onto the same token scale.
 *
 * Usage:
 *   <TextButton size="medium" variant="arrow" onClick={openDetail}>더보기</TextButton>
 */
import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap, type TypographyKeys } from '../../foundation/typography';
import { mergeStyles, type Style } from '../../internal/style';
import type { ParagraphFontWeight } from '../paragraph/Paragraph';

export type TextButtonSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
export type TextButtonVariant = 'arrow' | 'underline' | 'clear';

/** The t-shirt scale mapped onto the shared typography tokens. */
const sizeToTypography: Record<TextButtonSize, TypographyKeys> = {
  xsmall: 't7',   // 13
  small: 'st11',  // 14
  medium: 't6',   // 15
  large: 'st10',  // 16
  xlarge: 't5',   // 17
  xxlarge: 'st9', // 18
};

const weightValue: Record<ParagraphFontWeight, string> = {
  regular: fontWeightMap.regular,
  medium: fontWeightMap.medium,
  semibold: fontWeightMap.semiBold,
  bold: fontWeightMap.bold,
};

export interface TextButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'color'> {
  children: ReactNode;
  size: TextButtonSize;
  /** @default 'clear' */
  variant?: TextButtonVariant;
  /** @default 'regular' */
  fontWeight?: ParagraphFontWeight;
  /** Overrides the typography implied by `size`. */
  typography?: TypographyKeys;
  /** @default adaptive.grey800 */
  color?: string;
  disabled?: boolean;
  style?: Style;
}

export const TextButton = forwardRef<HTMLButtonElement, TextButtonProps>(function TextButton(
  { children, size, variant = 'clear', fontWeight = 'regular', typography, color, disabled = false, style, ...rest },
  ref,
) {
  const adaptive = useAdaptive();
  const { typography: theme } = useTypographyTheme();
  const typo = theme[typography ?? sizeToTypography[size]];

  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      disabled={disabled}
      style={mergeStyles(
        {
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: disabled ? 'default' : 'pointer',
          fontFamily: FONT_FAMILY,
          fontSize: typo.fontSize,
          lineHeight: `${typo.lineHeight}px`,
          fontWeight: weightValue[fontWeight],
          color: color ?? adaptive.grey800,
          opacity: disabled ? 0.38 : 1,
          textDecoration: variant === 'underline' ? 'underline' : 'none',
        },
        style,
      )}
      {...rest}
    >
      {children}
      {variant === 'arrow' ? <span aria-hidden> ›</span> : null}
    </button>
  );
});

export default TextButton;
