/**
 * Switch — on/off toggle.
 *
 * Built to the @toss/tds-mobile v2 contract, whose `onChange` carries both the
 * event and the resolved boolean.
 *
 * A real `input[type=checkbox]` sits behind the visuals rather than a styled
 * div, so keyboard focus, form submission and screen-reader state come from the
 * platform instead of being reimplemented. The React Native original had no such
 * option and drove everything from a gesture handler.
 *
 * Usage:
 *   <Switch checked={on} onChange={(_, next) => setOn(next)} />
 */
import React, { forwardRef, type ChangeEvent, type MouseEvent } from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTheme } from '../../core/ThemeProvider';
import { mergeStyles, toBoxShadow, type Style } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';

export interface SwitchProps {
  checked?: boolean;
  /** @default false */
  disabled?: boolean;
  name?: string;
  /** @default true */
  hasTouchEffect?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  onClick?: (event: MouseEvent<HTMLInputElement>) => void;
  style?: Style;
}

const TRACK = { width: 52, height: 32, pad: 2 };
const KNOB = TRACK.height - TRACK.pad * 2;

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { checked, disabled = false, name, hasTouchEffect = true, onChange, onClick, style },
  ref,
) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const isOn = checked === true;

  return (
    <label
      style={mergeStyles(
        {
          display: 'inline-flex',
          position: 'relative',
          width: TRACK.width,
          height: TRACK.height,
          flexShrink: 0,
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.38 : 1,
        },
        style,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        name={name}
        checked={isOn}
        disabled={disabled}
        onChange={(e) => onChange?.(e, e.target.checked)}
        onClick={onClick}
        // Visually hidden rather than display:none, which would drop it out of
        // the accessibility tree and the tab order.
        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0, cursor: 'inherit' }}
      />
      <span
        aria-hidden
        style={{
          width: '100%',
          height: '100%',
          borderRadius: TRACK.height / 2,
          backgroundColor: isOn ? token.color.primary : adaptive.grey200,
          transition: `background-color ${TRANSITION.quick}`,
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: TRACK.pad,
          left: TRACK.pad,
          width: KNOB,
          height: KNOB,
          borderRadius: '50%',
          backgroundColor: SdsColors.background,
          boxShadow: toBoxShadow('#000000', 0, 1, 3, 0.15),
          transform: `translateX(${isOn ? TRACK.width - KNOB - TRACK.pad * 2 : 0}px)`,
          transition: hasTouchEffect ? `transform ${TRANSITION.quick}` : undefined,
        }}
      />
    </label>
  );
});

export default Switch;
