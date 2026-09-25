/**
 * Tab — underlined tab strip.
 *
 * Same indicator technique as SegmentedControl: the selected button's own
 * offsetLeft and offsetWidth drive it, so `fluid` — items sized to their text,
 * scrolling horizontally — needs no separate measurement path.
 *
 * A selected tab is scrolled into view, which matters in `fluid` where the
 * active tab can start off-screen.
 *
 * Usage:
 *   <Tab value={tab} onChange={setTab}>
 *     <Tab.Item value="all">전체</Tab.Item>
 *     <Tab.Item value="unread" redBean>안 읽음</Tab.Item>
 *   </Tab>
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
import { useTheme } from '../../core/ThemeProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { useControlled } from '../../utils/useControlled';
import { mergeStyles, type Style } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';

export type TabAlignment = 'fixed' | 'fluid';

interface ContextValue {
  value: string;
  alignment: TabAlignment;
  select: (value: string) => void;
  register: (value: string, el: HTMLButtonElement | null) => void;
}

const TabContext = createContext<ContextValue | null>(null);

export interface TabProps {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** @default 'fixed' */
  alignment?: TabAlignment;
  style?: Style;
}

function firstItemValue(children: ReactNode): string {
  const first = Children.toArray(children).find(isValidElement) as
    | React.ReactElement<TabItemProps>
    | undefined;
  return first?.props.value ?? '';
}

function TabRoot({ children, value, defaultValue, onChange, alignment = 'fixed', style }: TabProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
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
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    el.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [selected, alignment, children]);

  const select = useCallback(
    (next: string) => {
      setSelected(next);
      onChange?.(next);
    },
    [setSelected, onChange],
  );

  const context = useMemo<ContextValue>(
    () => ({ value: selected, alignment, select, register }),
    [selected, alignment, select, register],
  );

  return (
    <TabContext.Provider value={context}>
      <div
        role="tablist"
        style={mergeStyles(
          {
            position: 'relative',
            display: 'flex',
            borderBottom: `1px solid ${adaptive.grey200}`,
            overflowX: alignment === 'fluid' ? 'auto' : undefined,
            scrollbarWidth: 'none',
          },
          style,
        )}
      >
        {children}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 2,
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
            backgroundColor: token.color.primary,
            transition: `transform ${TRANSITION.quick}, width ${TRANSITION.quick}`,
          }}
        />
      </div>
    </TabContext.Provider>
  );
}

// ── Item ──

export interface TabItemProps {
  children: ReactNode;
  value: string;
  /** Draws the unread dot beside the label. */
  redBean?: boolean;
  disabled?: boolean;
}

function TabItem({ children, value, redBean = false, disabled = false }: TabItemProps) {
  const ctx = useContext(TabContext);
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { typography } = useTypographyTheme();
  if (!ctx) throw new Error('Tab.Item must be used within a Tab');

  const isSelected = ctx.value === value;
  const typo = typography.t5;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      ref={(el) => ctx.register(value, el)}
      onClick={() => ctx.select(value)}
      style={{
        position: 'relative',
        flex: ctx.alignment === 'fixed' ? 1 : '0 0 auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '14px 16px',
        border: 'none',
        background: 'none',
        whiteSpace: 'nowrap',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.38 : 1,
        fontFamily: FONT_FAMILY,
        fontSize: typo.fontSize,
        lineHeight: `${typo.lineHeight}px`,
        fontWeight: isSelected ? fontWeightMap.bold : fontWeightMap.medium,
        color: isSelected ? token.color.primary : adaptive.grey500,
        transition: `color ${TRANSITION.quick}`,
      }}
    >
      {children}
      {redBean ? (
        <span
          aria-label="새 항목"
          style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: SdsColors.red500 }}
        />
      ) : null}
    </button>
  );
}

export const Tab = Object.assign(TabRoot, { Item: TabItem });

export default Tab;
