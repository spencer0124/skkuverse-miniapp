/**
 * Navbar — 56px top bar with back/close, a title, and a right slot.
 *
 * Renders as `<header>` with the title as `<h1>`, so the page has a real
 * landmark and heading rather than a styled row.
 *
 * Usage:
 *   <Navbar left={<Navbar.BackButton onClick={goBack} />}
 *           title={<Navbar.Title>알림 보내기</Navbar.Title>} />
 */
import React, { type ReactNode } from 'react';
import { useAdaptive } from '../../core/AdaptiveColorProvider';
import { useTypographyTheme } from '../../core/TypographyProvider';
import { FONT_FAMILY, fontWeightMap } from '../../foundation/typography';
import { mergeStyles, type Style } from '../../internal/style';
import { CaretLeftIcon, XIcon } from '../../internal/icons';
import { IconButton } from '../icon-button';

export const NAVBAR_HEIGHT = 56;

export interface NavbarProps {
  left?: ReactNode;
  title?: ReactNode;
  right?: ReactNode;
  /** Pins to the top of the viewport. @default false */
  fixed?: boolean;
  style?: Style;
}

function NavbarRoot({ left, title, right, fixed = false, style }: NavbarProps) {
  const adaptive = useAdaptive();
  return (
    <header
      style={mergeStyles(
        {
          position: fixed ? 'sticky' : 'relative',
          top: 0,
          zIndex: 800,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: NAVBAR_HEIGHT,
          paddingLeft: 8,
          paddingRight: 8,
          backgroundColor: adaptive.background,
        },
        style,
      )}
    >
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 44 }}>{left}</div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 44 }}>{right}</div>
    </header>
  );
}

function NavbarTitle({ children }: { children: ReactNode }) {
  const adaptive = useAdaptive();
  const { typography } = useTypographyTheme();
  return (
    <h1 style={{
      margin: 0,
      fontFamily: FONT_FAMILY,
      fontSize: typography.st10.fontSize,
      lineHeight: `${typography.st10.lineHeight}px`,
      fontWeight: fontWeightMap.semiBold,
      color: adaptive.grey900,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </h1>
  );
}

function NavbarBackButton({ onClick }: { onClick?: () => void }) {
  const adaptive = useAdaptive();
  return (
    <IconButton
      aria-label="뒤로 가기"
      onClick={onClick}
      icon={<CaretLeftIcon size={24} color={adaptive.grey900} />}
    />
  );
}

function NavbarCloseButton({ onClick }: { onClick?: () => void }) {
  const adaptive = useAdaptive();
  return (
    <IconButton
      aria-label="닫기"
      onClick={onClick}
      icon={<XIcon size={24} color={adaptive.grey900} />}
    />
  );
}

export const Navbar = Object.assign(NavbarRoot, {
  Title: NavbarTitle,
  BackButton: NavbarBackButton,
  CloseButton: NavbarCloseButton,
});

export default Navbar;
