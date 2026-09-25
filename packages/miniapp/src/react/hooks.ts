import { useEffect, useState } from 'react';
import type { Viewport } from '../protocol';
import { canOpenMap, canOpenMiniapp } from '../sdk/actions';
import { getCapabilities, type HostInfo } from '../sdk/capabilities';
import { getViewport, onViewportChange } from '../sdk/shell';
import { isInApp } from '../transport';
import { useMiniappRoot } from './MiniappRoot';

// The app injects `window.skkuverse` before the page's script runs, so whether
// the page is in the app, and what it grants, cannot change during a page's
// life. Each is read once, on mount. The viewport does change, and is followed.

export function useIsInApp(): boolean {
  useMiniappRoot();
  return useState(isInApp)[0];
}

export function useCapabilities(): HostInfo {
  useMiniappRoot();
  return useState(getCapabilities)[0];
}

export function useCanOpenMap(): boolean {
  useMiniappRoot();
  return useState(canOpenMap)[0];
}

export function useCanOpenMiniapp(): boolean {
  useMiniappRoot();
  return useState(canOpenMiniapp)[0];
}

/** The current viewport, re-rendering when the app reports a change. */
export function useViewport(): Viewport {
  useMiniappRoot();
  const [viewport, setViewport] = useState(getViewport);
  useEffect(() => onViewportChange(setViewport), []);
  return viewport;
}
