/**
 * Radio — single-choice group.
 *
 * `Radio` owns the value and `Radio.Option` renders each choice. The options
 * share a generated `name`, so the browser enforces single selection and gives
 * arrow-key navigation within the group for free — behaviour the React Native
 * original had to implement.
 *
 * Usage:
 *   <Radio defaultValue="all" onChange={setScope}>
 *     <Radio.Option value="all">전체</Radio.Option>
 *     <Radio.Option value="mine">내 글</Radio.Option>
 *   </Radio>
 */
import React, { createContext, useContext, useId, useMemo, type ReactNode } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { useControlled } from '../../utils/useControlled';
import { mergeStyles, type Style } from '../../internal/style';
import { Checkbox } from '../checkbox';

interface ContextValue {
  name: string;
  value: string;
  size: number;
  disabled: boolean;
  select: (value: string) => void;
}

const RadioContext = createContext<ContextValue | null>(null);

export interface RadioProps {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** @default 24 */
  size?: number;
  disabled?: boolean;
  style?: Style;
}

function RadioRoot({ children, value, defaultValue, onChange, size = 24, disabled = false, style }: RadioProps) {
  const name = useId();
  const [selected, setSelected] = useControlled({
    controlledValue: value,
    defaultValue: defaultValue ?? '',
  });

  const context = useMemo<ContextValue>(
    () => ({
      name,
      value: selected,
      size,
      disabled,
      select: (next) => {
        setSelected(next);
        onChange?.(next);
      },
    }),
    [name, selected, size, disabled, setSelected, onChange],
  );

  return (
    <RadioContext.Provider value={context}>
      <div role="radiogroup" style={mergeStyles({ display: 'flex', flexDirection: 'column', gap: 4 }, style)}>
        {children}
      </div>
    </RadioContext.Provider>
  );
}

// ── Option ──

export interface RadioOptionProps {
  children: ReactNode;
  value: string;
  disabled?: boolean;
}

function RadioOption({ children, value, disabled }: RadioOptionProps) {
  const ctx = useContext(RadioContext);
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  if (!ctx) throw new Error('Radio.Option must be used within a Radio');

  const isDisabled = disabled ?? ctx.disabled;
  const typo = typography.t5;

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        paddingTop: 10,
        paddingBottom: 10,
        cursor: isDisabled ? 'default' : 'pointer',
      }}
    >
      <Checkbox
        inputType="radio"
        name={ctx.name}
        value={value}
        size={ctx.size}
        checked={ctx.value === value}
        disabled={isDisabled}
        onCheckedChange={(checked) => { if (checked) ctx.select(value); }}
      />
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: typo.fontSize,
          lineHeight: `${typo.lineHeight}px`,
          fontWeight: fontWeightMap.medium,
          color: adaptive.grey800,
          opacity: isDisabled ? 0.38 : 1,
        }}
      >
        {children}
      </span>
    </label>
  );
}

export const Radio = Object.assign(RadioRoot, { Option: RadioOption });

export default Radio;
