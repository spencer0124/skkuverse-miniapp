import type { GameInit, ShellHeader, Viewport } from '@skkuverse/miniapp/protocol';

/** The footprint test and `ship` (`packages/cli/src/ship.ts`) search a build for this text: a build that holds it ships a dev host. */
export const SENTINEL = '__SKKUVERSE_DEV_HOST__';

export interface DevHostConfig {
  preset: string;
  capabilities: readonly string[];
  viewport: Viewport;
  header: ShellHeader;
  installDelayMs: number | null;
  initDelayMs: number | null;
  init: Partial<GameInit> | false;
}

export interface LogEntry {
  dir: 'page' | 'host' | 'info';
  name: string;
  data?: unknown;
}

export interface DevHostRuntime extends DevHostConfig {
  bootstrap(): void;
  log?(entry: LogEntry): void;
}

export function formatLogLine({ dir, name, data }: LogEntry): string {
  const arrow = dir === 'page' ? 'page -> host ' : dir === 'host' ? 'host -> page ' : '';
  const line = `[skkuverse] ${arrow}${name}${data === undefined ? '' : ` ${JSON.stringify(data)}`}`;
  // The page chooses `name` and `data`, and `JSON.stringify` keeps DEL and the C1 controls, so a CSI could reach the terminal.
  return line.replace(/[\u0000-\u001f\u007f-\u009f]/g, '?');
}

/** An `opaque` header is a band the page starts below, so the top edge is zero (`docs/reference/protocol.md`, "Shell"). */
export function viewportFor(overlay: Viewport, header: ShellHeader): Viewport {
  if (header === 'overlay') return overlay;
  return {
    ...overlay,
    safeArea: { ...overlay.safeArea, top: 0 },
    contentSafeArea: { ...overlay.contentSafeArea, top: 0 },
  };
}
