/**
 * BottomSheet — panel that rises from the bottom edge.
 *
 * A DOM implementation. The React Native original wrapped
 * `@gorhom/bottom-sheet`, which exists to solve problems the browser does not
 * have: it reimplements scrolling, gesture handling and a backdrop that the
 * platform already provides. Here the sheet is a positioned element with a
 * transform transition, and the content scrolls because it is a scroll
 * container.
 *
 * Usage:
 *   <BottomSheet open={open} onClose={close}>
 *     <BottomSheet.Header>보낼 사람</BottomSheet.Header>
 *     …
 *     <BottomSheet.CTA onClick={submit}>보내기</BottomSheet.CTA>
 *   </BottomSheet>
 */
import React, { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { mergeStyles, type Style } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';
import { Button, type ButtonProps } from '../button';

const EXIT_MS = 250;

export interface BottomSheetProps {
  children: ReactNode;
  open?: boolean;
  onClose?: () => void;
  /** @default true */
  closeOnDimmerClick?: boolean;
  /** Shows the drag handle. @default true */
  hasHandle?: boolean;
  portalContainer?: HTMLElement;
  style?: Style;
}

function BottomSheetRoot({
  children,
  open = false,
  onClose,
  closeOnDimmerClick = true,
  hasHandle = true,
  portalContainer,
  style,
}: BottomSheetProps) {
  const adaptive = useAdaptive();
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) { setMounted(true); return; }
    if (!mounted) return;
    const id = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    // A sheet over a scrolling page lets the page scroll behind it, which reads
    // as the sheet being stuck.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        display: 'flex',
        alignItems: 'flex-end',
        backgroundColor: SdsColors.greyOpacity500,
        opacity: open ? 1 : 0,
        transition: `opacity ${TRANSITION.quick}`,
      }}
      onClick={() => { if (closeOnDimmerClick) onClose?.(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={mergeStyles(
          {
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: adaptive.layeredBackground,
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            transform: `translateY(${open ? '0' : '100%'})`,
            transition: `transform ${EXIT_MS}ms cubic-bezier(0.33, 1, 0.68, 1)`,
          },
          style,
        )}
      >
        {hasHandle ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 2 }}>
            <span style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: adaptive.grey300 }} />
          </div>
        ) : null}
        {children}
      </div>
    </div>,
    portalContainer ?? document.body,
  );
}

// ── Header ──

export interface BottomSheetHeaderProps {
  children: ReactNode;
  description?: ReactNode;
}

function BottomSheetHeader({ children, description }: BottomSheetHeaderProps) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  return (
    <div style={{ padding: '16px 24px 8px' }}>
      <h2
        style={{
          margin: 0,
          fontFamily: FONT_FAMILY,
          fontSize: typography.t3.fontSize,
          lineHeight: `${typography.t3.lineHeight}px`,
          fontWeight: fontWeightMap.bold,
          color: adaptive.grey900,
        }}
      >
        {children}
      </h2>
      {description != null && (
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: FONT_FAMILY,
            fontSize: typography.t6.fontSize,
            lineHeight: `${typography.t6.lineHeight}px`,
            color: adaptive.grey600,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

// ── CTA ──

function BottomSheetCTA(props: Omit<ButtonProps, 'display'>) {
  return (
    <div style={{ padding: '12px 20px 0' }}>
      <Button display="block" size="xlarge" {...props} style={{ width: '100%' }} />
    </div>
  );
}

function BottomSheetDoubleCTA({ leftButton, rightButton }: { leftButton: ReactNode; rightButton: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '12px 20px 0' }}>
      <div style={{ flex: 1 }}>{leftButton}</div>
      <div style={{ flex: 1 }}>{rightButton}</div>
    </div>
  );
}

export const BottomSheet = Object.assign(BottomSheetRoot, {
  Header: BottomSheetHeader,
  CTA: BottomSheetCTA,
  DoubleCTA: BottomSheetDoubleCTA,
});

export default BottomSheet;
