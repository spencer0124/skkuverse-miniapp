/**
 * SearchField — search input with a leading glyph and an optional clear button.
 *
 * Converted for the browser, with `type="search"` so mobile keyboards show a
 * search key and the field participates in a form the way a search field
 * should. The glyphs come from Phosphor, the same icon family the React Native
 * app draws from.
 *
 * Usage:
 *   <SearchField value={q} onChange={(e) => setQ(e.target.value)} hasClearButton />
 */
import React, { forwardRef, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY } from '../../foundation/typography';
import { useControlled } from '../../utils/useControlled';
import { mergeStyles, type Style } from '../../internal/style';
import { MagnifyingGlassIcon, XCircleIcon } from '../../internal/icons';

export interface SearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'size' | 'type'> {
  /** @default false — matches the design system's default. */
  hasClearButton?: boolean;
  onClear?: () => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  style?: Style;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { hasClearButton = false, onClear, value, defaultValue, onChange, disabled, placeholder, style, ...rest },
  ref,
) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  const [inner, setInner] = useControlled({
    controlledValue: value === undefined ? undefined : String(value),
    defaultValue: defaultValue === undefined ? '' : String(defaultValue),
  });
  const typo = typography.t5;

  return (
    <div
      style={mergeStyles(
        {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 48,
          paddingLeft: 14,
          paddingRight: 14,
          borderRadius: 12,
          backgroundColor: adaptive.grey100,
          opacity: disabled ? 0.38 : 1,
        },
        style,
      )}
    >
      <MagnifyingGlassIcon size={20} color={adaptive.grey500} aria-hidden />
      <input
        ref={ref}
        type="search"
        value={inner}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          setInner(e.target.value);
          onChange?.(e);
        }}
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
          color: adaptive.grey900,
          // Safari draws its own clear affordance on a search input, which
          // would sit next to ours.
          WebkitAppearance: 'none',
        }}
        {...rest}
      />
      {hasClearButton && inner.length > 0 ? (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => {
            setInner('');
            onClear?.();
          }}
          style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer' }}
        >
          <XCircleIcon size={20} weight="fill" color={adaptive.grey400} />
        </button>
      ) : null}
    </div>
  );
});

export default SearchField;
