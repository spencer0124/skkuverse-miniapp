/**
 * IconButton — icon-only button with fill/clear/border variants.
 *
 * Built to the @toss/tds-mobile v2 contract, with one deliberate addition.
 *
 * Upstream identifies the icon by `src` (a URL) or `name`, both resolving
 * against Toss's icon CDN. This project draws its icons from Phosphor and does
 * not use that CDN, so `icon` accepts a rendered element as well. Exactly one of
 * `icon`, `src` or `name` should be given; `icon` wins if several are.
 *
 * `aria-label` is required upstream and required here — an icon alone does not
 * tell a screen reader what the button does.
 *
 * Usage:
 *   <IconButton icon={<XIcon />} aria-label="닫기" variant="fill" />
 */
import React, { forwardRef, useCallback, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { mergeStyles, type Style } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';

export type IconButtonVariant = 'fill' | 'clear' | 'border';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'color'> {
  /** Required: an icon alone does not convey the action. */
  'aria-label': string;
  /** A rendered icon element. Not upstream — see the note above. */
  icon?: ReactNode;
  /** Icon URL. Mutually exclusive with `name` and `icon`. */
  src?: string;
  /** Icon name. Mutually exclusive with `src` and `icon`. */
  name?: string;
  /** @default 'clear' */
  variant?: IconButtonVariant;
  /** Applies to monotype icons only. */
  color?: string;
  /** @default adaptive.greyOpacity200 */
  bgColor?: string;
  /** @default 24 */
  iconSize?: number;
  disabled?: boolean;
  style?: Style;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, src, name, iconSize = 24, variant = 'clear', color, bgColor, disabled = false, style, ...rest },
  ref,
) {
  const adaptive = useAdaptive();
  const [pressed, setPressed] = useState(false);
  const containerSize = iconSize + iconSize * 0.5;

  const press = useCallback(() => { if (!disabled) setPressed(true); }, [disabled]);
  const release = useCallback(() => setPressed(false), []);

  const variantStyle: CSSProperties =
    variant === 'fill'
      ? { backgroundColor: bgColor ?? adaptive.greyOpacity200 }
      : variant === 'border'
        ? { border: `1px solid ${bgColor ?? adaptive.grey200}`, backgroundColor: 'transparent' }
        : {}; // 'clear' — no background

  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      disabled={disabled}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      style={mergeStyles(
        { background: 'none', border: 'none', padding: 0, cursor: disabled ? 'default' : 'pointer' },
        style,
      )}
      {...rest}
    >
      <span
        style={mergeStyles(
          { display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' },
          { width: containerSize, height: containerSize, borderRadius: containerSize / 2, color },
          variantStyle,
          { opacity: disabled ? 0.38 : 1 },
          { transform: `scale(${pressed ? 0.9 : 1})`, transition: `transform ${TRANSITION.rapid}` },
        )}
      >
        {icon ?? (
          (src ?? name) ? (
            <img
              src={src ?? `https://static.toss.im/icons/svg/${name}.svg`}
              alt=""
              width={iconSize}
              height={iconSize}
            />
          ) : null
        )}
      </span>
    </button>
  );
});

export default IconButton;
