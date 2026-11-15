import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GAME_NOTIFY_METHODS, MESSAGE_EVENT, NOTIFY_METHODS } from '@skkuverse/miniapp/protocol';
import type { HostPresetName } from '@skkuverse/miniapp/testing';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { skkuverseDevHost } from '../src';
import { hostScript, readHostEntry, resolveHostConfig } from '../src/script';
import { formatLogLine, type DevHostConfig } from '../src/shared';

type Page = EventTarget & {
  skkuverse?: { protocol: number; capabilities: string[]; getViewport(): { safeArea: { top: number } } };
  ReactNativeWebView?: { postMessage(message: string): void };
};

let win: Page;
let css: Map<string, string>;
let lines: string[];
let events: { event: string; data: unknown }[];

function boot(config: DevHostConfig): void {
  const document = {
    documentElement: {
      style: { setProperty: (name: string, value: string) => css.set(name, value), getPropertyValue: (name: string) => css.get(name) ?? '' },
      setAttribute: () => {},
    },
  };
  const console = { info: (line: string) => lines.push(line) };
  new Function('window', 'document', 'console', hostScript(config, readHostEntry(), { hot: false }))(win, document, console);
}

/** A public folder with a manifest makes a miniapp page. Without one the page is a game. */
const miniappPublic = mkdtempSync(join(tmpdir(), 'vite-plugin-miniapp-public-'));
writeFileSync(join(miniappPublic, 'skkuverse.json'), JSON.stringify({ shell: { header: 'overlay' } }));
afterAll(() => rmSync(miniappPublic, { recursive: true, force: true }));

const config = (preset: HostPresetName, over: Partial<DevHostConfig> = {}): DevHostConfig => ({
  ...resolveHostConfig(preset, miniappPublic),
  ...over,
});
const gameConfig = (preset: HostPresetName): DevHostConfig => resolveHostConfig(preset, false);

/** The host answers on a microtask, as the app answers through `injectJavaScript`. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const post = (message: unknown) => win.ReactNativeWebView!.postMessage(JSON.stringify(message));

beforeEach(() => {
  win = new EventTarget() as Page;
  css = new Map();
  lines = [];
  events = [];
  win.addEventListener(MESSAGE_EVENT, (e) => events.push((e as CustomEvent).detail));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the page-side host', () => {
  it('installs the app host before the page runs, with the preset granted', () => {
    boot(config('granted'));
    expect(win.skkuverse?.protocol).toBe(1);
    expect(win.skkuverse?.capabilities).toEqual([...NOTIFY_METHODS]);
    expect(win.ReactNativeWebView).toBeDefined();
    expect(css.get('--sv-inset-top')).toBe('91px');
  });

  it('grants a game page only the game methods, as the app grants a game origin', () => {
    boot(gameConfig('granted'));
    expect(win.skkuverse?.capabilities).toEqual([...GAME_NOTIFY_METHODS]);
    expect(() => post({ method: 'haptic.impact', params: { style: 'light' } })).toThrow('haptic.impact is not granted by the preset "granted"');
    expect(() => post({ method: 'game.haptic', params: { style: 'light' } })).not.toThrow();
  });

  it('grants a miniapp page no game method', () => {
    boot(config('granted'));
    expect(() => post({ method: 'game.ready', params: {} })).toThrow('game.ready is not granted by the preset "granted"');
  });

  it('prints one line for each message the page posts', () => {
    boot(config('granted'));
    post({ method: 'haptic.impact', params: { style: 'light' } });
    expect(lines).toContain('[skkuverse] page -> host haptic.impact {"style":"light"}');
  });

  it('throws for a method it does not handle, naming it', () => {
    boot(config('granted'));
    expect(() => post({ method: 'nope.nothing', params: {} })).toThrow('[skkuverse dev host] nope.nothing is not handled');
    expect(lines).toContain('[skkuverse] page -> host nope.nothing (dropped) {}');
  });

  it('throws for a known method whose params the app would drop', () => {
    boot(config('granted'));
    expect(() => post({ method: 'haptic.impact', params: { style: 'huge' } })).toThrow('haptic.impact was dropped');
  });

  it('throws for text that is not a message', () => {
    boot(config('granted'));
    expect(() => win.ReactNativeWebView!.postMessage('hello')).toThrow('not a { method, params } object');
  });

  it('throws for a method the preset does not grant', () => {
    boot(config('nothing-granted'));
    expect(() => post({ method: 'share.open', params: { url: 'https://example.com' } })).toThrow('share.open is not granted by the preset "nothing-granted"');
  });

  it('answers a request it cannot handle with unsupported, as the app does', async () => {
    boot(config('granted'));
    post({ id: 'r1', method: 'demo.echo', params: {} });
    expect(events).toEqual([]);
    await settle();
    expect(events).toEqual([{ id: 'r1', ok: false, error: { code: 'unsupported', message: 'demo.echo is not handled by the dev host' } }]);
  });

  it('answers shell.set with viewport.changed and moves the CSS variable', async () => {
    boot(config('granted'));
    post({ method: 'shell.set', params: { header: 'opaque' } });
    await settle();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ event: 'viewport.changed', data: { safeArea: { top: 0 }, contentSafeArea: { top: 0 } } });
    expect(css.get('--sv-inset-top')).toBe('0px');
    post({ method: 'shell.set', params: { header: 'overlay' } });
    await settle();
    expect(css.get('--sv-inset-top')).toBe('91px');
    post({ method: 'shell.set', params: { statusBar: 'light' } });
    await settle();
    expect(events).toHaveLength(2);
  });

  it('answers after postMessage returns, so a listener added right after the post still hears it', async () => {
    // React runs a child's effect before its parent's: a child's setShell posts before the parent's useViewport subscribes.
    boot(config('granted'));
    post({ method: 'shell.set', params: { header: 'opaque' } });
    const heard: unknown[] = [];
    win.addEventListener(MESSAGE_EVENT, (e) => heard.push((e as CustomEvent).detail));
    expect(heard).toEqual([]);
    await settle();
    expect(heard).toEqual([expect.objectContaining({ event: 'viewport.changed' })]);
  });

  it('starts a miniapp whose manifest says opaque below the header, as the app does', () => {
    boot(config('granted', { header: 'opaque' }));
    expect(css.get('--sv-inset-top')).toBe('0px');
  });

  it('answers game.ready with game.init', async () => {
    vi.useFakeTimers();
    boot(gameConfig('granted'));
    post({ method: 'game.ready', params: {} });
    await vi.advanceTimersByTimeAsync(0);
    expect(events).toEqual([{ event: 'game.init', data: { gameProtocol: 1, hi: 0, sound: true } }]);
    expect(lines).toContain('[skkuverse] host -> page game.init {"gameProtocol":1,"hi":0,"sound":true}');
  });

  it('holds game.init back under slow-init', async () => {
    vi.useFakeTimers();
    boot(gameConfig('slow-init'));
    post({ method: 'game.ready', params: {} });
    await vi.advanceTimersByTimeAsync(1999);
    expect(events).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(events).toHaveLength(1);
  });

  it('installs a late host only after its delay, and never installs no-host', async () => {
    vi.useFakeTimers();
    boot(config('late-host'));
    expect(win.skkuverse).toBeUndefined();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(win.skkuverse?.protocol).toBe(1);

    win = new EventTarget() as Page;
    boot(config('no-host'));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(win.skkuverse).toBeUndefined();
    expect(lines.at(-1)).toContain('preset no-host never installs one');
  });

  it('stays out of the way of a host the app already installed', () => {
    win.skkuverse = { protocol: 1, capabilities: [], getViewport: () => ({ safeArea: { top: 0 } }) };
    boot(config('granted'));
    expect(win.ReactNativeWebView).toBeUndefined();
    expect(lines.at(-1)).toContain('already installed');
  });
});

describe('the plugin', () => {
  it('prints no terminal control character the page sends, in the method or the params', () => {
    const line = formatLogLine({ dir: 'page', name: 'a\u001b[2Jb\u009b31m', data: { s: 'x\u007f\u009b2J\u0085y' } });
    expect(line).toBe('[skkuverse] page -> host a?[2Jb?31m {"s":"x??2J?y"}');
    expect(line).not.toMatch(/[\u0000-\u001f\u007f-\u009f]/);
  });

  it('reads the starting header from the manifest in the public folder', () => {
    const publicDir = mkdtempSync(join(tmpdir(), 'vite-plugin-public-'));
    try {
      expect(resolveHostConfig('granted', publicDir).header).toBe('overlay');
      writeFileSync(join(publicDir, 'skkuverse.json'), JSON.stringify({ shell: { header: 'overlay' } }));
      expect(resolveHostConfig('granted', publicDir).header).toBe('overlay');
      writeFileSync(join(publicDir, 'skkuverse.json'), JSON.stringify({ shell: { bar: 'top' } }));
      expect(resolveHostConfig('granted', publicDir).header).toBe('opaque');
    } finally {
      rmSync(publicDir, { recursive: true, force: true });
    }
  });

  it('takes SKKUVERSE_PRESET in a dev server and ignores it in a build', () => {
    vi.stubEnv('SKKUVERSE_PRESET', 'nothing-granted');
    const presetOf = (command: 'serve' | 'build') => {
      const plugin = skkuverseDevHost({ preset: 'old-host:0.2.1' });
      (plugin.configResolved as (config: unknown) => void)({ command, publicDir: false, base: '/' });
      const source = (plugin.load as (id: string) => string)('\0virtual:skkuverse-dev-host');
      return /"preset":"([^"]+)"/.exec(source)?.[1];
    };
    try {
      expect(presetOf('serve')).toBe('nothing-granted');
      expect(presetOf('build')).toBe('old-host:0.2.1');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('writes the characters that could end a script as escapes', () => {
    const script = hostScript({ ...config('granted'), preset: '</script>\u2028x' }, '', { hot: false });
    expect(script).not.toMatch(/[<\u2028]\/?script|\u2028/);
    expect(script).toContain('\\u003c\\u002fscript\\u003e\\u2028x');
  });

  it('throws for a preset it does not know, naming the known ones', () => {
    expect(() => resolveHostConfig('nope' as HostPresetName, false)).toThrow(/unknown host preset "nope"/);
  });
});
