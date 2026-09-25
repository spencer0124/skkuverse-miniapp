import type { ReactNode } from 'react';
import { Button, type ButtonProps } from '@skkuverse/ui';
import { openMapPlace } from '../sdk/actions';
import { useCanOpenMap } from './hooks';

export interface MapButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  /** `[<kind>:]<placeId>`, as `openMapPlace` takes it. */
  place: string;
  children: ReactNode;
}

/**
 * Opens the app's campus map on `place`, closing this page. Renders nothing
 * unless the host app says it can: in a plain browser there is no map to open,
 * and a button that does nothing is worse than none.
 *
 * Defaults to a full-width weak primary button. Every `Button` prop overrides
 * them; for a different element altogether, use `useCanOpenMap` and
 * `openMapPlace` directly.
 */
export function MapButton({ place, children, ...rest }: MapButtonProps) {
  const canOpen = useCanOpenMap();
  if (!canOpen) return null;
  return (
    // `block` at full width, as BottomCTA does it, rather than `display="full"`:
    // that one squares the corners off for an edge-to-edge bar, and this sits
    // inside the page's margins under a rounded CTA, so it takes the same 16.
    <Button
      color="primary"
      variant="weak"
      size="large"
      display="block"
      style={{ width: '100%' }}
      containerStyle={{ borderRadius: 16 }}
      {...rest}
      onClick={() => openMapPlace(place)}
    >
      {children}
    </Button>
  );
}
