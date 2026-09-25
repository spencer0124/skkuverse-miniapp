/**
 * ListHeader — section header above a list.
 *
 * Built to the @toss/tds-mobile v2 contract: a `title` node, an optional
 * `description` that can sit above or below it, and an optional `right`.
 * `titleWidthRatio` splits the row when both title and right are present.
 *
 * Usage:
 *   <ListHeader
 *     title={<ListHeader.TitleParagraph typography="t4" fontWeight="bold">알림</ListHeader.TitleParagraph>}
 *     right={<ListHeader.RightArrow typography="t6" onClick={openAll}>전체</ListHeader.RightArrow>}
 *   />
 */
import React, { type ReactNode } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap, type TypographyKeys } from '../../foundation/typography';
import { mergeStyles, type Style } from '../../internal/style';
import { CaretRightIcon } from '../../internal/icons';

export interface ListHeaderProps {
  title: ReactNode;
  /** @default 0.66 */
  titleWidthRatio?: number;
  description?: ReactNode;
  /** @default 'top' */
  descriptionPosition?: 'top' | 'bottom';
  right?: ReactNode;
  /** @default 'center' */
  rightAlignment?: 'center' | 'bottom';
  style?: Style;
}

function ListHeaderRoot({
  title,
  titleWidthRatio = 0.66,
  description,
  descriptionPosition = 'top',
  right,
  rightAlignment = 'center',
  style,
}: ListHeaderProps) {
  return (
    <div
      style={mergeStyles(
        {
          display: 'flex',
          alignItems: rightAlignment === 'bottom' ? 'flex-end' : 'center',
          gap: 12,
          paddingTop: 20,
          paddingBottom: 12,
        },
        style,
      )}
    >
      <div style={{ flex: right ? titleWidthRatio : 1, minWidth: 0 }}>
        {descriptionPosition === 'top' ? description : null}
        {title}
        {descriptionPosition === 'bottom' ? description : null}
      </div>
      {right ? (
        <div style={{ flex: 1 - titleWidthRatio, display: 'flex', justifyContent: 'flex-end', minWidth: 0 }}>
          {right}
        </div>
      ) : null}
    </div>
  );
}

// ── Compounds ──

type Weight = 'bold' | 'medium' | 'regular';

const weightValue: Record<Weight, string> = {
  bold: fontWeightMap.bold,
  medium: fontWeightMap.medium,
  regular: fontWeightMap.regular,
};

export interface ListHeaderTitleParagraphProps {
  children: ReactNode;
  typography: Extract<TypographyKeys, 't7' | 't5' | 't4'>;
  fontWeight: Weight;
  color?: string;
}

function TitleParagraph({ children, typography, fontWeight, color }: ListHeaderTitleParagraphProps) {
  const adaptive = useAdaptive();
  const { typography: theme } = useTypographyTheme();
  const typo = theme[typography];
  return (
    <p style={{
      margin: 0,
      fontFamily: FONT_FAMILY,
      fontSize: typo.fontSize,
      lineHeight: `${typo.lineHeight}px`,
      fontWeight: weightValue[fontWeight],
      color: color ?? adaptive.grey800,
    }}>
      {children}
    </p>
  );
}

function DescriptionParagraph({ children }: { children: ReactNode }) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  return (
    <p style={{
      margin: 0,
      fontFamily: FONT_FAMILY,
      fontSize: typography.t7.fontSize,
      lineHeight: `${typography.t7.lineHeight}px`,
      color: adaptive.grey500,
    }}>
      {children}
    </p>
  );
}

export interface ListHeaderRightTextProps {
  children: ReactNode;
  typography: Extract<TypographyKeys, 't7' | 't6'>;
  color?: string;
}

function RightText({ children, typography, color }: ListHeaderRightTextProps) {
  const adaptive = useAdaptive();
  const { typography: theme } = useTypographyTheme();
  const typo = theme[typography];
  return (
    <span style={{
      fontFamily: FONT_FAMILY,
      fontSize: typo.fontSize,
      lineHeight: `${typo.lineHeight}px`,
      color: color ?? adaptive.grey700,
    }}>
      {children}
    </span>
  );
}

export interface ListHeaderRightArrowProps {
  children?: ReactNode;
  typography: Extract<TypographyKeys, 't7' | 't6'>;
  color?: string;
  textColor?: string;
  onClick?: () => void;
}

function RightArrow({ children, typography, color, textColor, onClick }: ListHeaderRightArrowProps) {
  const adaptive = useAdaptive();
  const { typography: theme } = useTypographyTheme();
  const typo = theme[typography];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: FONT_FAMILY,
        fontSize: typo.fontSize,
        lineHeight: `${typo.lineHeight}px`,
        color: textColor ?? adaptive.grey700,
      }}
    >
      {children}
      <CaretRightIcon size={16} color={color ?? adaptive.grey400} />
    </button>
  );
}

export const ListHeader = Object.assign(ListHeaderRoot, {
  TitleParagraph,
  DescriptionParagraph,
  RightText,
  RightArrow,
});

export default ListHeader;
