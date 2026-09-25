/**
 * Skeleton — loading placeholder.
 *
 * Built to the @toss/tds-mobile v2 contract's composable half: `custom` takes a
 * list of module names and `repeatLastItemCount` repeats the final one.
 *
 * The named `pattern` presets are the ones this project has a use for —
 * `listOnly`, `listWithIconOnly`, `topList`, `topListWithIcon` and `cardOnly`.
 * Upstream also defines `amountTopList`, `amountTopListWithIcon`,
 * `subtitleList` and `subtitleListWithIcon`; those are not built. `custom`
 * expresses any of them, so the gap is a shorthand rather than a capability.
 *
 * Usage:
 *   <Skeleton pattern="topListWithIcon" repeatLastItemCount={4} />
 *   <Skeleton custom={['title', 'spacer(16)', 'list', 'list']} />
 */
import React from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { mergeStyles, type Style } from '../../internal/style';
import { ensureKeyframes } from '../../internal/keyframes';

export type SkeletonModule = 'list' | 'title' | 'subtitle' | 'card' | 'listWithIcon' | `spacer(${number})`;
export type SkeletonPattern = 'topList' | 'topListWithIcon' | 'listOnly' | 'listWithIconOnly' | 'cardOnly';
export type SkeletonBackground = 'white' | 'grey' | 'greyOpacity100';

export interface SkeletonProps {
  height?: string | number;
  /** @default 'topList' */
  pattern?: SkeletonPattern;
  custom?: SkeletonModule[];
  /** `'infinite'` repeats the last module 30 times. @default 3 */
  repeatLastItemCount?: number | 'infinite';
  /** @default 'show' */
  play?: 'show' | 'hide';
  /** @default 'grey' */
  background?: SkeletonBackground;
  style?: Style;
}

const patterns: Record<SkeletonPattern, SkeletonModule[]> = {
  topList: ['title', 'spacer(16)', 'list'],
  topListWithIcon: ['title', 'spacer(16)', 'listWithIcon'],
  listOnly: ['list'],
  listWithIconOnly: ['listWithIcon'],
  cardOnly: ['card'],
};

function Bar({ width, height, radius, color }: { width: string | number; height: number; radius: number; color: string }) {
  return (
    <span
      style={{
        display: 'block',
        width,
        height,
        borderRadius: radius,
        // A moving highlight rather than a pulsing block: it reads as
        // "loading" instead of "broken".
        background: `linear-gradient(90deg, ${color} 25%, rgba(255,255,255,0.55) 50%, ${color} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'sds-skeleton-shimmer 1.4s linear infinite',
      }}
    />
  );
}

export default function Skeleton({
  height,
  pattern = 'topList',
  custom,
  repeatLastItemCount = 3,
  play = 'show',
  background = 'grey',
  style,
}: SkeletonProps) {
  ensureKeyframes();
  const adaptive = useAdaptive();

  if (play === 'hide') return null;

  const color =
    background === 'white' ? SdsColors.background
      : background === 'greyOpacity100' ? SdsColors.greyOpacity200
      : adaptive.grey200;

  const base = custom ?? patterns[pattern];
  const repeat = repeatLastItemCount === 'infinite' ? 30 : Math.max(1, repeatLastItemCount);
  const last = base[base.length - 1];
  const modules: SkeletonModule[] = last ? [...base, ...Array(repeat - 1).fill(last)] : base;

  return (
    <div
      aria-hidden
      style={mergeStyles({ display: 'flex', flexDirection: 'column', gap: 12, height }, style)}
    >
      {modules.map((m, i) => {
        const spacer = /^spacer\((\d+)\)$/.exec(m);
        if (spacer) return <span key={i} style={{ display: 'block', height: Number(spacer[1]) }} />;
        if (m === 'title') return <Bar key={i} width="45%" height={22} radius={6} color={color} />;
        if (m === 'subtitle') return <Bar key={i} width="30%" height={16} radius={6} color={color} />;
        if (m === 'card') return <Bar key={i} width="100%" height={120} radius={14} color={color} />;
        if (m === 'listWithIcon') {
          return (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Bar width={40} height={40} radius={20} color={color} />
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Bar width="60%" height={16} radius={6} color={color} />
                <Bar width="40%" height={14} radius={6} color={color} />
              </span>
            </span>
          );
        }
        return <Bar key={i} width="100%" height={16} radius={6} color={color} />;
      })}
    </div>
  );
}

export { Skeleton };
