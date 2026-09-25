/**
 * Dialog — Alert and Confirm.
 *
 * Built to the @toss/tds-mobile v2 contract, which is DOM-native: `open`,
 * `onClose`, `onEntered` / `onExited`, `closeOnDimmerClick`, `closeOnBackEvent`
 * and `portalContainer`. Nothing here needs a modal library.
 *
 * `onClose` is load-bearing rather than optional: upstream documents that a
 * dimmer click does nothing unless `onClose` is supplied, because the component
 * does not own its own visibility.
 *
 * Usage:
 *   <Dialog.Alert open={open} onClose={close}
 *     title={<Dialog.Title>보냈어요</Dialog.Title>}
 *     description={<Dialog.Description>확인해 주세요</Dialog.Description>}
 *     alertButton={<Dialog.AlertButton onClick={close}>확인</Dialog.AlertButton>} />
 */
import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SdsColors } from '@skkuverse/tokens';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap, type TypographyKeys } from '../../foundation/typography';
import { mergeStyles } from '../../internal/style';
import { TRANSITION } from '../../internal/keyframes';
import type { ParagraphFontWeight } from '../paragraph/Paragraph';

const weightValue: Record<ParagraphFontWeight, string> = {
  regular: fontWeightMap.regular,
  medium: fontWeightMap.medium,
  semibold: fontWeightMap.semiBold,
  bold: fontWeightMap.bold,
};

export interface DialogBaseProps {
  open?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  /** @default true */
  closeOnDimmerClick?: boolean;
  /** @default true */
  closeOnBackEvent?: boolean;
  onClose?: () => void;
  onEntered?: () => void;
  onExited?: () => void;
  /** @default document.body */
  portalContainer?: HTMLElement;
}

export interface AlertDialogProps extends DialogBaseProps {
  alertButton?: ReactNode;
}

export interface ConfirmDialogProps extends DialogBaseProps {
  cancelButton?: ReactNode;
  confirmButton?: ReactNode;
}

const EXIT_MS = 200;

function DialogShell({
  open = false,
  title,
  description,
  buttons,
  closeOnDimmerClick = true,
  closeOnBackEvent = true,
  onClose,
  onEntered,
  onExited,
  portalContainer,
}: DialogBaseProps & { buttons: ReactNode }) {
  const adaptive = useAdaptive();
  // Kept mounted through the exit transition so `onExited` can fire after it,
  // rather than the moment `open` flips.
  const [mounted, setMounted] = useState(open);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (open) {
      clearTimeout(timer.current);
      setMounted(true);
      const id = setTimeout(() => onEntered?.(), EXIT_MS);
      return () => clearTimeout(id);
    }
    if (!mounted) return;
    timer.current = setTimeout(() => {
      setMounted(false);
      onExited?.();
    }, EXIT_MS);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The browser back button, which upstream calls closeOnBackEvent. Pushing a
  // history entry on open means back pops it instead of leaving the page.
  useEffect(() => {
    if (!open || !closeOnBackEvent || typeof window === 'undefined') return;
    const onPop = () => onClose?.();
    window.history.pushState({ sdsDialog: true }, '');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [open, closeOnBackEvent, onClose]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleDimmer = useCallback(() => {
    if (closeOnDimmerClick) onClose?.();
  }, [closeOnDimmerClick, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: SdsColors.greyOpacity500,
        opacity: open ? 1 : 0,
        transition: `opacity ${TRANSITION.quick}`,
      }}
      onClick={handleDimmer}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 320,
          borderRadius: 20,
          padding: 24,
          backgroundColor: adaptive.layeredBackground,
          transform: `scale(${open ? 1 : 0.94})`,
          transition: `transform ${TRANSITION.quick}`,
        }}
      >
        {title}
        {description}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>{buttons}</div>
      </div>
    </div>,
    portalContainer ?? document.body,
  );
}

// ── Compound text parts ──

interface DialogTextProps {
  children: ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  color?: string;
  typography?: TypographyKeys;
  fontWeight?: ParagraphFontWeight;
}

function DialogTitle({ children, as = 'h3', color, typography = 't4', fontWeight = 'bold' }: DialogTextProps) {
  const adaptive = useAdaptive();
  const { typography: theme } = useTypographyTheme();
  const typo = theme[typography];
  const Tag = as as 'h3';
  return (
    <Tag style={mergeStyles({
      margin: 0,
      fontFamily: FONT_FAMILY,
      fontSize: typo.fontSize,
      lineHeight: `${typo.lineHeight}px`,
      fontWeight: weightValue[fontWeight],
      color: color ?? adaptive.grey800,
    })}>
      {children}
    </Tag>
  );
}

function DialogDescription({ children, as = 'p', color, typography = 't6', fontWeight = 'medium' }: DialogTextProps) {
  const adaptive = useAdaptive();
  const { typography: theme } = useTypographyTheme();
  const typo = theme[typography];
  const Tag = as as 'p';
  return (
    <Tag style={mergeStyles({
      margin: '8px 0 0',
      fontFamily: FONT_FAMILY,
      fontSize: typo.fontSize,
      lineHeight: `${typo.lineHeight}px`,
      fontWeight: weightValue[fontWeight],
      color: color ?? adaptive.grey600,
    })}>
      {children}
    </Tag>
  );
}

export interface DialogButtonProps {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  fontWeight?: ParagraphFontWeight;
}

function DialogButton({ children, onClick, color, fontWeight = 'bold' }: DialogButtonProps) {
  const { typography } = useTypographyTheme();
  const typo = typography.t5;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: '8px 12px',
        cursor: 'pointer',
        fontFamily: FONT_FAMILY,
        fontSize: typo.fontSize,
        lineHeight: `${typo.lineHeight}px`,
        fontWeight: weightValue[fontWeight],
        color: color ?? SdsColors.blue500,
      }}
    >
      {children}
    </button>
  );
}

// ── Public shapes ──

function AlertDialog({ alertButton, ...rest }: AlertDialogProps) {
  return <DialogShell {...rest} buttons={alertButton} />;
}

function ConfirmDialog({ cancelButton, confirmButton, ...rest }: ConfirmDialogProps) {
  return (
    <DialogShell
      {...rest}
      buttons={
        <>
          {cancelButton}
          {confirmButton}
        </>
      }
    />
  );
}

export const Dialog = {
  Alert: AlertDialog,
  Confirm: ConfirmDialog,
  Title: DialogTitle,
  Description: DialogDescription,
  /** The single button of an Alert. */
  AlertButton: DialogButton,
  /**
   * The left button of a Confirm. Labelled 닫기 rather than 취소 by convention:
   * "취소" reads as cancelling the user's work rather than dismissing the box.
   */
  CancelButton: DialogButton,
  ConfirmButton: DialogButton,
};

export default Dialog;
