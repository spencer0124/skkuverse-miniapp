import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bootGame, HOST_WAIT_MS, type GameClient, type GameHandlers } from '../src/game';
import {
  GAME_NOTIFY_METHODS,
  hostBootstrapScript,
  NOTIFY_METHODS,
  parseMessage,
  type Viewport,
} from '../src/protocol';

const VIEWPORT: Viewport = {
  safeArea: { top: 47, bottom: 34, left: 0, right: 0 },
  contentSafeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  chrome: 'opaque',
};

type Page = EventTarget & Record<string, unknown>;
let win: Page;
let sent: string[];
let css: Map<string, string>;
let clients: GameClient[];

/** A fresh page with no host yet: a window, and a document for the bootstrap's CSS variables. */
beforeEach(() => {
  vi.useFakeTimers();
  win = new EventTarget() as Page;
  sent = [];
  css = new Map();
  clients = [];
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', {
    documentElement: { style: { setProperty: (k: string, v: string) => css.set(k, v) }, setAttribute: () => {} },
  });
});

afterEach(() => {
  for (const client of clients) client.dispose();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** The host arrives: its message channel, then its real bootstrap script. */
function hostArrives(capabilities: readonly string[] = GAME_NOTIFY_METHODS) {
  win.ReactNativeWebView = { postMessage: (s: string) => sent.push(s) };
  new Function(hostBootstrapScript({ capabilities, viewport: VIEWPORT }))();
}

function send(event: string, data: unknown = {}) {
  (win.skkuverse as { receive(json: string): void }).receive(JSON.stringify({ event, data }));
}

const methods = () => sent.map((s) => parseMessage(s)?.method ?? `unparsed:${s}`);

function boot(handlers: Partial<GameHandlers> = {}) {
  const all = { onInit: vi.fn(), ...handlers };
  const client = bootGame(all);
  clients.push(client);
  return { client, handlers: all };
}

/** A trusted event, as the browser would deliver one. A test cannot make one otherwise. */
function trusted(type: string) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'isTrusted', { value: true });
  return event;
}

describe('the handshake', () => {
  it('sends game.ready at once when the host is already there', () => {
    hostArrives();
    const onViewport = vi.fn();
    boot({ onViewport, rect: () => ({ x: 0, y: 100, width: 390, height: 60 }) });
    expect(sent.map((s) => parseMessage(s))).toEqual([
      { method: 'game.ready', params: { rect: { x: 0, y: 100, width: 390, height: 60 } } },
    ]);
    expect(onViewport).toHaveBeenCalledWith(VIEWPORT);
    // The bootstrap fitted the insets; the page reads them as CSS variables.
    expect(css.get('--sv-inset-top')).toBe('47px');
  });

  it('waits for a host global that arrives late, as on a replaced Android document', () => {
    const { handlers } = boot();
    vi.advanceTimersByTime(2_000);
    expect(sent).toEqual([]);
    hostArrives();
    vi.advanceTimersByTime(60);
    expect(methods()).toEqual(['game.ready']);
    vi.advanceTimersByTime(HOST_WAIT_MS);
    expect(methods()).toEqual(['game.ready']);
    expect(handlers.onInit).not.toHaveBeenCalled();
  });

  it('gives up after the bounded wait and says so', () => {
    const onNoHost = vi.fn();
    boot({ onNoHost });
    vi.advanceTimersByTime(HOST_WAIT_MS + 100);
    expect(onNoHost).toHaveBeenCalledTimes(1);
    hostArrives();
    vi.advanceTimersByTime(1_000);
    expect(sent).toEqual([]);
  });

  it('treats a host that grants no game method as none, as in the mini-app shell', () => {
    hostArrives(NOTIFY_METHODS);
    const onNoHost = vi.fn();
    boot({ onNoHost });
    expect(onNoHost).toHaveBeenCalledTimes(1);
    expect(sent).toEqual([]);
  });
});

describe('before game.init', () => {
  it('refuses to start a run and ignores host events', () => {
    hostArrives();
    const onPause = vi.fn();
    const onRestart = vi.fn();
    const { client, handlers } = boot({ onPause, onRestart });
    expect(client.init).toBeNull();
    expect(client.start()).toBe(false);
    send('game.pause');
    send('game.restart');
    expect(onPause).not.toHaveBeenCalled();
    expect(onRestart).not.toHaveBeenCalled();
    expect(methods()).toEqual(['game.ready']);

    send('game.init', { gameProtocol: 1, hi: 42, sound: false });
    expect(handlers.onInit).toHaveBeenCalledWith({ gameProtocol: 1, hi: 42, sound: false });
    expect(client.init).toEqual({ gameProtocol: 1, hi: 42, sound: false });
    expect(client.start()).toBe(true);
    expect(methods()).toEqual(['game.ready', 'game.start']);
  });

  it('ignores a malformed game.init', () => {
    hostArrives();
    const { client, handlers } = boot();
    send('game.init', { gameProtocol: 1, hi: -1, sound: true });
    expect(handlers.onInit).not.toHaveBeenCalled();
    expect(client.start()).toBe(false);
  });
});

describe('host events', () => {
  function initialized(handlers: Partial<GameHandlers>) {
    hostArrives();
    const booted = boot(handlers);
    send('game.init', { gameProtocol: 1, hi: 0, sound: true });
    return booted;
  }

  it('obeys pause, resume, sound and reset', () => {
    const calls: string[] = [];
    initialized({
      onPause: () => calls.push('pause'),
      onResume: () => calls.push('resume'),
      onSound: (on) => calls.push(`sound:${on}`),
      onReset: () => calls.push('reset'),
      onRestart: () => calls.push('restart'),
      onRevive: () => calls.push('revive'),
    });
    send('game.pause');
    send('game.resume');
    send('game.sound', { on: false });
    send('game.sound', { on: 'no' });
    send('game.reset');
    send('game.restart');
    send('game.revive');
    send('game.explode');
    expect(calls).toEqual(['pause', 'resume', 'sound:false', 'reset', 'restart', 'revive']);
  });

  it('passes viewport changes on', () => {
    const onViewport = vi.fn();
    initialized({ onViewport });
    const next = { ...VIEWPORT, safeArea: { ...VIEWPORT.safeArea, top: 0 } };
    send('viewport.changed', next);
    expect(onViewport).toHaveBeenLastCalledWith(next);
    expect(css.get('--sv-inset-top')).toBe('0px');
  });

  it('installs no visibility handler: pausing is the host’s call', () => {
    const add = vi.spyOn(win, 'addEventListener');
    initialized({ onPause: vi.fn() });
    const types = add.mock.calls.map(([type]) => type);
    expect(types).not.toContain('visibilitychange');
    expect(types).not.toContain('blur');
    expect(types).not.toContain('pagehide');
  });
});

describe('a page built for a newer game protocol', () => {
  /** A page that uses a version-2 feature only when the host speaks 2. */
  function pageForProtocol2() {
    let usesV2 = false;
    const { client } = boot({
      onInit: (init) => {
        usesV2 = init.gameProtocol >= 2;
      },
    });
    return { client, usesV2: () => usesV2 };
  }

  it('runs without the newer features on an older host', () => {
    hostArrives();
    const page = pageForProtocol2();
    send('game.init', { gameProtocol: 1, hi: 0, sound: true });
    expect(page.usesV2()).toBe(false);
    expect(page.client.start()).toBe(true);
    expect(methods()).toEqual(['game.ready', 'game.start']);
  });

  it('uses them on a host that has them', () => {
    hostArrives();
    const page = pageForProtocol2();
    send('game.init', { gameProtocol: 2, hi: 0, sound: true });
    expect(page.usesV2()).toBe(true);
  });
});

describe('reporting', () => {
  it('sends messages the host parses', () => {
    hostArrives();
    const { client } = boot();
    send('game.init', { gameProtocol: 1, hi: 0, sound: true });
    client.start();
    client.phase('running');
    client.haptic('success');
    client.layout({ x: 10, y: 20, width: 300, height: 400 });
    client.over({ score: 850, ticks: 3600, hit: 'bus', revives: 1, revivesLeft: 1, validator: 'wave-run@1', telemetry: { pauses: 0 } });
    expect(sent.map((s) => parseMessage(s))).toEqual([
      { method: 'game.ready', params: {} },
      { method: 'game.start', params: {} },
      { method: 'game.phase', params: { phase: 'running' } },
      { method: 'game.haptic', params: { style: 'success' } },
      { method: 'game.layout', params: { rect: { x: 10, y: 20, width: 300, height: 400 } } },
      {
        method: 'game.over',
        params: { score: 850, ticks: 3600, hit: 'bus', revives: 1, revivesLeft: 1, validator: 'wave-run@1', telemetry: { pauses: 0 } },
      },
    ]);
  });

  it('is a no-op with no host', () => {
    const { client } = boot();
    client.phase('ready');
    client.over({ score: 1, ticks: 1, hit: null, revives: 0, revivesLeft: 0 });
    expect(sent).toEqual([]);
  });
});

describe('the page guard and audio', () => {
  it('installs the guard before the game listens', () => {
    hostArrives();
    boot();
    let taps = 0;
    win.addEventListener('pointerdown', () => taps++);
    win.dispatchEvent(new Event('pointerdown', { cancelable: true }));
    expect(taps).toBe(0);
    win.dispatchEvent(trusted('pointerdown'));
    expect(taps).toBe(1);
  });

  it('opens audio on every press the player made, and never on a synthetic one', () => {
    hostArrives();
    const onAudioUnlock = vi.fn();
    boot({ onAudioUnlock });
    win.dispatchEvent(new Event('pointerdown'));
    win.dispatchEvent(new Event('keydown'));
    expect(onAudioUnlock).not.toHaveBeenCalled();
    win.dispatchEvent(trusted('pointerdown'));
    win.dispatchEvent(trusted('keydown'));
    expect(onAudioUnlock).toHaveBeenCalledTimes(2);
  });
});

describe('dispose', () => {
  it('stops looking for the host and listening to it', () => {
    const onPause = vi.fn();
    const { client } = boot({ onPause });
    client.dispose();
    hostArrives();
    vi.advanceTimersByTime(1_000);
    expect(sent).toEqual([]);
    send('game.init', { gameProtocol: 1, hi: 0, sound: true });
    expect(client.init).toBeNull();
  });
});
