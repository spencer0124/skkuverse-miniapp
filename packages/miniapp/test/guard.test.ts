import { afterEach, describe, expect, it, vi } from 'vitest';
import { blocksEvent, installGuard, installPageGuard, lockGlobals } from '../src/game/guard';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('blocksEvent', () => {
  it('blocks a synthetic input event and passes a real one', () => {
    for (const type of ['keydown', 'beforeinput', 'input', 'pointerdown', 'touchstart', 'click']) {
      expect(blocksEvent({ type, isTrusted: false, editable: false }), type).toBe(true);
      expect(blocksEvent({ type, isTrusted: true, editable: false }), type).toBe(false);
    }
  });

  it('blocks the clipboard, a drag, the context menu and pinch zoom even from the player', () => {
    for (const type of ['copy', 'cut', 'paste', 'drop', 'dragstart', 'contextmenu', 'gesturestart']) {
      expect(blocksEvent({ type, isTrusted: true, editable: true }), type).toBe(true);
    }
  });

  it('lets a selection start only inside an editable field', () => {
    expect(blocksEvent({ type: 'selectstart', isTrusted: true, editable: false })).toBe(true);
    expect(blocksEvent({ type: 'selectstart', isTrusted: true, editable: true })).toBe(false);
  });

  it('passes anything else, synthetic or not', () => {
    for (const type of ['scroll', 'resize', 'visibilitychange', 'focus', 'blur', 'load']) {
      expect(blocksEvent({ type, isTrusted: false, editable: false }), type).toBe(false);
    }
  });
});

describe('installGuard', () => {
  it('keeps a blocked event from the game and prevents its default', () => {
    const target = new EventTarget();
    installGuard(target);
    let reached = 0;
    target.addEventListener('paste', () => reached++);
    target.addEventListener('keydown', () => reached++);

    const paste = new Event('paste', { cancelable: true });
    target.dispatchEvent(paste);
    // Constructed here, so untrusted.
    target.dispatchEvent(new Event('keydown', { cancelable: true }));

    expect(reached).toBe(0);
    expect(paste.defaultPrevented).toBe(true);
  });

  it('lets an event it does not block reach the game untouched', () => {
    const target = new EventTarget();
    installGuard(target);
    let reached = 0;
    target.addEventListener('scroll', () => reached++);

    const scroll = new Event('scroll', { cancelable: true });
    target.dispatchEvent(scroll);

    expect(reached).toBe(1);
    expect(scroll.defaultPrevented).toBe(false);
  });

  it('lets a selection inside an editable field through', () => {
    const target = new EventTarget();
    installGuard(target, () => true);
    let reached = 0;
    target.addEventListener('selectstart', () => reached++);

    target.dispatchEvent(new Event('selectstart', { cancelable: true }));

    expect(reached).toBe(1);
  });
});

describe('lockGlobals', () => {
  it('keeps a locked function working and stops it being replaced', () => {
    const clock = { now: () => 42 };

    lockGlobals([[clock, 'now']]);

    expect(clock.now()).toBe(42);
    expect(() => {
      clock.now = () => 0;
    }).toThrow(TypeError);
    expect(() => Object.defineProperty(clock, 'now', { value: () => 0 })).toThrow(TypeError);
    expect(clock.now()).toBe(42);
  });

  it('pins a global object whole, so it cannot be swapped for a copy', () => {
    const math = { random: () => 0.5 };
    const scope: Record<string, unknown> = { Math: math };

    lockGlobals([[scope, 'Math']]);

    expect(() => {
      scope.Math = { random: () => 0 };
    }).toThrow(TypeError);
    expect(scope.Math).toBe(math);
  });

  it('skips a missing or non-function global rather than creating it', () => {
    const scope: Record<string, unknown> = { flag: 1 };

    lockGlobals([
      [scope, 'absent'],
      [scope, 'flag'],
    ]);

    expect('absent' in scope).toBe(false);
    scope.flag = 2;
    expect(scope.flag).toBe(2);
  });
});

/** A window with clocks of its own, so pinning them leaves the test runner's alone. */
function pageWindow() {
  const win = Object.assign(new EventTarget(), {
    performance: { now: (): number => 1 },
    Date: { now: (): number => 2 },
    Math: { random: (): number => 0.25 },
    requestAnimationFrame: () => 0,
    setTimeout: () => 0,
    setInterval: () => 0,
  });
  vi.stubGlobal('window', win);
  return win as typeof win & Record<string, unknown>;
}

describe('installPageGuard', () => {
  it('drops a synthetic tap before the game hears it', () => {
    const win = pageWindow();
    installPageGuard();
    let taps = 0;
    win.addEventListener('pointerdown', () => taps++);
    win.dispatchEvent(new Event('pointerdown', { cancelable: true }));
    expect(taps).toBe(0);
  });

  it('pins the clock, the dice, the timers and their owners', () => {
    const win = pageWindow();
    const { performance, Math } = win;
    installPageGuard();
    expect(() => {
      win.performance.now = () => 0;
    }).toThrow(TypeError);
    expect(() => {
      win.Date.now = () => 0;
    }).toThrow(TypeError);
    expect(() => {
      win.Math.random = () => 0;
    }).toThrow(TypeError);
    for (const key of ['performance', 'Date', 'Math', 'requestAnimationFrame', 'setTimeout', 'setInterval']) {
      expect(() => {
        win[key] = {};
      }, key).toThrow(TypeError);
    }
    expect(win.performance).toBe(performance);
    expect(win.Math.random()).toBe(0.25);
    expect(Math.random()).toBe(0.25);
  });

  it('installs once per window', () => {
    const win = pageWindow();
    const add = vi.spyOn(win, 'addEventListener');
    installPageGuard();
    const first = add.mock.calls.length;
    installPageGuard();
    expect(first).toBeGreaterThan(0);
    expect(add.mock.calls.length).toBe(first);
  });

  it('does nothing without a window', () => {
    expect(() => installPageGuard()).not.toThrow();
  });
});
