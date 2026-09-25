/**
 * StepperRow — one numbered step in a vertical sequence.
 *
 * The connector line is drawn by the row, not between rows, so a list of steps
 * is a plain list with no separator elements to keep in sync. `isLast` stops
 * the line rather than the parent having to special-case the final child.
 *
 * Usage:
 *   <StepperRow step={1} title="예매 링크로 들어가기" />
 *   <StepperRow step={2} title="요금 입금하기" isLast />
 */
import React, { type ReactNode } from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { mergeStyles, type Style } from '../../internal/style';
import { CaretRightIcon } from '../../internal/icons';

export interface StepperRowProps {
  /** The number in the circle. */
  step: number;
  title: ReactNode;
  description?: ReactNode;
  /** Stops the connector line below this row. @default false */
  isLast?: boolean;
  /** Marks the step as finished. */
  done?: boolean;
  right?: ReactNode;
  onClick?: () => void;
  style?: Style;
}

const CIRCLE = 32;

export default function StepperRow({
  step,
  title,
  description,
  isLast = false,
  done = false,
  right,
  onClick,
  style,
}: StepperRowProps) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();

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
        { display: 'flex', gap: 16, cursor: onClick ? 'pointer' : 'default' },
        style,
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: CIRCLE }}>
        <span
          style={{
            width: CIRCLE,
            height: CIRCLE,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            backgroundColor: done ? adaptive.grey300 : adaptive.grey900,
            color: SdsColors.background,
            fontFamily: FONT_FAMILY,
            fontSize: typography.st11.fontSize,
            fontWeight: fontWeightMap.bold,
          }}
        >
          {step}
        </span>
        {!isLast ? <span style={{ flex: 1, width: 2, backgroundColor: adaptive.grey200 }} /> : null}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 24 }}>
        <p style={{
          margin: 0,
          fontFamily: FONT_FAMILY,
          fontSize: typography.st10.fontSize,
          lineHeight: `${typography.st10.lineHeight}px`,
          fontWeight: fontWeightMap.semiBold,
          color: adaptive.grey900,
        }}>
          {title}
        </p>
        {description != null && (
          <p style={{
            margin: '4px 0 0',
            fontFamily: FONT_FAMILY,
            fontSize: typography.st11.fontSize,
            lineHeight: `${typography.st11.lineHeight}px`,
            color: adaptive.grey600,
          }}>
            {description}
          </p>
        )}
      </div>

      {right ?? (onClick ? <CaretRightIcon size={20} color={adaptive.grey400} /> : null)}
    </div>
  );
}

export { StepperRow };
