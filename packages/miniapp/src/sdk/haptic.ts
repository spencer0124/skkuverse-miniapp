import type { HapticStyle } from '../protocol';
import { isGranted, notify } from '../transport';

export type { HapticStyle };

export interface HapticOptions {
  /**
   * Where the app cannot tap, pulse the Vibration API for this many
   * milliseconds instead. Android browsers honour it; iOS Safari has none. Off
   * by default: a buzz a page did not ask for is worse than none.
   */
  vibrate?: number;
}

/** One tap of haptic feedback from the app, or the `vibrate` fallback, or nothing. */
export function haptic(style: HapticStyle, options: HapticOptions = {}): void {
  if (isGranted('haptic.impact')) {
    notify('haptic.impact', { style });
    return;
  }
  if (options.vibrate && typeof navigator !== 'undefined') navigator.vibrate?.(options.vibrate);
}
