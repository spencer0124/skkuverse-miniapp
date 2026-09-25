/**
 * AccordionList — expand/collapse rows.
 *
 * Built on `<details>` / `<summary>`, so open state, keyboard operation and the
 * announced expanded/collapsed state come from the browser. The React Native
 * original animated a measured height with Reanimated; here the panel animates
 * on `grid-template-rows: 0fr → 1fr`, which transitions to content height
 * without measuring anything.
 *
 * Usage:
 *   <AccordionList>
 *     <AccordionList.Item title="배송은 얼마나 걸리나요?">2~3일 걸려요.</AccordionList.Item>
 *   </AccordionList>
 */
import React, { useState, type ReactNode } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { mergeStyles, HAIRLINE, type Style } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';
import { CaretDownIcon } from '../../internal/icons';

export interface AccordionListProps {
  children: ReactNode;
  style?: Style;
}

function AccordionListRoot({ children, style }: AccordionListProps) {
  return <div style={mergeStyles({ display: 'flex', flexDirection: 'column' }, style)}>{children}</div>;
}

export interface AccordionListItemProps {
  title: ReactNode;
  children: ReactNode;
  /** @default false */
  defaultOpen?: boolean;
  disabled?: boolean;
}

function AccordionListItem({ title, children, defaultOpen = false, disabled = false }: AccordionListItemProps) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      style={{ borderBottom: `${HAIRLINE}px solid ${adaptive.grey200}` }}
    >
      <summary
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '18px 4px',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.38 : 1,
          // Removes the default disclosure triangle, which would sit beside the
          // caret this draws itself.
          listStyle: 'none',
          fontFamily: FONT_FAMILY,
          fontSize: typography.t5.fontSize,
          lineHeight: `${typography.t5.lineHeight}px`,
          fontWeight: fontWeightMap.semiBold,
          color: adaptive.grey900,
        }}
      >
        {title}
        <CaretDownIcon
          size={20}
          color={adaptive.grey500}
          style={{ flexShrink: 0, transform: `rotate(${open ? 180 : 0}deg)`, transition: `transform ${TRANSITION.quick}` }}
        />
      </summary>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: `grid-template-rows ${TRANSITION.quick}`,
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              paddingBottom: 18,
              fontFamily: FONT_FAMILY,
              fontSize: typography.t6.fontSize,
              lineHeight: `${typography.t6.lineHeight}px`,
              color: adaptive.grey700,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </details>
  );
}

export const AccordionList = Object.assign(AccordionListRoot, { Item: AccordionListItem });

export default AccordionList;
