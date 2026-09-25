/**
 * ListFooter — action row under a list.
 *
 * `Title` is the action label and reads as a link rather than body text, since
 * the whole row is usually tappable.
 *
 * Usage:
 *   <ListFooter onClick={loadMore} title={<ListFooter.Title>더 보기</ListFooter.Title>} />
 */
import React, { type ReactNode } from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { mergeStyles, HAIRLINE, type Style } from '../../internal/style';

export type ListFooterBorderType = 'full' | 'none';

export interface ListFooterProps {
  title: ReactNode;
  right?: ReactNode;
  /** @default 'full' */
  borderType?: ListFooterBorderType;
  onClick?: () => void;
  style?: Style;
}

function ListFooterRoot({ title, right, borderType = 'full', onClick, style }: ListFooterProps) {
  const adaptive = useAdaptive();
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
      style={mergeStyles(
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 14,
          paddingBottom: 14,
          cursor: onClick ? 'pointer' : 'default',
          borderTop: borderType === 'full' ? `${HAIRLINE}px solid ${adaptive.grey200}` : 'none',
        },
        style,
      )}
    >
      {title}
      {right}
    </div>
  );
}

function ListFooterTitle({ children, color }: { children: ReactNode; color?: string }) {
  const { typography } = useTypographyTheme();
  return (
    <span style={{
      fontFamily: FONT_FAMILY,
      fontSize: typography.t6.fontSize,
      lineHeight: `${typography.t6.lineHeight}px`,
      fontWeight: fontWeightMap.medium,
      color: color ?? SdsColors.blue500,
    }}>
      {children}
    </span>
  );
}

export const ListFooter = Object.assign(ListFooterRoot, { Title: ListFooterTitle });

export default ListFooter;
