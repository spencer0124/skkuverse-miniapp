/**
 * What every game page installs so it can only be played by hand: input a
 * script made up never reaches the game, nothing comes in through the
 * clipboard or a drag, and the clock and the dice cannot be swapped out from
 * under a run. `bootGame` installs it before anything else.
 *
 * This does not judge a run, and it cannot stop a modified app. It closes the
 * cheap ways in, from inside the page. A game adds its own on top (a typing
 * game's field, say), and every ranked result is verified outside the page.
 *
 * `window.skkuverse` needs no pin here: the host's bootstrap defines it
 * non-writable and non-configurable before the page's script runs.
 */

/** Input a player makes. One a script dispatched (`isTrusted` false) is dropped. */
const INPUT_EVENTS = [
  'keydown',
  'keyup',
  'keypress',
  'beforeinput',
  'input',
  'change',
  'compositionstart',
  'compositionupdate',
  'compositionend',
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
  'touchstart',
  'touchmove',
  'touchend',
  'touchcancel',
  'mousedown',
  'mousemove',
  'mouseup',
  'click',
  'dblclick',
] as const;

/**
 * Ways in that are not playing, blocked even from the player: the clipboard,
 * a drag, the long-press menu and an iOS pinch. `dragover` is left alone —
 * cancelling it is what would allow a drop.
 */
const ALWAYS_BLOCKED = ['copy', 'cut', 'paste', 'drop', 'dragstart', 'contextmenu', 'gesturestart', 'gesturechange'] as const;

const SELECT_START = 'selectstart';

const INPUT_SET: ReadonlySet<string> = new Set(INPUT_EVENTS);
const ALWAYS_SET: ReadonlySet<string> = new Set(ALWAYS_BLOCKED);

export function blocksEvent(e: { type: string; isTrusted: boolean; editable: boolean }): boolean {
  if (ALWAYS_SET.has(e.type)) return true;
  // A selection may only start where the player types; the field itself
  // keeps its caret.
  if (e.type === SELECT_START) return !e.editable;
  return !e.isTrusted && INPUT_SET.has(e.type);
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as { tagName?: unknown; isContentEditable?: unknown } | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
}

/**
 * Listens at the top in the capture phase, so a blocked event is stopped
 * before any game listener — React's included — sees it.
 */
export function installGuard(target: EventTarget, isEditable: (t: EventTarget | null) => boolean = isEditableTarget): void {
  const onEvent = (e: Event) => {
    if (!blocksEvent({ type: e.type, isTrusted: e.isTrusted, editable: isEditable(e.target) })) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  for (const type of [...INPUT_EVENTS, ...ALWAYS_BLOCKED, SELECT_START]) {
    target.addEventListener(type, onEvent, { capture: true });
  }
}

/**
 * Pins each function or object where it is: it keeps working, and assigning or
 * redefining it afterwards throws. Something missing, or a plain value, is
 * skipped rather than created.
 */
export function lockGlobals(entries: readonly (readonly [object, string])[]): void {
  for (const [owner, key] of entries) {
    const value = (owner as Record<string, unknown>)[key];
    if (typeof value !== 'function' && (typeof value !== 'object' || value === null)) continue;
    try {
      Object.defineProperty(owner, key, { value, writable: false, configurable: false });
    } catch {
      // Already pinned by the platform; it cannot be swapped either.
    }
  }
}

const guarded = new WeakSet<object>();

/**
 * The page's guard. Idempotent: a second call on the same window does nothing.
 *
 * The clock and the dice are read off `window` rather than the bare globals,
 * which are the same objects in a page, so a test can hand it a window of its
 * own without pinning its runner's `Date`.
 */
export function installPageGuard(): void {
  if (typeof window === 'undefined' || guarded.has(window)) return;
  guarded.add(window);
  installGuard(window);
  const scope = window as unknown as Record<string, unknown>;
  const owned = (name: string, key: string): (readonly [object, string])[] => {
    const owner = scope[name];
    return (typeof owner === 'object' || typeof owner === 'function') && owner !== null ? [[owner, key]] : [];
  };
  lockGlobals([
    ...owned('performance', 'now'),
    ...owned('Date', 'now'),
    ...owned('Math', 'random'),
    // The owners too: pinning `Math.random` alone leaves `window.Math`
    // free to be swapped for a copy with another `random`.
    [window, 'performance'],
    [window, 'Date'],
    [window, 'Math'],
    [window, 'requestAnimationFrame'],
    [window, 'setTimeout'],
    [window, 'setInterval'],
  ]);
}
