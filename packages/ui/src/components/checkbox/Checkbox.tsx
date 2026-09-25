/**
 * Checkbox — checkbox or radio input.
 *
 * Built to the @toss/tds-mobile v2 contract, where one component covers both
 * shapes through `inputType` and reports through `onCheckedChange` rather than
 * a change event.
 *
 * The mark is inline SVG. The React Native original used `react-native-svg`;
 * the browser draws the same paths natively.
 *
 * Usage:
 *   <Checkbox checked={agreed} onCheckedChange={setAgreed} />
 *   <Checkbox inputType="radio" defaultChecked />
 */
import React, { forwardRef } from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTheme } from '../../core/ThemeProvider';
import { useControlled } from '../../utils/useControlled';
import { mergeStyles, type Style } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';

export interface CheckboxProps {
  /** @default 'checkbox' */
  inputType?: 'checkbox' | 'radio';
  /** @default 24 */
  size?: number;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  style?: Style;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { inputType = 'checkbox', size = 24, checked, defaultChecked, onCheckedChange, disabled = false, name, value, style },
  ref,
) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const [isChecked, setChecked] = useControlled({
    controlledValue: checked,
    defaultValue: defaultChecked ?? false,
  });

  return (
    <label
      style={mergeStyles(
        {
          display: 'inline-flex',
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.38 : 1,
        },
        style,
      )}
    >
      <input
        ref={ref}
        type={inputType}
        name={name}
        value={value}
        checked={isChecked}
        disabled={disabled}
        onChange={(e) => {
          setChecked(e.target.checked);
          onCheckedChange?.(e.target.checked);
        }}
        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0, cursor: 'inherit' }}
      />
      <span
        aria-hidden
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: inputType === 'radio' ? '50%' : size / 4,
          backgroundColor: isChecked ? token.color.primary : adaptive.grey200,
          transition: `background-color ${TRANSITION.quick}`,
        }}
      >
        {inputType === 'radio' ? (
          <span
            style={{
              width: size / 3,
              height: size / 3,
              borderRadius: '50%',
              backgroundColor: SdsColors.background,
              opacity: isChecked ? 1 : 0,
              transition: `opacity ${TRANSITION.rapid}`,
            }}
          />
        ) : (
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5L10 17.5L19 7.5"
              stroke={SdsColors.background}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isChecked ? 1 : 0}
              style={{ transition: `opacity ${TRANSITION.rapid}` }}
            />
          </svg>
        )}
      </span>
    </label>
  );
});

export default Checkbox;
