import { useState } from 'react';
import { canOpenMap, canOpenMiniapp } from '../sdk/actions';
import { getCapabilities, type HostInfo } from '../sdk/capabilities';
import { isInApp } from '../transport';

// The host injects its bridge before the page's own script runs, so none of
// these answers can change during a page's life. Each is read once, on mount.

export function useIsInApp(): boolean {
  return useState(isInApp)[0];
}

export function useCapabilities(): HostInfo {
  return useState(getCapabilities)[0];
}

export function useCanOpenMap(): boolean {
  return useState(canOpenMap)[0];
}

export function useCanOpenMiniapp(): boolean {
  return useState(canOpenMiniapp)[0];
}
