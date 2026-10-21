import { describe, expect, it } from 'vitest';
import {
  GAME_EVENTS,
  GAME_NOTIFY_METHODS,
  GAME_PROTOCOL,
  NOTIFY_METHODS,
  parseGameEvent,
  parseMessage,
} from '../src/protocol';

const msg = (value: unknown) => parseMessage(JSON.stringify(value));
const over = (params: Record<string, unknown>) => msg({ method: 'game.over', params });
const BASE = { score: 5, ticks: 1, hit: null, revives: 0, revivesLeft: 0 };
const PLAIN = { method: 'game.over', params: BASE };

describe('the game namespace', () => {
  it('is version 1', () => {
    expect(GAME_PROTOCOL).toBe(1);
  });

  it('keeps the mini-app grant list exactly as it was, with no game method', () => {
    expect(NOTIFY_METHODS).toEqual([
      'haptic.impact',
      'link.open',
      'map.openPlace',
      'miniapp.open',
      'share.open',
      'analytics.track',
      'app.ready',
      'shell.set',
    ]);
    expect(NOTIFY_METHODS.filter((m) => m.startsWith('game.'))).toEqual([]);
  });

  it('grants a game only game methods', () => {
    expect(GAME_NOTIFY_METHODS.length).toBeGreaterThan(0);
    expect(GAME_NOTIFY_METHODS.every((m) => m.startsWith('game.'))).toBe(true);
    expect(GAME_EVENTS.every((e) => e.startsWith('game.'))).toBe(true);
  });
});

describe('parseMessage, game notifications', () => {
  it('accepts every well-formed message', () => {
    expect(msg({ method: 'game.ready' })).toEqual({ method: 'game.ready', params: {} });
    expect(msg({ method: 'game.start', params: {} })).toEqual({ method: 'game.start', params: {} });
    expect(msg({ method: 'game.phase', params: { phase: 'paused' } })).toEqual({
      method: 'game.phase',
      params: { phase: 'paused' },
    });
    expect(over({ score: 120, ticks: 3000, hit: 'bus', revives: 1, revivesLeft: 1 })).toEqual({
      method: 'game.over',
      params: { score: 120, ticks: 3000, hit: 'bus', revives: 1, revivesLeft: 1 },
    });
  });

  it('carries seven haptic styles for a game, and haptic.impact keeps its three', () => {
    for (const style of ['light', 'medium', 'heavy', 'soft', 'rigid', 'error', 'success']) {
      expect(msg({ method: 'game.haptic', params: { style } })).toEqual({ method: 'game.haptic', params: { style } });
    }
    expect(msg({ method: 'game.haptic', params: { style: 'loud' } })).toBeNull();
    for (const style of ['soft', 'rigid', 'error', 'success']) {
      expect(msg({ method: 'haptic.impact', params: { style } })).toBeNull();
    }
  });

  it('carries the title rectangle on game.ready, and drops a malformed one alone', () => {
    const rect = { x: 16, y: 120.5, width: 343, height: 48 };
    expect(msg({ method: 'game.ready', params: { rect } })).toEqual({ method: 'game.ready', params: { rect } });
    expect(msg({ method: 'game.ready', params: { rect: { ...rect, extra: 1 } } })).toEqual({
      method: 'game.ready',
      params: { rect },
    });
    for (const bad of [null, [], { ...rect, width: -1 }, { ...rect, x: '16' }, { x: 1, y: 2, width: 3 }]) {
      expect(msg({ method: 'game.ready', params: { rect: bad } })).toEqual({ method: 'game.ready', params: {} });
    }
    expect(parseMessage('{"method":"game.ready","params":{"rect":{"x":1e999,"y":0,"width":1,"height":1}}}')).toEqual({
      method: 'game.ready',
      params: {},
    });
  });

  it('requires a rectangle on game.layout', () => {
    const rect = { x: 0, y: 0, width: 390, height: 600 };
    expect(msg({ method: 'game.layout', params: { rect } })).toEqual({ method: 'game.layout', params: { rect } });
    expect(msg({ method: 'game.layout', params: {} })).toBeNull();
    expect(msg({ method: 'game.layout', params: { rect: { ...rect, height: -2 } } })).toBeNull();
  });

  it('rejects payloads a handler would act on wrongly', () => {
    expect(msg({ method: 'game.phase', params: { phase: 'flying' } })).toBeNull();
    // A score must be a non-negative integer: it is what gets submitted.
    expect(over({ ...BASE, score: 1.5 })).toBeNull();
    expect(over({ ...BASE, score: -1 })).toBeNull();
    expect(over({ ...BASE, score: '9' })).toBeNull();
    expect(over({ score: 1, ticks: 1, hit: null })).toBeNull();
    expect(over({ ...BASE, hit: 7 })).toBeNull();
    expect(over({ score: 1, ticks: 1, revives: 0, revivesLeft: 2 })).toBeNull();
    expect(over({ score: 1, ticks: 1, hit: null, revives: 0 })).toBeNull();
    expect(over({ ...BASE, ticks: 0.5 })).toBeNull();
    expect(over({ ...BASE, score: 1e300 })).toBeNull();
    expect(
      parseMessage('{"method":"game.over","params":{"score":9007199254740993,"ticks":1,"hit":null,"revives":0,"revivesLeft":2}}'),
    ).toBeNull();
    expect(over({ ...BASE, hit: 'x'.repeat(33) })).toBeNull();
  });

  it('accepts a null hit, turns -0 into 0 and drops stray fields', () => {
    expect(parseMessage('{"method":"game.over","params":{"score":-0,"ticks":0,"hit":null,"revives":0,"revivesLeft":2,"uid":"x"}}')).toEqual({
      method: 'game.over',
      params: { score: 0, ticks: 0, hit: null, revives: 0, revivesLeft: 2 },
    });
    expect(Object.is((over({ ...BASE, score: -0 })!.params as { score: number }).score, 0)).toBe(true);
    expect(over({ ...BASE, hit: 'x'.repeat(32) })).not.toBeNull();
  });

  it('carries a well-formed stats map, rebuilt', () => {
    expect(over({ score: 61234, ticks: 238, hit: null, revives: 0, revivesLeft: 0, stats: { kpm: 233, accuracy: 97.5 } })).toEqual({
      method: 'game.over',
      params: { score: 61234, ticks: 238, hit: null, revives: 0, revivesLeft: 0, stats: { kpm: 233, accuracy: 97.5 } },
    });
  });

  it('drops malformed stats but keeps the result', () => {
    const nine = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`k${i}`, i]));
    const base = '"score":5,"ticks":1,"hit":null,"revives":0,"revivesLeft":0';
    for (const stats of ['[1,2]', '{}', '{"kpm":"233"}', '{"kpm":null}', '{"bad key":1}', '{"__proto__":1}', JSON.stringify(nine), '"x"', '{"kpm":1e999}']) {
      expect(parseMessage(`{"method":"game.over","params":{${base},"stats":${stats}}}`), stats).toEqual(PLAIN);
    }
  });

  it('carries a telemetry map beside stats, and drops a malformed one alone', () => {
    expect(over({ ...BASE, stats: { kpm: 1 }, telemetry: { minKeyMs: 38, bulkInputs: 2 } })).toEqual({
      method: 'game.over',
      params: { ...BASE, stats: { kpm: 1 }, telemetry: { minKeyMs: 38, bulkInputs: 2 } },
    });
    const twelve = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`k${i}`, i]));
    expect(over({ ...BASE, telemetry: twelve })).toEqual({ method: 'game.over', params: { ...BASE, telemetry: twelve } });
    const thirteen = Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`k${i}`, i]));
    expect(over({ ...BASE, stats: { kpm: 1 }, telemetry: thirteen })).toEqual({
      method: 'game.over',
      params: { ...BASE, stats: { kpm: 1 } },
    });
  });

  it('carries a validator version, and drops a malformed one alone', () => {
    expect(over({ ...BASE, validator: 'wave-run@1' })).toEqual({
      method: 'game.over',
      params: { ...BASE, validator: 'wave-run@1' },
    });
    for (const validator of ['wave-run', 'Wave-Run@1', 'wave-run@', '@1', 'wave run@1', 'wave-run@1.2', 1, null, `${'a'.repeat(63)}@1`]) {
      expect(over({ ...BASE, validator }), String(validator)).toEqual(PLAIN);
    }
  });

  it('fits the largest allowed game.over, envelope and all, within the message limit', () => {
    // The longest key, and the longest JSON a finite number can print as.
    const key = (prefix: string, i: number) => `${prefix}${i}`.padEnd(24, 'x');
    const value = -0.0000012345678901234567;
    expect(JSON.stringify(value)).toHaveLength(25);
    const stats = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [key('s', i), value]));
    const telemetry = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [key('t', i), value]));
    const params = {
      score: Number.MAX_SAFE_INTEGER,
      ticks: Number.MAX_SAFE_INTEGER,
      // Control characters escape to six characters each.
      hit: '\u0001'.repeat(32),
      revives: Number.MAX_SAFE_INTEGER,
      revivesLeft: Number.MAX_SAFE_INTEGER,
      validator: `${'a'.repeat(61)}@1`,
      stats,
      telemetry,
    };
    const raw = JSON.stringify({ method: 'game.over', params });
    expect(raw.length).toBeLessThanOrEqual(4096);
    expect(parseMessage(raw)).toEqual({ method: 'game.over', params });
  });
});

describe('parseGameEvent', () => {
  it('accepts every well-formed event', () => {
    expect(parseGameEvent({ event: 'game.init', data: { gameProtocol: 1, hi: 42, sound: true } })).toEqual({
      event: 'game.init',
      data: { gameProtocol: 1, hi: 42, sound: true },
    });
    for (const event of ['game.pause', 'game.resume', 'game.reset', 'game.restart', 'game.revive']) {
      expect(parseGameEvent({ event, data: {} })).toEqual({ event, data: {} });
      expect(parseGameEvent({ event })).toEqual({ event, data: {} });
    }
    expect(parseGameEvent({ event: 'game.sound', data: { on: false } })).toEqual({
      event: 'game.sound',
      data: { on: false },
    });
  });

  it('rejects anything else', () => {
    expect(parseGameEvent(null)).toBeNull();
    expect(parseGameEvent('game.revive')).toBeNull();
    expect(parseGameEvent({ event: 'game.init' })).toBeNull();
    expect(parseGameEvent({ event: 'game.init', data: { gameProtocol: 1, hi: -3, sound: true } })).toBeNull();
    expect(parseGameEvent({ event: 'game.init', data: { gameProtocol: 1, hi: 1.5, sound: true } })).toBeNull();
    expect(parseGameEvent({ event: 'game.init', data: { gameProtocol: 0, hi: 1, sound: true } })).toBeNull();
    expect(parseGameEvent({ event: 'game.init', data: { gameProtocol: 1, hi: 1 } })).toBeNull();
    expect(parseGameEvent({ event: 'game.sound', data: {} })).toBeNull();
    expect(parseGameEvent({ event: 'game.sound', data: { on: 'false' } })).toBeNull();
    expect(parseGameEvent({ event: 'viewport.changed', data: {} })).toBeNull();
    expect(parseGameEvent({ event: 'host:revive' })).toBeNull();
  });
});
