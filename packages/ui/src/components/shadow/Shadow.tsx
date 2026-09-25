/**
 * Shadow — shadow presets and the useShadow hook.
 *
 * Converted from skkuverse-app `packages/sds/src/components/shadow/Shadow.tsx`.
 * React Native splits a shadow across four iOS properties plus an Android
 * `elevation`; CSS states the whole thing in one `boxShadow`, so the platform
 * branch disappears.
 *
 * Usage:
 *   <Shadow shadow="medium"><div>...</div></Shadow>
 *   const style = useShadow('strong');
 */
import React, { type CSSProperties, type ReactNode } from 'react';
import { toBoxShadow, mergeStyles, type Style } from '../../internal/style';
import { useColorScheme } from '../../internal/useColorScheme';

// ── Shadow Config ──

export interface ShadowConfig {
  color?: string;
  /** Light mode shadow color (takes precedence over color in light mode) */
  lightColor?: string;
  /** Dark mode shadow color (takes precedence over color in dark mode) */
  darkColor?: string;
  radius: number;
  opacity: number;
  offset: { x: number; y: number };
}

export type ShadowPreset = 'weak' | 'medium' | 'strong';

const shadowPresets: Record<ShadowPreset, ShadowConfig> = {
  weak: { color: '#000000', radius: 4, opacity: 0.05, offset: { x: 0, y: 1 } },
  medium: { color: '#000000', radius: 10, opacity: 0.1, offset: { x: 0, y: 2 } },
  strong: { color: '#000000', radius: 20, opacity: 0.15, offset: { x: 0, y: 4 } },
};

// ── useShadow ──

function resolveColor(config: ShadowConfig, isDark: boolean): string {
  if (isDark && config.darkColor) return config.darkColor;
  if (!isDark && config.lightColor) return config.lightColor;
  return config.color ?? '#000000';
}

export function useShadow(shadow: ShadowPreset | ShadowConfig): CSSProperties {
  const isDark = useColorScheme() === 'dark';
  const config = typeof shadow === 'string' ? shadowPresets[shadow] : shadow;
  const color = resolveColor(config, isDark);

  return {
    boxShadow: toBoxShadow(
      color,
      config.offset.x,
      config.offset.y,
      config.radius,
      config.opacity,
    ),
  };
}

// ── Shadow Component ──

export interface ShadowProps {
  shadow?: ShadowPreset | ShadowConfig;
  children: ReactNode;
  style?: Style;
}

export default function Shadow({
  shadow = 'medium',
  children,
  style,
}: ShadowProps) {
  const shadowStyle = useShadow(shadow);

  return (
    <div style={mergeStyles({ backgroundColor: 'transparent' }, shadowStyle, style)}>
      {children}
    </div>
  );
}

export { Shadow };
