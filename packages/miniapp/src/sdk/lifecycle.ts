import { postToApp } from '../transport';

/**
 * Tell the app the page has rendered. Harmless to call: no shipped app build
 * acts on it yet, and one that does will use it to drop its loading state.
 */
export function ready(): void {
  postToApp({ type: 'web:ready' });
}

/**
 * Record an analytics event through the app, so it lands with the app's own
 * events and user properties. A no-op outside the app.
 */
export function track(event: string, params?: Record<string, unknown>): void {
  postToApp(params ? { type: 'web:analytics', event, params } : { type: 'web:analytics', event });
}
