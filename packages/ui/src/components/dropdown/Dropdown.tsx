/**
 * Dropdown — trigger plus a list of choices.
 *
 * Closes on outside click and on Escape, and moves focus back to the trigger
 * when it closes, so keyboard users are not stranded where the menu used to be.
 *
 * Usage:
 *   <Dropdown defaultValue="all" onChange={setScope}>
 *     <Dropdown.Item value="all">전체</Dropdown.Item>
 *     <Dropdown.Item value="mine">내 글</Dropdown.Item>
 *   </Dropdown>
 */
import React, {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { useControlled } from '../../utils/useControlled';
import { mergeStyles, toBoxShadow, type Style } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';
import { CaretDownIcon, CheckIcon } from '../../internal/icons';

interface ContextValue {
  value: string;
  select: (value: string) => void;
}

const DropdownContext = createContext<ContextValue | null>(null);

export interface DropdownProps {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: Style;
}

function labelFor(children: ReactNode, value: string): ReactNode {
  const match = Children.toArray(children).find(
    (c): c is React.ReactElement<DropdownItemProps> =>
      isValidElement(c) && (c.props as DropdownItemProps).value === value,
  );
  return match?.props.children;
}

function DropdownRoot({ children, value, defaultValue, onChange, placeholder, disabled = false, style }: DropdownProps) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useControlled({
    controlledValue: value,
    defaultValue: defaultValue ?? '',
  });

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const context = useMemo<ContextValue>(
    () => ({
      value: selected,
      select: (next) => {
        setSelected(next);
        onChange?.(next);
        close();
      },
    }),
    [selected, setSelected, onChange, close],
  );

  const typo = typography.t5;
  const label = labelFor(children, selected) ?? placeholder ?? '선택해 주세요';

  return (
    <DropdownContext.Provider value={context}>
      <div ref={rootRef} style={mergeStyles({ position: 'relative', display: 'inline-block' }, style)}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: adaptive.grey100,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.38 : 1,
            fontFamily: FONT_FAMILY,
            fontSize: typo.fontSize,
            lineHeight: `${typo.lineHeight}px`,
            fontWeight: fontWeightMap.medium,
            color: adaptive.grey900,
          }}
        >
          {label}
          <CaretDownIcon
            size={16}
            color={adaptive.grey500}
            style={{ transform: `rotate(${open ? 180 : 0}deg)`, transition: `transform ${TRANSITION.quick}` }}
          />
        </button>

        {open ? (
          <ul
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 50,
              margin: 0,
              padding: 6,
              listStyle: 'none',
              minWidth: '100%',
              borderRadius: 12,
              backgroundColor: adaptive.floatedBackground,
              boxShadow: toBoxShadow('#000000', 0, 4, 12, 0.12),
            }}
          >
            {children}
          </ul>
        ) : null}
      </div>
    </DropdownContext.Provider>
  );
}

// ── Item ──

export interface DropdownItemProps {
  children: ReactNode;
  value: string;
}

function DropdownItem({ children, value }: DropdownItemProps) {
  const ctx = useContext(DropdownContext);
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  if (!ctx) throw new Error('Dropdown.Item must be used within a Dropdown');

  const isSelected = ctx.value === value;
  const typo = typography.t5;

  return (
    <li role="option" aria-selected={isSelected}>
      <button
        type="button"
        onClick={() => ctx.select(value)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          width: '100%',
          padding: '10px 12px',
          border: 'none',
          borderRadius: 8,
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          whiteSpace: 'nowrap',
          fontFamily: FONT_FAMILY,
          fontSize: typo.fontSize,
          lineHeight: `${typo.lineHeight}px`,
          fontWeight: isSelected ? fontWeightMap.bold : fontWeightMap.regular,
          color: adaptive.grey900,
        }}
      >
        {children}
        {isSelected ? <CheckIcon size={16} weight="bold" color={adaptive.grey900} /> : null}
      </button>
    </li>
  );
}

export const Dropdown = Object.assign(DropdownRoot, { Item: DropdownItem });

export default Dropdown;
