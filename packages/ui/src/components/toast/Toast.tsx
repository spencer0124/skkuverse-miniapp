/**
 * Toast — transient message, optionally with one action.
 *
 * Built to the @toss/tds-mobile v2 contract, including its duration rule: a
 * toast with a button stays 5000ms, one without stays 3000ms, because a button
 * the user cannot reach in time is worse than none.
 *
 * `icon` and `lottie` are mutually exclusive upstream, and the props type says so
 * rather than leaving it to a runtime check: passing both is a compile error.
 * The Lottie renderer loads on demand, so a toast without an animation costs
 * nothing.
 *
 * Usage:
 *   <Toast message="보냈어요" icon="check" />
 *   <Toast message="처리 중이에요" lottie="https://…/loading.json" />
 */
import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SdsColors } from '@skkuverse/tokens';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { TRANSITION } from '../../internal/keyframes';
import { CheckCircleIcon, InfoIcon, WarningCircleIcon, WarningIcon } from '../../internal/icons';
import { LottiePlayer } from '../../internal/LottiePlayer';

export type ToastPosition = 'top' | 'bottom';
export type ToastIcon = 'check' | 'warning' | 'error' | 'info';

export interface ToastButton {
  text: string;
  onClick: () => void;
}

interface ToastBaseProps {
  message: ReactNode;
  /** @default 'bottom' */
  type?: ToastPosition;
  /** Distance from the edge. Overrides the default inset. */
  gap?: number;
  button?: ToastButton;
  /** @default 5000 with a button, 3000 without */
  duration?: number;
  open?: boolean;
  onClose?: () => void;
  portalContainer?: HTMLElement;
}

/** Upstream forbids using both; `never` makes that a compile error rather than a surprise. */
type ToastDecoration =
  | { icon?: ToastIcon; lottie?: never }
  | { lottie?: string; icon?: never };

export type ToastProps = ToastBaseProps & ToastDecoration;

const iconFor: Record<ToastIcon, { Glyph: typeof CheckCircleIcon; color: string }> = {
  check: { Glyph: CheckCircleIcon, color: SdsColors.green500 },
  warning: { Glyph: WarningIcon, color: SdsColors.yellow500 },
  error: { Glyph: WarningCircleIcon, color: SdsColors.red500 },
  info: { Glyph: InfoIcon, color: SdsColors.blue400 },
};

export function Toast({
  message,
  type = 'bottom',
  gap,
  icon,
  lottie,
  button,
  duration,
  open = true,
  onClose,
  portalContainer,
}: ToastProps) {
  const { typography } = useTypographyTheme();
  const [visible, setVisible] = useState(open);
  const ms = duration ?? (button ? 5000 : 3000);

  useEffect(() => {
    setVisible(open);
    if (!open) return;
    const id = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, ms);
    return () => clearTimeout(id);
  }, [open, ms, onClose]);

  const handleAction = useCallback(() => {
    button?.onClick();
    setVisible(false);
    onClose?.();
  }, [button, onClose]);

  if (typeof document === 'undefined') return null;

  const typo = typography.t6;
  const inset = gap ?? 24;
  const entry = type === 'top' ? -12 : 12;
  const chosen = icon ? iconFor[icon] : undefined;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        zIndex: 1100,
        ...(type === 'top' ? { top: inset } : { bottom: `calc(${inset}px + env(safe-area-inset-bottom))` }),
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 16px',
        borderRadius: 14,
        backgroundColor: SdsColors.greyOpacity800,
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : entry}px)`,
        transition: `opacity ${TRANSITION.quick}, transform ${TRANSITION.quick}`,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {lottie ? <LottiePlayer src={lottie} size={24} /> : null}
      {chosen ? <chosen.Glyph size={20} weight="fill" color={chosen.color} aria-hidden /> : null}
      <span
        style={{
          flex: 1,
          fontFamily: FONT_FAMILY,
          fontSize: typo.fontSize,
          lineHeight: `${typo.lineHeight}px`,
          fontWeight: fontWeightMap.medium,
          color: SdsColors.background,
        }}
      >
        {message}
      </span>
      {button ? (
        <button
          type="button"
          onClick={handleAction}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: FONT_FAMILY,
            fontSize: typo.fontSize,
            fontWeight: fontWeightMap.bold,
            color: SdsColors.blue200,
          }}
        >
          {button.text}
        </button>
      ) : null}
    </div>,
    portalContainer ?? document.body,
  );
}

export default Toast;
