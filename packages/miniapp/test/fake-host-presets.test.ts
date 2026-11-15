import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HOST_WAIT_MS } from '../src/game';
import { GAME_NOTIFY_METHODS, NOTIFY_METHODS } from '../src/protocol';

type Page = EventTarget & Record<string, unknown>;
type Sdk = typeof import('../src');
type Game = typeof import('../src/game');
type Testing = typeof import('../src/testing');

let win: Page;
let sdk: Sdk;
let game: Game;
let testing: Testing;
let hosts: ReturnType<Testing['createFakeHost']>[];
let clients: ReturnType<Game['bootGame']>[];

// The transport attaches its window listener once per module instance, and the bootstrap defines
// `window.skkuverse` as non-configurable, so each case gets a fresh window and fresh modules.
beforeEach(async () => {
  vi.resetModules();
  win = new EventTarget() as Page;
  vi.stubGlobal('window', win);
  sdk = await import('../src');
  game = await import('../src/game');
  testing = await import('../src/testing');
  hosts = [];
  clients = [];
});

afterEach(() => {
  for (const host of hosts) host.dispose();
  for (const client of clients) client.dispose();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function host(options?: Parameters<Testing['createFakeHost']>[0]) {
  const created = testing.createFakeHost(options);
  hosts.push(created);
  return created;
}

function boot(handlers: Partial<Parameters<Game['bootGame']>[0]> = {}) {
  const client = game.bootGame({ onInit: () => {}, ...handlers });
  clients.push(client);
  return client;
}

const capabilities = () => [...sdk.getCapabilities().capabilities].sort();

describe('presets', () => {
  it('granted: every method of both lists, on the iPhone viewport', () => {
    const h = host({ preset: 'granted' });
    h.install();

    expect(capabilities()).toEqual([...NOTIFY_METHODS, ...GAME_NOTIFY_METHODS].sort());
    expect(h.cssVar('--sv-inset-top')).toBe('91px');
    expect(h.cssVar('--sv-inset-bottom')).toBe('34px');
  });

  it('nothing-granted: the host is there and the SDK takes its fallbacks', () => {
    const h = host({ preset: 'nothing-granted' });
    h.install();
    sdk.haptic('light');

    expect(sdk.getCapabilities()).toMatchObject({ inApp: true });
    expect(capabilities()).toEqual([]);
    expect(h.methods()).not.toContain('haptic.impact');
  });

  it('no-host: install does nothing, even after a long wait', () => {
    vi.useFakeTimers();
    const h = host({ preset: 'no-host' });
    h.install();
    vi.advanceTimersByTime(60_000);

    expect(h.installed).toBe(false);
    expect(win.skkuverse).toBeUndefined();
    expect(sdk.getCapabilities().inApp).toBe(false);
  });

  it('late-host: a game page gives up first, then finds the host and reaches game.init', async () => {
    vi.useFakeTimers();
    const onNoHost = vi.fn();
    const onInit = vi.fn();
    const h = host({ preset: 'late-host' });
    boot({ onNoHost, onInit });
    h.install();
    expect(testing.HOST_PRESETS['late-host'].hostDelayMs).toBeGreaterThan(HOST_WAIT_MS);

    await vi.advanceTimersByTimeAsync(HOST_WAIT_MS + 1_000);
    expect(onNoHost).toHaveBeenCalledTimes(1);
    expect(h.installed).toBe(false);
    expect(onInit).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(testing.HOST_PRESETS['late-host'].hostDelayMs);
    expect(h.installed).toBe(true);
    expect(onInit).toHaveBeenCalledTimes(1);
    expect(h.methods()[0]).toBe('game.ready');
    expect(onNoHost).toHaveBeenCalledTimes(1);
  });

  it('slow-init: the host is there at once and game.init comes late', async () => {
    vi.useFakeTimers();
    const onInit = vi.fn();
    const h = host({ preset: 'slow-init' });
    h.install();
    boot({ onInit });
    const late = testing.HOST_PRESETS['slow-init'].initDelayMs;

    await vi.advanceTimersByTimeAsync(late - 1);
    expect(h.methods()).toEqual(['game.ready']);
    expect(onInit).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(onInit).toHaveBeenCalledTimes(1);
  });

  it('old-host:0.2.1: share() posts nothing and falls back to the clipboard', async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const h = host({ preset: 'old-host:0.2.1' });
    h.install();

    await expect(sdk.share({ url: 'https://skkuverse.com/p/m/x' })).resolves.toBe('copied');
    expect(h.methods()).toEqual([]);
    expect(writeText).toHaveBeenCalledWith('https://skkuverse.com/p/m/x');
    expect(capabilities()).not.toContain('share.open');
    expect(capabilities()).toContain('haptic.impact');
  });

  it('old-host:0.3.0 grants share.open, and 0.4.0 the game methods', async () => {
    host({ preset: 'old-host:0.3.0' }).install();
    expect(capabilities()).toContain('share.open');
    expect(capabilities()).not.toContain('game.ready');

    expect(testing.oldHostCapabilities('0.4.0')).toEqual(expect.arrayContaining(['game.ready', 'share.open']));
    expect(testing.oldHostCapabilities('0.4.0')).not.toEqual(testing.oldHostCapabilities('0.3.0'));
  });

  it('the newest old-host version grants exactly what the SDK lists now, so a new method needs a version row', () => {
    const versions = Object.keys(testing.HOST_METHODS_ADDED) as (keyof typeof testing.HOST_METHODS_ADDED)[];
    const newest = testing.oldHostCapabilities(versions.at(-1)!);

    expect([...newest].sort()).toEqual([...NOTIFY_METHODS, ...GAME_NOTIFY_METHODS].sort());
    expect(newest).toHaveLength(new Set(newest).size);
  });

  it('a field passed beside the preset wins over the preset', () => {
    const h = host({ preset: 'granted', capabilities: ['demo.echo'] });
    h.install();

    expect(capabilities()).toEqual(['demo.echo']);
    expect(h.cssVar('--sv-inset-top')).toBe('91px');
  });

  it('throws for a name no preset has, naming the known ones', () => {
    expect(() => testing.createFakeHost({ preset: 'old-host:9.9.9' as never })).toThrow(/unknown host preset "old-host:9.9.9".*granted/);
    expect(() => testing.createFakeHost({ preset: 'toString' as never })).toThrow(/unknown host preset/);
  });

  it('without a preset the host is the one the game contract has always seen', () => {
    const h = host();
    h.install();

    expect(capabilities()).toEqual([...GAME_NOTIFY_METHODS].sort());
    expect(h.cssVar('--sv-inset-top')).toBe('0px');
  });
});

describe('failure modes', () => {
  const echo = (options?: Parameters<Sdk['request']>[2]) => sdk.request('demo.echo', {}, options);

  it('denied: rejects at once with code denied', async () => {
    const h = host({ preset: 'granted', failureModes: { 'demo.echo': 'denied' } });
    h.install();

    await expect(echo()).rejects.toMatchObject({ name: 'MiniappError', code: 'denied' });
    expect(h.log.at(-1)).toMatchObject({ from: 'host', event: 'response', data: { ok: false, error: { code: 'denied' } } });
  });

  it('failed: rejects at once with code failed', async () => {
    host({ preset: 'granted', failureModes: { 'demo.echo': 'failed' } }).install();

    await expect(echo()).rejects.toMatchObject({ code: 'failed' });
  });

  it('timeout: nothing answers, so the request times out by its own clock', async () => {
    vi.useFakeTimers();
    const h = host({ preset: 'granted', failureModes: { 'demo.echo': 'timeout' } });
    h.install();
    const outcome = echo({ timeoutMs: 200 }).catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(199);
    expect(h.log.some((entry) => entry.from === 'host')).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await outcome).toMatchObject({ code: 'timeout' });
  });

  it('{slowMs}: answers after that long, and not before', async () => {
    vi.useFakeTimers();
    host({ preset: 'granted', failureModes: { 'demo.echo': { slowMs: 300 } } }).install();
    const settled = vi.fn();
    const outcome = echo().then(settled);

    await vi.advanceTimersByTimeAsync(299);
    expect(settled).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await outcome;
    expect(settled).toHaveBeenCalledWith(null);
  });

  it('changes only the method it names', async () => {
    host({ preset: 'granted', capabilities: ['demo.echo', 'demo.other'], failureModes: { 'demo.echo': 'denied' } }).install();

    await expect(echo()).rejects.toMatchObject({ code: 'denied' });
    await expect(sdk.request('demo.other')).resolves.toBeNull();
  });

  it('a named method joins the capabilities, where trunk rejected it as unsupported', async () => {
    host({ preset: 'granted' }).install();
    await expect(echo()).rejects.toMatchObject({ code: 'unsupported' });

    vi.resetModules();
    win = new EventTarget() as Page;
    vi.stubGlobal('window', win);
    sdk = await import('../src');
    testing = await import('../src/testing');
    host({ preset: 'granted', failureModes: { 'demo.echo': 'denied' } }).install();

    expect(capabilities()).toContain('demo.echo');
    await expect(echo()).rejects.toMatchObject({ code: 'denied' });
  });

  it('a granted request with no mode resolves null', async () => {
    host({ capabilities: ['demo.echo'] }).install();

    await expect(echo()).resolves.toBeNull();
  });
});

describe('use and resetHandlers', () => {
  const echo = () => sdk.request('demo.echo');

  it('use without once keeps answering until resetHandlers', async () => {
    const h = host({ preset: 'granted', failureModes: { 'demo.echo': 'denied' } });
    h.install();
    h.use({ 'demo.echo': 'failed' });

    await expect(echo()).rejects.toMatchObject({ code: 'failed' });
    await expect(echo()).rejects.toMatchObject({ code: 'failed' });
    h.resetHandlers();
    await expect(echo()).rejects.toMatchObject({ code: 'denied' });
  });

  it('use with once answers the next request only, then the base mode comes back', async () => {
    const h = host({ preset: 'granted', failureModes: { 'demo.echo': 'denied' } });
    h.install();
    h.use({ 'demo.echo': 'failed' }, { once: true });

    await expect(echo()).rejects.toMatchObject({ code: 'failed' });
    await expect(echo()).rejects.toMatchObject({ code: 'denied' });
  });

  it('use once on a method with no base mode lets the second request resolve', async () => {
    const h = host({ preset: 'granted' });
    h.use({ 'demo.echo': 'failed' }, { once: true });
    h.install();

    await expect(echo()).rejects.toMatchObject({ code: 'failed' });
    await expect(echo()).resolves.toBeNull();
  });

  it('the newest override wins, and a spent once override falls back to the one under it', async () => {
    const h = host({ preset: 'granted' });
    h.use({ 'demo.echo': 'denied' });
    h.use({ 'demo.echo': 'failed' }, { once: true });
    h.install();

    await expect(echo()).rejects.toMatchObject({ code: 'failed' });
    await expect(echo()).rejects.toMatchObject({ code: 'denied' });
  });

  it('resetHandlers drops a once override that no request used', async () => {
    const h = host({ preset: 'granted', capabilities: ['demo.echo'] });
    h.install();
    h.use({ 'demo.echo': 'denied' }, { once: true });
    h.resetHandlers();

    await expect(echo()).resolves.toBeNull();
  });

  it('use before install grants the method, and after install it refuses one the host does not grant', () => {
    const before = host({ preset: 'nothing-granted' });
    before.use({ 'demo.echo': 'denied' });
    before.install();
    expect(capabilities()).toEqual(['demo.echo']);

    const after = host({ preset: 'nothing-granted' });
    after.install();
    expect(() => after.use({ 'demo.nope': 'denied' })).toThrow(/demo\.nope is not granted/);
  });
});

describe('dispose', () => {
  const echo = () => sdk.request('demo.echo');

  it('cancels a delayed install and a delayed game.init', async () => {
    vi.useFakeTimers();
    const late = host({ preset: 'late-host' });
    late.install();
    late.dispose();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(late.installed).toBe(false);
    expect(win.skkuverse).toBeUndefined();
  });

  it('cancels a game.init that is still on its way', async () => {
    vi.useFakeTimers();
    const onInit = vi.fn();
    const h = host({ preset: 'slow-init' });
    h.install();
    boot({ onInit });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.methods()).toEqual(['game.ready']);

    h.dispose();
    await vi.advanceTimersByTimeAsync(5_000);

    expect(onInit).not.toHaveBeenCalled();
    expect(h.log.some((entry) => entry.from === 'host')).toBe(false);
  });

  it('cancels a slowMs answer that is still on its way', async () => {
    vi.useFakeTimers();
    const h = host({ capabilities: ['demo.echo'], failureModes: { 'demo.echo': { slowMs: 1_000 } } });
    h.install();
    void echo().catch(() => {});
    expect(h.methods()).toEqual(['demo.echo']);

    h.dispose();
    await vi.advanceTimersByTimeAsync(5_000);

    expect(h.log.some((entry) => entry.from === 'host' && entry.event === 'response')).toBe(false);
  });

  it('cancels an answer that waits on a microtask', async () => {
    const h = host({ capabilities: ['demo.echo'] });
    h.install();
    void echo().catch(() => {});
    expect(h.methods()).toEqual(['demo.echo']);

    h.dispose();
    await h.flush();

    expect(h.log.some((entry) => entry.from === 'host')).toBe(false);
  });
});

describe('delay validation', () => {
  const bad = [Number.NaN, -1, 2 ** 31, -Infinity];

  it.each(bad)('rejects %s for every delay, naming the field', (value) => {
    expect(() => testing.createFakeHost({ hostDelayMs: value })).toThrow(/hostDelayMs/);
    expect(() => testing.createFakeHost({ initDelayMs: value })).toThrow(/initDelayMs/);
    expect(() => testing.createFakeHost({ failureModes: { 'demo.echo': { slowMs: value } } })).toThrow(/slowMs/);
    const h = host({ capabilities: ['demo.echo'] });
    expect(() => h.use({ 'demo.echo': { slowMs: value } })).toThrow(/slowMs/);
  });

  it('throws a RangeError, and 2147483647 is still allowed', () => {
    expect(() => testing.createFakeHost({ initDelayMs: -Infinity })).toThrow(RangeError);
    expect(() => testing.createFakeHost({ initDelayMs: 2 ** 31 - 1, hostDelayMs: 2 ** 31 - 1 })).not.toThrow();
  });

  it('use() throws before it records anything', async () => {
    const h = host({ capabilities: ['demo.echo'] });
    expect(() => h.use({ 'demo.echo': { slowMs: Number.NaN } })).toThrow(RangeError);
    h.install();

    await expect(sdk.request('demo.echo')).resolves.toBeNull();
  });

  it('Infinity means never, for hostDelayMs, initDelayMs and slowMs', async () => {
    vi.useFakeTimers();
    const onInit = vi.fn();
    const never = host({ capabilities: ['demo.echo'], hostDelayMs: Infinity });
    never.install();
    await vi.advanceTimersByTimeAsync(2 ** 31);
    expect(never.installed).toBe(false);

    const noInit = host({ capabilities: ['demo.echo', 'game.ready'], initDelayMs: Infinity });
    noInit.install();
    boot({ onInit });
    await vi.advanceTimersByTimeAsync(2 ** 31);
    expect(noInit.log.some((entry) => entry.from === 'host')).toBe(false);
    expect(onInit).not.toHaveBeenCalled();
  });

  it('slowMs Infinity never answers', async () => {
    vi.useFakeTimers();
    const h = host({ capabilities: ['demo.echo'], failureModes: { 'demo.echo': { slowMs: Infinity } } });
    h.install();
    const settled = vi.fn();
    void sdk.request('demo.echo', {}, { timeoutMs: 10_000 }).then(settled, settled);
    await vi.advanceTimersByTimeAsync(9_999);

    expect(h.log.some((entry) => entry.from === 'host')).toBe(false);
    expect(settled).not.toHaveBeenCalled();
  });
});

describe('preset data', () => {
  it('nothing-granted and old-host stand on the iPhone viewport', () => {
    expect(testing.resolvePreset('nothing-granted').viewport).toEqual(testing.IPHONE_VIEWPORT);
    for (const version of Object.keys(testing.HOST_METHODS_ADDED)) {
      expect(testing.resolvePreset(`old-host:${version}` as never).viewport).toEqual(testing.IPHONE_VIEWPORT);
    }
  });

  it('oldHostCapabilities throws for a version it does not know', () => {
    expect(() => testing.oldHostCapabilities('9.9.9' as never)).toThrow(/9\.9\.9/);
    expect(() => testing.oldHostCapabilities('toString' as never)).toThrow();
  });
});
