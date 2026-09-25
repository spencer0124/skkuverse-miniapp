/**
 * BottomCTA — call-to-action anchored to the bottom of the page.
 *
 * Built to the @toss/tds-mobile v2 contract, where v1's TypeA / TypeB became
 * `.Single` / `.Double`, and `fixed` decides whether it pins to the viewport.
 * `FixedBottomCTA` is documented upstream as literally `BottomCTA` with
 * `fixed={true}`, so that is exactly how it is defined here.
 *
 * The bottom inset is `max(16px, env(safe-area-inset-bottom))` rather than a
 * measured value from `useSafeAreaInsets`. It needs `viewport-fit=cover` on the
 * viewport meta tag, which the web view's index.html already sets.
 *
 * Usage:
 *   <FixedBottomCTA onClick={submit}>보내기</FixedBottomCTA>
 *   <BottomCTA.Double leftButton={<Button …/>} rightButton={<Button …/>} />
 */
import React, { type ComponentProps, type ReactNode } from 'react';
import { SdsColors } from '@skkuverse/tokens';
import { mergeStyles, toBoxShadow, type Style } from '../../internal/style';
import { Button, type ButtonProps } from '../button';

export interface BottomCTABaseProps {
  /** Pins to the viewport bottom. @default false */
  fixed?: boolean;
  style?: Style;
}

function Shell({ fixed = false, style, children }: BottomCTABaseProps & { children: ReactNode }) {
  return (
    <div
      style={mergeStyles(
        {
          position: fixed ? 'fixed' : 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 900,
          boxSizing: 'border-box',
          backgroundColor: SdsColors.background,
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 12,
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          boxShadow: toBoxShadow('#000000', 0, -2, 6, 0.06),
        },
        style,
      )}
    >
      {children}
    </div>
  );
}

// ── Single ──

export interface BottomCTASingleProps extends BottomCTABaseProps, Omit<ButtonProps, 'display' | 'style'> {}

function BottomCTASingle({ fixed, style, ...buttonProps }: BottomCTASingleProps) {
  return (
    <Shell fixed={fixed} style={style}>
      <Button display="block" size="xlarge" {...buttonProps} style={{ width: '100%' }} />
    </Shell>
  );
}

// ── Double ──

export interface BottomCTADoubleProps extends BottomCTABaseProps {
  leftButton: ReactNode;
  rightButton: ReactNode;
}

function BottomCTADouble({ leftButton, rightButton, fixed, style }: BottomCTADoubleProps) {
  return (
    <Shell fixed={fixed} style={style}>
      {/* The confirming action is wider, so the pair is not a coin flip. */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>{leftButton}</div>
        <div style={{ flex: 2 }}>{rightButton}</div>
      </div>
    </Shell>
  );
}

// ── Free-form ──

export interface BottomCTAProps extends BottomCTABaseProps {
  children: ReactNode;
}

function BottomCTARoot({ children, fixed, style }: BottomCTAProps) {
  return <Shell fixed={fixed} style={style}>{children}</Shell>;
}

export const BottomCTA = Object.assign(BottomCTARoot, {
  Single: BottomCTASingle,
  Double: BottomCTADouble,
});

/** `BottomCTA` with `fixed` already true — the upstream definition. */
export function FixedBottomCTA(props: Omit<ComponentProps<typeof BottomCTASingle>, 'fixed'>) {
  return <BottomCTASingle fixed {...props} />;
}

FixedBottomCTA.Double = function FixedBottomCTADouble(
  props: Omit<BottomCTADoubleProps, 'fixed'>,
) {
  return <BottomCTADouble fixed {...props} />;
};

export default BottomCTA;
