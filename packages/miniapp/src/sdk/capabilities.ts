import type { Capability } from '../protocol';
import { hostBridge, isInApp } from '../transport';

export interface HostInfo {
  /** Inside the skkuverse app's WebView. */
  inApp: boolean;
  /** Highest protocol the host speaks: 0 outside the app, 1 for every app shipped so far. */
  protocol: number;
  /** What the host grants this page. Empty outside the app. */
  capabilities: ReadonlySet<Capability | (string & {})>;
}

/**
 * Ask what the host can do for this page, then offer only that.
 *
 * A v2 host lists its capabilities outright. A v1 host does not, so they are
 * derived from the two signals it does give: the WebView channel means haptics
 * and external links, and each entry of `bridge.actions` means that
 * `web:action` type. The answer's shape is the same either way, so a page
 * written against it keeps working as hosts move from v1 to v2 — and a page
 * built for a newer host still runs, reduced, on an older one.
 *
 * Read on every call rather than cached: the host injects before the page's
 * script runs, so the answer cannot change, and reading is cheap.
 */
export function getCapabilities(): HostInfo {
  if (!isInApp()) return { inApp: false, protocol: 0, capabilities: new Set() };

  const bridge = hostBridge();
  if (bridge?.capabilities) {
    return {
      inApp: true,
      protocol: bridge.protocol ?? 1,
      capabilities: new Set(bridge.capabilities),
    };
  }

  const derived = new Set<string>(['haptic', 'openUrl']);
  for (const action of bridge?.actions ?? []) derived.add(`action.${action}`);
  return { inApp: true, protocol: bridge?.protocol ?? 1, capabilities: derived };
}

/** Shorthand for `getCapabilities().capabilities.has(capability)`. */
export function hasCapability(capability: Capability): boolean {
  return getCapabilities().capabilities.has(capability);
}
