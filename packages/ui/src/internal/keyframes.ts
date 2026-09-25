/**
 * One-time keyframe injection.
 *
 * Inline styles cannot express `@keyframes`, and this package ships JavaScript
 * only, so there is no stylesheet for a consumer to import.
 * Injecting once at first use keeps the animations self-contained: a consumer
 * cannot forget an import and silently lose them.
 *
 * Guarded for environments without a document, so importing this package during
 * server rendering does nothing rather than throwing.
 */
const STYLE_ID = 'skkuverse-ui-keyframes';

const KEYFRAMES = `
@keyframes sds-dot-pulse {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 1; }
}
@keyframes sds-skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes sds-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`;

let injected = false;

export function ensureKeyframes(): void {
  if (injected || typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) {
    injected = true;
    return;
  }
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = KEYFRAMES;
  document.head.appendChild(el);
  injected = true;
}

/**
 * Approximations of the Reanimated spring configs in
 * `sds/src/foundation/easings.ts`. A CSS transition cannot overshoot the way a
 * spring does, so these are durations and curves chosen to feel equivalent
 * rather than to reproduce the physics.
 */
export const TRANSITION = {
  /** springConfig('rapid') — press feedback */
  rapid: '150ms cubic-bezier(0.33, 1, 0.68, 1)',
  /** springConfig('quick') — overlays and dims */
  quick: '200ms cubic-bezier(0.33, 1, 0.68, 1)',
} as const;
