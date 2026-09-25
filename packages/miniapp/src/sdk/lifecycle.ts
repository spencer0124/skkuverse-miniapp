import { notify } from '../transport';

/** Tell the app the page has rendered. */
export function ready(): void {
  notify('app.ready', {});
}

/** Record an analytics event through the app, beside the app's own events. */
export function track(event: string, params?: Record<string, unknown>): void {
  notify('analytics.track', params ? { event, params } : { event });
}
