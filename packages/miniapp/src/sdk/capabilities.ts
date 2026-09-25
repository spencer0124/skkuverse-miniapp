import type { Method } from '../protocol';
import { host } from '../transport';

export interface HostInfo {
  /** Inside the skkuverse app's WebView. */
  inApp: boolean;
  /** The app's protocol version; 0 outside the app. */
  protocol: number;
  /** Method names the app grants this page. Empty outside the app. */
  capabilities: ReadonlySet<string>;
}

/**
 * What the app can do for this page. Offer a feature only when its method is
 * listed: the app grants per page origin, and an older app lacks newer methods.
 */
export function getCapabilities(): HostInfo {
  const h = host();
  if (!h) return { inApp: false, protocol: 0, capabilities: new Set() };
  return { inApp: true, protocol: h.protocol, capabilities: new Set(h.capabilities) };
}

/** Whether the app grants `method` to this page. */
export function hasCapability(method: Method): boolean {
  return host()?.capabilities.includes(method) ?? false;
}
