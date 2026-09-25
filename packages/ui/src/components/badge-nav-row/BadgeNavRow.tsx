/**
 * BadgeNavRow — a navigable row led by a badge.
 *
 * A `Badge` for the category, a label, and a trailing caret. Rendered as a
 * button so it is reachable by keyboard, which a tappable div is not.
 *
 * Usage:
 *   <BadgeNavRow badgeColor="blue" badgeLabel="공지" onClick={open}>
 *     학사일정 안내
 *   </BadgeNavRow>
 */
import React, { useState, type ReactNode } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { mergeStyles, type Style } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';
import { CaretRightIcon } from '../../internal/icons';
import { Badge, type BadgeColor, type BadgeVariant } from '../badge';

export interface BadgeNavRowProps {
  children: ReactNode;
  badgeLabel: string;
  /** @default 'elephant' */
  badgeColor?: BadgeColor;
  /** @default 'weak' */
  badgeVariant?: BadgeVariant;
  right?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: Style;
}

export default function BadgeNavRow({
  children,
  badgeLabel,
  badgeColor = 'elephant',
  badgeVariant = 'weak',
  right,
  onClick,
  disabled = false,
  style,
}: BadgeNavRowProps) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  const [pressed, setPressed] = useState(false);
  const typo = typography.st10;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={mergeStyles(
        {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '14px 4px',
          border: 'none',
          background: pressed ? adaptive.grey50 : 'transparent',
          transition: `background-color ${TRANSITION.rapid}`,
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.38 : 1,
          textAlign: 'left',
        },
        style,
      )}
    >
      <Badge color={badgeColor} variant={badgeVariant} size="small">
        {badgeLabel}
      </Badge>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: FONT_FAMILY,
          fontSize: typo.fontSize,
          lineHeight: `${typo.lineHeight}px`,
          fontWeight: fontWeightMap.medium,
          color: adaptive.grey900,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
      {right ?? <CaretRightIcon size={18} color={adaptive.grey400} />}
    </button>
  );
}

export { BadgeNavRow };
