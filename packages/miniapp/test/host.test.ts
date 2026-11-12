import { afterEach, describe, expect, it, vi } from 'vitest';
import { hostBootstrapScript, hostDeliverScript, MESSAGE_EVENT, type Viewport } from '../src/protocol';

const LS = String.fromCharCode(0x2028);

const VIEWPORT: Viewport = {
  safeArea: { top: 47, bottom: 34, left: 0, right: 0 },
  contentSafeArea: { top: 44, bottom: 0, left: 0, right: 0 },
  chrome: 'glass',
};

/** A browser-ish global scope for running the injected scripts. */
function environment(origin = 'https://mukja.mini.skkuverse.com', frame: 'top' | 'sub' = 'top') {
  const props = new Map<string, string>();
  const attrs = new Map<string, string>();
  const win = new EventTarget() as EventTarget & Record<string, unknown>;
  win.top = frame === 'top' ? win : new EventTarget();
  vi.stubGlobal('window', win);
  vi.stubGlobal('location', { origin });
  vi.stubGlobal('document', {
    documentElement: {
      style: { setProperty: (k: string, v: string) => props.set(k, v) },
      setAttribute: (k: string, v: string) => attrs.set(k, v),
    },
  });
  const run = (script: string) => new Function(script)();
  return { win, props, attrs, run };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('hostBootstrapScript', () => {
  it('defines a frozen window.skkuverse and applies CSS variables', () => {
    const { win, props, attrs, run } = environment();
    run(hostBootstrapScript({ capabilities: ['haptic.impact'], viewport: VIEWPORT }));
    const host = win.skkuverse as { protocol: number; capabilities: string[]; getViewport(): Viewport };
    expect(host.protocol).toBe(1);
    expect(host.capabilities).toEqual(['haptic.impact']);
    expect(Object.isFrozen(host)).toBe(true);
    expect(host.getViewport()).toEqual(VIEWPORT);
    expect(props.get('--sv-inset-top')).toBe('91px');
    expect(props.get('--sv-safe-bottom')).toBe('34px');
    expect(attrs.get('data-sv-chrome')).toBe('glass');
  });

  it('updates the viewport and dispatches messages on receive', () => {
    const { win, props, run } = environment();
    run(hostBootstrapScript({ capabilities: [], viewport: VIEWPORT }));
    const seen: unknown[] = [];
    win.addEventListener(MESSAGE_EVENT, (e) => seen.push((e as CustomEvent).detail));
    const next = { ...VIEWPORT, contentSafeArea: { ...VIEWPORT.contentSafeArea, top: 0 } };
    run(hostDeliverScript('https://mukja.mini.skkuverse.com', { event: 'viewport.changed', data: next }));
    expect(props.get('--sv-inset-top')).toBe('47px');
    expect((win.skkuverse as { getViewport(): Viewport }).getViewport()).toEqual(next);
    expect(seen).toEqual([{ event: 'viewport.changed', data: next }]);
  });

  it('does not deliver to a page that has navigated away', () => {
    const { win, run } = environment('https://evil.example');
    run(hostBootstrapScript({ capabilities: [], viewport: VIEWPORT }));
    const seen: unknown[] = [];
    win.addEventListener(MESSAGE_EVENT, (e) => seen.push((e as CustomEvent).detail));
    run(hostDeliverScript('https://mukja.mini.skkuverse.com', { id: 'r1', ok: true, result: 'secret' }));
    expect(seen).toEqual([]);
  });

  describe('with an origin, as a game host calls it', () => {
    const GAME = 'https://wave-run.game.skkuverse.com';

    it('installs in the top window of that origin', () => {
      const { win, props, run } = environment(GAME);
      run(hostBootstrapScript({ capabilities: ['game.ready'], viewport: VIEWPORT, origin: GAME }));
      expect((win.skkuverse as { capabilities: string[] }).capabilities).toEqual(['game.ready']);
      expect(props.get('--sv-inset-top')).toBe('91px');
    });

    it('installs nothing in a document on another origin', () => {
      const { win, props, attrs, run } = environment('https://evil.example');
      run(hostBootstrapScript({ capabilities: ['game.ready'], viewport: VIEWPORT, origin: GAME }));
      expect(win.skkuverse).toBeUndefined();
      expect(props.size).toBe(0);
      expect(attrs.size).toBe(0);
    });

    it('installs nothing in a subframe, even one on that origin', () => {
      const { win, props, run } = environment(GAME, 'sub');
      run(hostBootstrapScript({ capabilities: ['game.ready'], viewport: VIEWPORT, origin: GAME }));
      expect(win.skkuverse).toBeUndefined();
      expect(props.size).toBe(0);
    });

    it('is the same script as before when no origin is given', () => {
      const options = { capabilities: ['haptic.impact'], viewport: VIEWPORT };
      const script = hostBootstrapScript(options);
      expect(script).not.toContain('location.origin');
      expect(script).not.toContain('window.top');
      // Unchanged behaviour: any origin, any frame.
      for (const [origin, frame] of [
        ['https://evil.example', 'top'],
        [GAME, 'sub'],
      ] as const) {
        const { win, run } = environment(origin, frame);
        run(script);
        expect((win.skkuverse as { capabilities: string[] }).capabilities).toEqual(['haptic.impact']);
        vi.unstubAllGlobals();
      }
    });
  });

  it('escapes line separators in delivered JSON', () => {
    const script = hostDeliverScript('https://a.dev', { id: 'r1', ok: true, result: `a${LS}b` });
    expect(script).not.toContain(LS);
  });

  it('keeps markup out of both scripts, so either can sit in a <script> element', () => {
    const markup = '</script><script>alert(1)</script><!--';
    const scripts = [
      hostBootstrapScript({ capabilities: [markup], viewport: VIEWPORT, origin: 'https://a.dev' }),
      hostDeliverScript('https://a.dev', { id: 'r1', ok: true, result: markup }),
    ];
    for (const script of scripts) expect(script).not.toMatch(/<\/script|<!--/i);

    const { win, run } = environment('https://a.dev');
    run(scripts[0]!);
    const seen: unknown[] = [];
    win.addEventListener(MESSAGE_EVENT, (e) => seen.push((e as CustomEvent).detail));
    run(scripts[1]!);
    expect((win.skkuverse as { capabilities: string[] }).capabilities).toEqual([markup]);
    expect(seen).toEqual([{ id: 'r1', ok: true, result: markup }]);
  });
});
