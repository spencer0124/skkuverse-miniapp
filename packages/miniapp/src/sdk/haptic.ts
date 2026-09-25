import type { WebToAppMessage } from '../protocol';
import { isInApp, postToApp } from '../transport';

export type HapticStyle = Extract<WebToAppMessage, { type: 'web:haptic' }>['style'];

export interface HapticOptions {
  /**
   * Outside the app, pulse the Vibration API for this many milliseconds
   * instead. Android browsers honour it; iOS Safari has no Vibration API and
   * stays silent. Off by default: a buzz a page did not ask for is worse than
   * none.
   */
  vibrate?: number;
}

/**
 * One tap of haptic feedback from the app. Outside the app it does nothing,
 * unless `vibrate` asks for a browser fallback. An app build that does not
 * accept `web:haptic` drops the message.
 */
export function haptic(style: HapticStyle, options: HapticOptions = {}): void {
  if (isInApp()) {
    postToApp({ type: 'web:haptic', style });
    return;
  }
  if (options.vibrate && typeof navigator !== 'undefined') navigator.vibrate?.(options.vibrate);
}
