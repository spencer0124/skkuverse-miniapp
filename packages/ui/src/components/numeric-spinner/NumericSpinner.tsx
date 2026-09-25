/**
 * NumericSpinner — minus / value / plus stepper.
 *
 * The buttons disable at the bounds rather than silently clamping, so the limit
 * is visible before the tap rather than only after it.
 *
 * Usage:
 *   <NumericSpinner value={count} min={1} max={9} onChange={setCount} />
 */
import React from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap, type TypographyKeys } from '../../foundation/typography';
import { useControlled } from '../../utils/useControlled';
import { mergeStyles, type Style } from '../../internal/style';
import { MinusIcon, PlusIcon } from '../../internal/icons';

export type NumericSpinnerSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface NumericSpinnerProps {
  value?: number;
  defaultValue?: number;
  /** @default 0 */
  min?: number;
  /** @default Number.MAX_SAFE_INTEGER */
  max?: number;
  /** @default 1 */
  step?: number;
  /** @default 'medium' */
  size?: NumericSpinnerSize;
  disabled?: boolean;
  onChange?: (value: number) => void;
  style?: Style;
}

const sizeBox: Record<NumericSpinnerSize, { button: number; icon: number; typography: TypographyKeys }> = {
  small: { button: 28, icon: 14, typography: 't7' },
  medium: { button: 32, icon: 16, typography: 't6' },
  large: { button: 40, icon: 20, typography: 't5' },
  xlarge: { button: 48, icon: 24, typography: 't4' },
};

export default function NumericSpinner({
  value,
  defaultValue,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  size = 'medium',
  disabled = false,
  onChange,
  style,
}: NumericSpinnerProps) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  const box = sizeBox[size];
  const [current, setCurrent] = useControlled({
    controlledValue: value,
    defaultValue: defaultValue ?? min,
  });

  const set = (next: number) => {
    const clamped = Math.max(min, Math.min(max, next));
    if (clamped === current) return;
    setCurrent(clamped);
    onChange?.(clamped);
  };

  const typo = typography[box.typography];
  const atMin = current <= min;
  const atMax = current >= max;

  const stepButton = (kind: 'minus' | 'plus') => {
    const isDisabled = disabled || (kind === 'minus' ? atMin : atMax);
    const Glyph = kind === 'minus' ? MinusIcon : PlusIcon;
    return (
      <button
        type="button"
        aria-label={kind === 'minus' ? '값 줄이기' : '값 늘리기'}
        disabled={isDisabled}
        onClick={() => set(current + (kind === 'minus' ? -step : step))}
        style={{
          width: box.button,
          height: box.button,
          borderRadius: '50%',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: adaptive.grey100,
          cursor: isDisabled ? 'default' : 'pointer',
          opacity: isDisabled ? 0.38 : 1,
        }}
      >
        <Glyph size={box.icon} weight="bold" color={adaptive.grey800} />
      </button>
    );
  };

  return (
    <div
      role="group"
      style={mergeStyles({ display: 'inline-flex', alignItems: 'center', gap: 12 }, style)}
    >
      {stepButton('minus')}
      <span
        aria-live="polite"
        style={{
          minWidth: box.button,
          textAlign: 'center',
          fontFamily: FONT_FAMILY,
          fontSize: typo.fontSize,
          lineHeight: `${typo.lineHeight}px`,
          fontWeight: fontWeightMap.bold,
          color: adaptive.grey900,
          // Digits vary in width in most proportional faces, so the row would
          // shift as the value changes.
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {current}
      </span>
      {stepButton('plus')}
    </div>
  );
}

export { NumericSpinner };
