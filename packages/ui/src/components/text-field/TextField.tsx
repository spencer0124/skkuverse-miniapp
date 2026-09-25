/**
 * TextField — labelled text input.
 *
 * Built to the @toss/tds-mobile v2 contract: `variant` picks the shape, and
 * `labelOption` decides whether the label is always visible or only once the
 * field has a value.
 *
 * The floating label is a real `<label>` bound to the input by id, so clicking
 * it focuses the field and a screen reader announces the two together. The
 * React Native original drew a positioned Text, which had neither.
 *
 * Usage:
 *   <TextField variant="box" label="이름" labelOption="sustain"
 *              value={name} onChange={(e) => setName(e.target.value)} />
 */
import React, {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap, type TypographyKeys } from '../../foundation/typography';
import { useControlled } from '../../utils/useControlled';
import { mergeStyles, type Style } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';
import { XCircleIcon } from '../../internal/icons';

export type TextFieldVariant = 'box' | 'line' | 'big' | 'hero';
export type TextFieldLabelOption = 'appear' | 'sustain';

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'prefix' | 'size'>;

export interface TextFieldProps extends NativeInputProps {
  variant: TextFieldVariant;
  label?: string;
  /** @default 'appear' */
  labelOption?: TextFieldLabelOption;
  help?: ReactNode;
  /** @default false */
  hasError?: boolean;
  /** @default false */
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  right?: ReactNode;
  paddingTop?: string | number;
  paddingBottom?: string | number;
  format?: { transform: (value: string) => string; reset?: (formattedValue: string) => string };
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  style?: Style;
}

const variantTypography: Record<TextFieldVariant, TypographyKeys> = {
  box: 't5',
  line: 't5',
  big: 't3',
  hero: 't2',
};

const TextFieldRoot = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    variant,
    label,
    labelOption = 'appear',
    help,
    hasError = false,
    disabled = false,
    prefix,
    suffix,
    right,
    paddingTop,
    paddingBottom,
    format,
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    style,
    ...rest
  },
  ref,
) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [inner, setInner] = useControlled({
    controlledValue: value === undefined ? undefined : String(value),
    defaultValue: defaultValue === undefined ? '' : String(defaultValue),
  });

  const typo = typography[variantTypography[variant]];
  const hasValue = inner.length > 0;
  const labelVisible = label != null && (labelOption === 'sustain' || hasValue);
  const borderColor = hasError ? SdsColors.red500 : focused ? adaptive.grey700 : adaptive.grey200;

  const displayValue = format ? format.transform(inner) : inner;

  return (
    <div style={mergeStyles({ display: 'flex', flexDirection: 'column', width: '100%' }, style)}>
      {label != null && (
        <label
          htmlFor={id}
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: typography.t7.fontSize,
            lineHeight: `${typography.t7.lineHeight}px`,
            fontWeight: fontWeightMap.medium,
            color: hasError ? SdsColors.red500 : adaptive.grey600,
            // Kept in the layout rather than unmounted, so `appear` does not
            // shift everything below it when the first character is typed.
            opacity: labelVisible ? 1 : 0,
            transition: `opacity ${TRANSITION.quick}`,
            marginBottom: 4,
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingTop: paddingTop ?? (variant === 'box' ? 14 : 8),
          paddingBottom: paddingBottom ?? (variant === 'box' ? 14 : 8),
          paddingLeft: variant === 'box' ? 16 : 0,
          paddingRight: variant === 'box' ? 16 : 0,
          borderRadius: variant === 'box' ? 12 : 0,
          backgroundColor: variant === 'box' ? adaptive.grey50 : 'transparent',
          border: variant === 'box' ? `1px solid ${borderColor}` : 'none',
          borderBottom: `1px solid ${borderColor}`,
          transition: `border-color ${TRANSITION.quick}`,
          opacity: disabled ? 0.38 : 1,
        }}
      >
        {prefix ? <span style={{ color: adaptive.grey500 }}>{prefix}</span> : null}
        <input
          id={id}
          ref={ref}
          disabled={disabled}
          value={displayValue}
          onChange={(e) => {
            const next = format?.reset ? format.reset(e.target.value) : e.target.value;
            setInner(next);
            onChange?.(e);
          }}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: 0,
            fontFamily: FONT_FAMILY,
            fontSize: typo.fontSize,
            lineHeight: `${typo.lineHeight}px`,
            fontWeight: variant === 'big' || variant === 'hero' ? fontWeightMap.bold : fontWeightMap.regular,
            color: adaptive.grey900,
          }}
          {...rest}
        />
        {suffix ? <span style={{ color: adaptive.grey500 }}>{suffix}</span> : null}
        {right}
      </div>

      {help != null && (
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: typography.t7.fontSize,
            lineHeight: `${typography.t7.lineHeight}px`,
            color: hasError ? SdsColors.red500 : adaptive.grey500,
            marginTop: 6,
          }}
        >
          {help}
        </span>
      )}
    </div>
  );
});

// ── TextField.Clearable ──

export interface TextFieldClearableProps extends Omit<TextFieldProps, 'right'> {
  onClear?: () => void;
}

function TextFieldClearable({ onClear, ...props }: TextFieldClearableProps) {
  const adaptive = useAdaptive();
  const hasValue = String(props.value ?? '').length > 0;

  return (
    <TextFieldRoot
      {...props}
      right={
        hasValue ? (
          <button
            type="button"
            aria-label="입력 지우기"
            onClick={onClear}
            style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer' }}
          >
            <XCircleIcon size={20} weight="fill" color={adaptive.grey400} />
          </button>
        ) : null
      }
    />
  );
}

export const TextField = Object.assign(TextFieldRoot, { Clearable: TextFieldClearable });

export default TextField;
