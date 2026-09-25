/**
 * Button — built to the @toss/tds-mobile v2 contract.
 *
 * Not a rename of SDS's Button. The web system's prop names exist because the
 * React Native ones break on the DOM: `type` there was a colour variant, while
 * `type` on a button element means submit/reset. v2 renamed it `color` and gave
 * `type` back to HTML, which is what this implements.
 *
 * Usage:
 *   <Button color="primary" variant="fill" size="xlarge" display="full" onClick={submit}>
 *     지금 보내기
 *   </Button>
 */
import React, {
  Children,
  forwardRef,
  Fragment,
  useCallback,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { ThemeProvider, useTheme } from '../../core/ThemeProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap, type TypographyKeys } from '../../foundation/typography';
import { mergeStyles, type Style } from '../../internal/style';
import { ensureKeyframes, TRANSITION } from '../../internal/keyframes';

// ── Types ──

export type ButtonColor = 'primary' | 'danger' | 'light' | 'dark';
export type ButtonVariant = 'fill' | 'weak';
export type ButtonDisplay = 'inline' | 'block' | 'full';
export type ButtonSize = 'small' | 'medium' | 'large' | 'xlarge';

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'color'>;
type NativeAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'style' | 'color' | 'type'>;

export interface ButtonProps extends NativeButtonProps, Pick<NativeAnchorProps, 'href' | 'target' | 'rel'> {
  children: ReactNode;
  /** Renders an anchor instead of a button. @default 'button' */
  as?: 'button' | 'a';
  /** @default 'primary' */
  color?: ButtonColor;
  /** @default 'fill' */
  variant?: ButtonVariant;
  /** @default 'inline' */
  display?: ButtonDisplay;
  /** @default 'xlarge' */
  size?: ButtonSize;
  /** @default false */
  loading?: boolean;
  /** @default false */
  disabled?: boolean;
  /** Overrides the resolved text colour. */
  textColor?: string;
  style?: Style;
  containerStyle?: Style;
  textStyle?: Style;
  leftAccessory?: ReactNode;
}

const sizeToTypography: Record<ButtonSize, TypographyKeys> = {
  small: 't7',
  medium: 't6',
  large: 'st9',
  xlarge: 'st9',
};

/** Colour names other than `primary` resolve through a theme seed override. */
const colorToSeed: Record<Exclude<ButtonColor, 'primary'>, string> = {
  danger: SdsColors.red500,
  light: '#FFFFFFDE', // whiteOpacity900
  dark: SdsColors.grey700,
};

const containerBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  position: 'relative',
  boxSizing: 'border-box',
};

export const containerStylesBySize: Record<ButtonSize, CSSProperties> = {
  small: { paddingLeft: 10, paddingRight: 10, minHeight: 32, minWidth: 52, borderRadius: 8 },
  medium: { paddingLeft: 16, paddingRight: 16, minHeight: 38, minWidth: 64, borderRadius: 10 },
  large: { paddingLeft: 16, paddingRight: 16, minHeight: 48, minWidth: 80, borderRadius: 14 },
  xlarge: { paddingLeft: 28, paddingRight: 28, minHeight: 56, minWidth: 96, borderRadius: 16 },
};

const displayStyles: Record<ButtonDisplay, CSSProperties> = {
  inline: { alignSelf: 'flex-start' },
  block: {},
  full: { width: '100%' },
};

const containerDisplayStyles: Record<ButtonDisplay, CSSProperties> = {
  inline: {},
  block: {},
  full: { borderRadius: 0, width: '100%' },
};

const ABSOLUTE_FILL: CSSProperties = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };

// ── Inner Button (reads the resolved theme) ──

const ButtonInner = forwardRef<HTMLButtonElement & HTMLAnchorElement, ButtonProps>(function ButtonInner(
  {
    children,
    as = 'button',
    size = 'xlarge',
    variant = 'fill',
    display = 'inline',
    disabled = false,
    loading = false,
    textColor,
    style,
    containerStyle,
    textStyle,
    leftAccessory,
    onPointerDown,
    onPointerUp,
    onClick,
    // Consumed by the outer Button, which maps it to a theme seed.
    color: _color,
    ...restProps
  },
  ref,
) {
  ensureKeyframes();
  const { token } = useTheme();
  const { typography } = useTypographyTheme();
  const isInteractive = !(disabled || loading);
  const [pressed, setPressed] = useState(false);

  const colors = useMemo(
    () =>
      variant === 'weak'
        ? {
            bg: token.button.backgroundWeakColor,
            text: token.button.textWeakColor,
            dim: token.button.dimWeakColor,
            loader: token.button.loaderWeakColor,
          }
        : {
            bg: token.button.backgroundFillColor,
            text: token.button.textFillColor,
            dim: token.button.dimFillColor,
            loader: token.button.loaderFillColor,
          },
    [variant, token.button],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e);
      if (isInteractive) setPressed(true);
    },
    [onPointerDown, isInteractive],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerUp?.(e);
      setPressed(false);
    },
    [onPointerUp],
  );

  // Only the inline display scales on press, matching the design system.
  const scale = display === 'inline' && pressed ? 0.96 : 1;
  const dimOpacity = pressed ? (variant === 'fill' ? 0.26 : 0.13) : 0;
  const typo = typography[sizeToTypography[size]];

  const renderedChildren = Children.map(children, (child, idx) =>
    typeof child === 'string' || typeof child === 'number' ? (
      <span
        key={idx}
        style={mergeStyles(
          {
            fontFamily: FONT_FAMILY,
            fontSize: typo.fontSize,
            lineHeight: `${typo.lineHeight}px`,
            fontWeight: fontWeightMap.semiBold,
            color: textColor ?? colors.text,
          },
          textStyle,
        )}
      >
        {child}
      </span>
    ) : (
      <Fragment key={idx}>{child}</Fragment>
    ),
  );

  const Root = as as 'button';

  return (
    <Root
      ref={ref}
      // `type` is HTML's, and callers set it. Only default it for a button.
      {...(as === 'button' ? { type: restProps.type ?? 'button', disabled } : {})}
      aria-disabled={disabled || undefined}
      onClick={isInteractive ? onClick : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={mergeStyles(
        {
          background: 'none',
          border: 'none',
          padding: 0,
          textDecoration: 'none',
          cursor: isInteractive ? 'pointer' : 'default',
        },
        displayStyles[display],
        style,
      )}
      {...restProps}
    >
      <span
        style={mergeStyles(
          containerBase,
          containerStylesBySize[size],
          containerDisplayStyles[display],
          {
            opacity: disabled ? (variant === 'fill' ? 0.26 : 1) : 1,
            transform: `scale(${scale})`,
            transition: `transform ${TRANSITION.rapid}`,
          },
          containerStyle,
        )}
      >
        <span style={mergeStyles(ABSOLUTE_FILL, { backgroundColor: colors.bg })} />

        <span
          style={mergeStyles(
            { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, position: 'relative' },
            { opacity: disabled && variant !== 'fill' ? 0.38 : 1 },
          )}
        >
          {leftAccessory}
          {renderedChildren}
        </span>

        {loading && (
          <span
            style={mergeStyles(ABSOLUTE_FILL, {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.bg,
            })}
          >
            <span style={{ display: 'flex', flexDirection: 'row', gap: 7 }}>
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: colors.loader,
                    borderRadius: 99,
                    animation: `sds-dot-pulse 800ms ${delay}ms ease-in-out infinite`,
                  }}
                />
              ))}
            </span>
          </span>
        )}

        <span
          style={mergeStyles(ABSOLUTE_FILL, {
            backgroundColor: colors.dim,
            opacity: dimOpacity,
            transition: `opacity ${TRANSITION.quick}`,
            pointerEvents: 'none',
          })}
        />
      </span>
    </Root>
  );
});

// ── Public Button ──

export const Button = forwardRef<HTMLButtonElement & HTMLAnchorElement, ButtonProps>(
  function Button({ color = 'primary', ...props }, ref) {
    const tokenOverride = useMemo(
      () => (color === 'primary' ? {} : { color: { primary: colorToSeed[color] } }),
      [color],
    );

    if (color === 'primary') {
      return <ButtonInner {...props} ref={ref} />;
    }

    return (
      <ThemeProvider token={tokenOverride}>
        <ButtonInner {...props} ref={ref} />
      </ThemeProvider>
    );
  },
);

export default Button;
