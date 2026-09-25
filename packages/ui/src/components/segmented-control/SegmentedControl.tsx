/**
 * SegmentedControl — pill selector with a sliding indicator.
 *
 * Built to the @toss/tds-mobile v2 contract: `SegmentedControl.Item` children,
 * `fixed` or `fluid` alignment, controlled or uncontrolled through
 * `value` / `defaultValue` / `onChange`.
 *
 * The indicator reads the selected button's own `offsetLeft` and `offsetWidth`
 * in a layout effect, which covers `fluid` — where items are as wide as their
 * text — with the same code as `fixed`, and needs no animation runtime.
 *
 * Usage:
 *   <SegmentedControl defaultValue="all" onChange={setTab}>
 *     <SegmentedControl.Item value="all">전체</SegmentedControl.Item>
 *     <SegmentedControl.Item value="mine">내 글</SegmentedControl.Item>
 *   </SegmentedControl>
 */
import React, {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { useControlled } from '../../utils/useControlled';
import { mergeStyles, toBoxShadow, type Style } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';

export type SegmentedControlSize = 'small' | 'large';
export type SegmentedControlAlignment = 'fixed' | 'fluid';

interface ContextValue {
  value: string;
  size: SegmentedControlSize;
  alignment: SegmentedControlAlignment;
  select: (value: string) => void;
  register: (value: string, el: HTMLButtonElement | null) => void;
}

const SegmentedControlContext = createContext<ContextValue | null>(null);

export interface SegmentedControlProps {
  children: ReactNode;
  /** @default 'small' */
  size?: SegmentedControlSize;
  /** @default 'fixed' */
  alignment?: SegmentedControlAlignment;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  style?: Style;
}

const sizeBox: Record<SegmentedControlSize, { height: number; padX: number; radius: number }> = {
  small: { height: 36, padX: 12, radius: 10 },
  large: { height: 44, padX: 16, radius: 12 },
};

function firstItemValue(children: ReactNode): string {
  const first = Children.toArray(children).find(isValidElement) as
    | React.ReactElement<SegmentedControlItemProps>
    | undefined;
  return first?.props.value ?? '';
}

function SegmentedControlRoot({
  children,
  size = 'small',
  alignment = 'fixed',
  value,
  defaultValue,
  onChange,
  style,
}: SegmentedControlProps) {
  const adaptive = useAdaptive();
  const box = sizeBox[size];
  const [selected, setSelected] = useControlled({
    controlledValue: value,
    defaultValue: defaultValue ?? firstItemValue(children),
  });

  const items = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const register = useCallback((itemValue: string, el: HTMLButtonElement | null) => {
    if (el) items.current.set(itemValue, el);
    else items.current.delete(itemValue);
  }, []);

  useLayoutEffect(() => {
    const el = items.current.get(selected);
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [selected, size, alignment, children]);

  const select = useCallback(
    (next: string) => {
      setSelected(next);
      onChange?.(next);
    },
    [setSelected, onChange],
  );

  const context = useMemo<ContextValue>(
    () => ({ value: selected, size, alignment, select, register }),
    [selected, size, alignment, select, register],
  );

  return (
    <SegmentedControlContext.Provider value={context}>
      <div
        role="tablist"
        style={mergeStyles(
          {
            position: 'relative',
            display: 'flex',
            padding: 2,
            borderRadius: box.radius + 2,
            backgroundColor: adaptive.grey100,
            overflowX: alignment === 'fluid' ? 'auto' : undefined,
          },
          style,
        )}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 2,
            left: 0,
            height: box.height,
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
            borderRadius: box.radius,
            backgroundColor: SdsColors.background,
            boxShadow: toBoxShadow('#000000', 0, 1, 2, 0.09),
            transition: `transform ${TRANSITION.quick}, width ${TRANSITION.quick}`,
          }}
        />
        {children}
      </div>
    </SegmentedControlContext.Provider>
  );
}

// ── Item ──

export interface SegmentedControlItemProps {
  children: ReactNode;
  value: string;
  size?: SegmentedControlSize;
}

function SegmentedControlItem({ children, value, size }: SegmentedControlItemProps) {
  const ctx = useContext(SegmentedControlContext);
  const { typography } = useTypographyTheme();
  const adaptive = useAdaptive();
  if (!ctx) throw new Error('SegmentedControl.Item must be used within a SegmentedControl');

  const resolvedSize = size ?? ctx.size;
  const box = sizeBox[resolvedSize];
  const isSelected = ctx.value === value;
  const typo = typography[resolvedSize === 'large' ? 't6' : 't7'];

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      ref={(el) => ctx.register(value, el)}
      onClick={() => ctx.select(value)}
      style={{
        position: 'relative',
        flex: ctx.alignment === 'fixed' ? 1 : '0 0 auto',
        height: box.height,
        paddingLeft: box.padX,
        paddingRight: box.padX,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontFamily: FONT_FAMILY,
        fontSize: typo.fontSize,
        lineHeight: `${typo.lineHeight}px`,
        fontWeight: isSelected ? fontWeightMap.bold : fontWeightMap.medium,
        color: isSelected ? adaptive.grey900 : adaptive.grey600,
        transition: `color ${TRANSITION.quick}`,
      }}
    >
      {children}
    </button>
  );
}

export const SegmentedControl = Object.assign(SegmentedControlRoot, { Item: SegmentedControlItem });

export default SegmentedControl;
