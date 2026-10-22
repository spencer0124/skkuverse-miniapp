import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bootGame, type GameClient } from '../src/game';
import { NOTIFY_METHODS, type GameOver, type Viewport } from '../src/protocol';
import {
  assertGameContract,
  BOUND_FIXTURES,
  checkGameContract,
  createFakeHost,
  GameContractError,
  type ContractEntry,
} from '../src/testing';

const VIEWPORT: Viewport = {
  safeArea: { top: 47, bottom: 34, left: 0, right: 0 },
  contentSafeArea: { top: 44, bottom: 0, left: 0, right: 0 },
  chrome: 'glass',
};
const RESULT: GameOver = { score: 120, ticks: 600, hit: 'bus', revives: 0, revivesLeft: 2 };

type Page = EventTarget & Record<string, unknown>;
let win: Page;
let clients: GameClient[];

beforeEach(() => {
  // No document: the fake host records the CSS variables itself.
  win = new EventTarget() as Page;
  clients = [];
  vi.stubGlobal('window', win);
});

afterEach(() => {
  for (const client of clients) client.dispose();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function boot(handlers: Partial<Parameters<typeof bootGame>[0]> = {}) {
  const client = bootGame({ onInit: () => {}, ...handlers });
  clients.push(client);
  return client;
}

/** A page posting by hand, the way G2 forbids: for the violations bootGame never makes. */
const post = (message: unknown) =>
  (win.ReactNativeWebView as { postMessage(s: string): void }).postMessage(JSON.stringify(message));

describe('createFakeHost', () => {
  it('runs the real bootstrap: the host object, the grants and the CSS variables', () => {
    const host = createFakeHost({ viewport: VIEWPORT });
    host.install();
    const sk = win.skkuverse as { protocol: number; capabilities: string[] };
    expect(sk.protocol).toBe(1);
    expect(sk.capabilities).toContain('game.over');
    expect(sk.capabilities).not.toContain('link.open');
    expect(() => {
      win.skkuverse = {};
    }).toThrow(TypeError);
    expect(host.cssVar('--sv-inset-top')).toBe('91px');
  });

  it('answers game.ready with game.init and completes a run that keeps the contract', async () => {
    const host = createFakeHost({ init: { hi: 300, sound: false } });
    host.install();
    const onInit = vi.fn();
    const client = boot({ onInit });
    await host.flush();
    expect(onInit).toHaveBeenCalledWith({ gameProtocol: 1, hi: 300, sound: false });
    client.start();
    client.phase('running');
    client.over(RESULT);
    expect(host.methods()).toEqual(['game.ready', 'game.start', 'game.phase', 'game.over']);
    expect(checkGameContract(host.log)).toEqual([]);
    expect(() => assertGameContract(host.log)).not.toThrow();
  });

  it('completes the handshake when it arrives after the page booted', async () => {
    vi.useFakeTimers();
    const host = createFakeHost();
    const onInit = vi.fn();
    boot({ onInit });
    vi.advanceTimersByTime(500);
    host.install();
    vi.advanceTimersByTime(50);
    await host.flush();
    expect(host.methods()).toEqual(['game.ready']);
    expect(onInit).toHaveBeenCalledTimes(1);
  });

  it('drives the page with host events', async () => {
    const host = createFakeHost({ init: false });
    host.install();
    const calls: string[] = [];
    boot({
      onPause: () => calls.push('pause'),
      onSound: (on) => calls.push(`sound:${on}`),
      onReset: () => calls.push('reset'),
    });
    host.init();
    host.pause();
    host.sound(false);
    host.reset();
    expect(calls).toEqual(['pause', 'sound:false', 'reset']);
  });

  it('refuses to send before it is installed', () => {
    expect(() => createFakeHost().pause()).toThrow(/before the fake host was installed/);
  });
});

describe('the contract', () => {
  const rules = (log: readonly ContractEntry[]) => checkGameContract(log).map((v) => v.rule);

  it('allows one more game.over after each revive', async () => {
    const host = createFakeHost();
    host.install();
    const client = boot();
    await host.flush();
    client.start();
    client.over({ ...RESULT, revivesLeft: 1 });
    host.revive();
    client.over({ ...RESULT, revives: 1, revivesLeft: 0 });
    host.restart();
    client.start();
    client.over(RESULT);
    expect(rules(host.log)).toEqual([]);
  });

  it('fails a page that reports over twice in one run, and names the rule', async () => {
    const host = createFakeHost();
    host.install();
    const client = boot();
    await host.flush();
    client.start();
    client.over(RESULT);
    client.over(RESULT);
    expect(rules(host.log)).toEqual(['one-over-per-run']);
    expect(() => assertGameContract(host.log)).toThrow(GameContractError);
    expect(() => assertGameContract(host.log)).toThrow(/one-over-per-run/);
  });

  it('fails a game.over with no run started, and one after a reset', async () => {
    const host = createFakeHost();
    host.install();
    const client = boot();
    await host.flush();
    client.over(RESULT);
    client.start();
    host.reset();
    client.over(RESULT);
    expect(rules(host.log)).toEqual(['start-before-over', 'start-before-over']);
  });

  it('fails a run started before game.init', () => {
    const host = createFakeHost({ init: false });
    host.install();
    post({ method: 'game.ready', params: {} });
    post({ method: 'game.start', params: {} });
    expect(rules(host.log)).toEqual(['no-start-before-init']);
  });

  it('fails a page whose first message is not game.ready', () => {
    const host = createFakeHost({ init: false });
    host.install();
    post({ method: 'game.phase', params: { phase: 'ready' } });
    expect(rules(host.log)).toEqual(['first-message-ready']);
    expect(rules([])).toEqual(['first-message-ready']);
  });

  it('fails a message that does not parse, or is not a game notification', () => {
    const host = createFakeHost({ init: false });
    host.install();
    post({ method: 'game.ready', params: {} });
    post({ type: 'game:over', score: 1 });
    post({ method: 'link.open', params: { url: 'https://example.com' } });
    post({ method: 'game.over', params: { score: -1 } });
    expect(rules(host.log)).toEqual(['every-message-parses', 'every-message-parses', 'every-message-parses']);
  });
});

describe('a game page under the mini-app grants', () => {
  it('hears nothing back, and sends nothing', () => {
    const host = createFakeHost({ capabilities: NOTIFY_METHODS });
    host.install();
    const onNoHost = vi.fn();
    boot({ onNoHost });
    expect(onNoHost).toHaveBeenCalledTimes(1);
    expect(host.methods()).toEqual([]);
  });
});

describe('BOUND_FIXTURES', () => {
  it('is the published JSON file', () => {
    const file = JSON.parse(readFileSync(new URL('../fixtures/bounds.json', import.meta.url), 'utf8'));
    expect(BOUND_FIXTURES).toEqual(file);
  });

  // Copied from skkuverse-app packages/wave-run/src/game/bound.test.ts and
  // packages/subway-typing/src/bound.test.ts, which the rules tests agree with.
  it('pins the bound points the games and the rules pin today', () => {
    expect(BOUND_FIXTURES['wave-run'].maxScoreAfterSeconds).toEqual([
      { seconds: 0, maxScore: 94 },
      { seconds: 60, maxScore: 850 },
      { seconds: 300, maxScore: 5432 },
      { seconds: 600, maxScore: 11282 },
    ]);
    expect(BOUND_FIXTURES['subway-typing']).toEqual({ totalKeys: 238, minRunMs: 9520 });
  });
});
