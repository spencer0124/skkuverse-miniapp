/**
 * Rating — star rating, readable or editable.
 *
 * Editable ratings render real radio inputs behind the stars, so the control is
 * reachable by keyboard and announced as a group. A read-only rating is not a
 * control at all and renders as an image with a text alternative, rather than
 * five stars a screen reader would read one at a time.
 *
 * Usage:
 *   <Rating value={4} />
 *   <Rating value={score} editable onChange={setScore} />
 */
import React, { useId } from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { useControlled } from '../../utils/useControlled';
import { mergeStyles, type Style } from '../../internal/style';
import { StarIcon } from '../../internal/icons';

export type RatingVariant = 'full' | 'compact' | 'iconOnly';

export interface RatingProps {
  value?: number;
  defaultValue?: number;
  /** @default 5 */
  max?: number;
  /** @default 20 */
  size?: number;
  /** @default 'full' */
  variant?: RatingVariant;
  /** @default false */
  editable?: boolean;
  onChange?: (value: number) => void;
  style?: Style;
}

export default function Rating({
  value,
  defaultValue,
  max = 5,
  size = 20,
  variant = 'full',
  editable = false,
  onChange,
  style,
}: RatingProps) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  const name = useId();
  const [current, setCurrent] = useControlled({
    controlledValue: value,
    defaultValue: defaultValue ?? 0,
  });

  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const typo = typography.t6;
  const label = `${current} / ${max}`;

  const star = (n: number) => (
    <StarIcon
      size={size}
      weight={n <= current ? 'fill' : 'regular'}
      color={n <= current ? SdsColors.yellow500 : adaptive.grey300}
    />
  );

  return (
    <div
      style={mergeStyles({ display: 'inline-flex', alignItems: 'center', gap: 6 }, style)}
      {...(editable ? { role: 'radiogroup', 'aria-label': '별점' } : { role: 'img', 'aria-label': `별점 ${label}` })}
    >
      <span style={{ display: 'inline-flex', gap: 2 }} aria-hidden={!editable}>
        {stars.map((n) =>
          editable ? (
            <label key={n} style={{ display: 'inline-flex', cursor: 'pointer' }}>
              <input
                type="radio"
                name={name}
                value={n}
                checked={current === n}
                onChange={() => { setCurrent(n); onChange?.(n); }}
                aria-label={`${n}점`}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
              {star(n)}
            </label>
          ) : (
            <span key={n} style={{ display: 'inline-flex' }}>{star(n)}</span>
          ),
        )}
      </span>

      {variant !== 'iconOnly' && (
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: typo.fontSize,
            lineHeight: `${typo.lineHeight}px`,
            fontWeight: fontWeightMap.medium,
            color: adaptive.grey700,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {variant === 'compact' ? current : label}
        </span>
      )}
    </div>
  );
}

export { Rating };
