/**
 * ListRow — the list item.
 *
 * Built to the @toss/tds-mobile v2 contract: `left` / `contents` / `right`
 * slots, `withTouchEffect`, and `ListRow.Texts` for the text block.
 *
 * `Texts` takes upstream's `type` string, and rather than enumerating its two
 * dozen values this parses it: `Right?` decides alignment and the leading digit
 * decides how many lines render. That covers every value upstream defines,
 * including ones added later.
 *
 * What it does not reproduce: the trailing letter (`TypeA`…`TypeF`) selects a
 * different emphasis per line upstream, and this applies one scheme to all of
 * them — top prominent, lower lines muted. Getting the letters right needs the
 * per-variant table, which is not in the indexed docs. `List` and the
 * imperative `shine` / `blink` refs are also not built.
 *
 * Usage:
 *   <ListRow
 *     left={<ListRow.AssetIcon>{<BankIcon />}</ListRow.AssetIcon>}
 *     contents={<ListRow.Texts type="2RowTypeA" top="스꾸버스" bottom="방금" />}
 *     right={<Button size="small">열기</Button>}
 *     onClick={open}
 *   />
 */
import React, { useState, type ReactNode } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { mergeStyles, type Style } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';

export type ListRowVerticalPadding = 'none' | 'small' | 'medium' | 'large';

export interface ListRowProps {
  left?: ReactNode;
  contents?: ReactNode;
  right?: ReactNode;
  /** Applied automatically when `onClick` is set. */
  withTouchEffect?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** @default 'medium' */
  verticalPadding?: ListRowVerticalPadding;
  style?: Style;
}

const paddingY: Record<ListRowVerticalPadding, number> = {
  none: 0,
  small: 8,
  medium: 12,
  large: 16,
};

function ListRowRoot({
  left,
  contents,
  right,
  withTouchEffect,
  onClick,
  disabled = false,
  verticalPadding = 'medium',
  style,
}: ListRowProps) {
  const adaptive = useAdaptive();
  const [pressed, setPressed] = useState(false);
  const interactive = !disabled && (onClick != null || withTouchEffect === true);
  const touch = withTouchEffect ?? onClick != null;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!onClick || disabled) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
      onPointerDown={() => interactive && touch && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={mergeStyles(
        {
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          paddingTop: paddingY[verticalPadding],
          paddingBottom: paddingY[verticalPadding],
          cursor: onClick && !disabled ? 'pointer' : 'default',
          opacity: disabled ? 0.38 : 1,
          backgroundColor: pressed ? adaptive.grey50 : 'transparent',
          transition: `background-color ${TRANSITION.rapid}`,
        },
        style,
      )}
    >
      {left}
      <div style={{ flex: 1, minWidth: 0 }}>{contents}</div>
      {right}
    </div>
  );
}

// ── Texts ──

export interface ListRowTextsProps {
  /** e.g. `1RowTypeA`, `2RowTypeB`, `Right2RowTypeA`. */
  type: string;
  top?: ReactNode;
  middle?: ReactNode;
  bottom?: ReactNode;
  marginTop?: number;
}

const TYPE_RE = /^(Right)?(\d)Row/;

function ListRowTexts({ type, top, middle, bottom, marginTop }: ListRowTextsProps) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  const match = TYPE_RE.exec(type);
  const alignRight = match?.[1] === 'Right';
  const rows = Number(match?.[2] ?? 1);

  const line = (content: ReactNode, level: 'top' | 'middle' | 'bottom') => {
    if (content == null) return null;
    const typo = level === 'top' ? typography.st10 : typography.t7;
    return (
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: typo.fontSize,
          lineHeight: `${typo.lineHeight}px`,
          fontWeight: level === 'top' ? fontWeightMap.semiBold : fontWeightMap.regular,
          color: level === 'top' ? adaptive.grey900 : adaptive.grey600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {content}
      </span>
    );
  };

  return (
    <span
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignRight ? 'flex-end' : 'flex-start',
        marginTop,
        minWidth: 0,
      }}
    >
      {line(top, 'top')}
      {rows >= 3 ? line(middle, 'middle') : null}
      {rows >= 2 ? line(bottom, 'bottom') : null}
    </span>
  );
}

// ── AssetIcon ──

export interface ListRowAssetIconProps {
  children: ReactNode;
  /** @default 40 */
  size?: number;
  backgroundColor?: string;
}

function ListRowAssetIcon({ children, size = 40, backgroundColor }: ListRowAssetIconProps) {
  const adaptive = useAdaptive();
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: backgroundColor ?? adaptive.grey100,
      }}
    >
      {children}
    </span>
  );
}

export const ListRow = Object.assign(ListRowRoot, {
  Texts: ListRowTexts,
  AssetIcon: ListRowAssetIcon,
});

export default ListRow;
