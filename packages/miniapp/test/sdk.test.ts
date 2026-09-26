import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canOpenMap,
  getCapabilities,
  getViewport,
  handleLinkClick,
  haptic,
  MiniappError,
  onViewportChange,
  openMapPlace,
  openUrl,
  request,
  setShell,
  share,
} from '../src';
import { MESSAGE_EVENT, ZERO_VIEWPORT, type HostMessage, type Viewport } from '../src/protocol';

// One window for the whole file: the transport attaches its listener once.
// Each case sets up the slice the app or a browser would present.
const win = Object.assign(new EventTarget(), {} as Record<string, unknown>);
vi.stubGlobal('window', win);

let sent: Record<string, unknown>[] = [];
const VIEWPORT: Viewport = {
  safeArea: { top: 47, bottom: 34, left: 0, right: 0 },
  contentSafeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  chrome: 'glass',
};

function inApp(capabilities: string[]) {
  win.ReactNativeWebView = { postMessage: (s: string) => sent.push(JSON.parse(s)) };
  win.skkuverse = {
    protocol: 1,
    capabilities,
    getViewport: () => VIEWPORT,
    receive: (json: string) => win.dispatchEvent(new CustomEvent(MESSAGE_EVENT, { detail: JSON.parse(json) })),
  };
}

function inBrowser() {
  delete win.ReactNativeWebView;
  delete win.skkuverse;
  win.open = vi.fn();
}

function deliver(message: HostMessage) {
  (win.skkuverse as { receive(json: string): void }).receive(JSON.stringify(message));
}

beforeEach(() => {
  sent = [];
  inBrowser();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('capabilities', () => {
  it('grants nothing in a browser', () => {
    expect(getCapabilities()).toEqual({ inApp: false, protocol: 0, capabilities: new Set() });
    expect(getViewport()).toEqual(ZERO_VIEWPORT);
  });

  it('reads what the app grants', () => {
    inApp(['haptic.impact', 'map.openPlace']);
    expect(getCapabilities().protocol).toBe(1);
    expect(canOpenMap()).toBe(true);
    expect(getViewport()).toEqual(VIEWPORT);
  });

  it('is not fooled by a lone ReactNativeWebView', () => {
    win.ReactNativeWebView = { postMessage: () => {} };
    expect(getCapabilities().inApp).toBe(false);
  });
});

describe('notifications', () => {
  it('sends only granted methods', () => {
    inApp(['haptic.impact', 'link.open', 'shell.set']);
    haptic('heavy');
    openMapPlace('event:42');
    openUrl('https://open.spotify.com/track/x', { appUrl: 'spotify:track:x' });
    setShell({ statusBar: 'light' });
    expect(sent).toEqual([
      { method: 'haptic.impact', params: { style: 'heavy' } },
      { method: 'link.open', params: { url: 'https://open.spotify.com/track/x', appUrl: 'spotify:track:x' } },
      { method: 'shell.set', params: { statusBar: 'light' } },
    ]);
  });

  it('falls back in a browser', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    haptic('heavy');
    haptic('heavy', { vibrate: 40 });
    expect(vibrate).toHaveBeenCalledTimes(1);
    openUrl('https://example.com');
    expect(win.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    const preventDefault = vi.fn();
    handleLinkClick({ preventDefault }, 'https://example.com');
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('takes over a link inside the app', () => {
    inApp(['link.open']);
    const preventDefault = vi.fn();
    handleLinkClick({ preventDefault }, 'https://example.com');
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(sent).toEqual([{ method: 'link.open', params: { url: 'https://example.com' } }]);
  });
});

describe('requests', () => {
  it('rejects unsupported outside the app or without a grant', async () => {
    await expect(request('ads.showRewarded')).rejects.toMatchObject({ code: 'unsupported' });
    inApp([]);
    await expect(request('ads.showRewarded')).rejects.toBeInstanceOf(MiniappError);
  });

  it('pairs a response with its request by id', async () => {
    inApp(['demo.echo']);
    const a = request<string>('demo.echo', { n: 1 });
    const b = request<string>('demo.echo', { n: 2 });
    const [first, second] = sent as { id: string }[];
    deliver({ id: second!.id, ok: true, result: 'two' });
    deliver({ id: first!.id, ok: false, error: { code: 'denied', message: 'no' } });
    await expect(b).resolves.toBe('two');
    await expect(a).rejects.toMatchObject({ code: 'denied' });
  });

  it('times out', async () => {
    vi.useFakeTimers();
    inApp(['demo.echo']);
    const p = request('demo.echo', {}, { timeoutMs: 50 });
    vi.advanceTimersByTime(60);
    await expect(p).rejects.toMatchObject({ code: 'timeout' });
  });
});

describe('events', () => {
  it('delivers viewport changes to subscribers', () => {
    inApp([]);
    const seen: Viewport[] = [];
    const off = onViewportChange((v) => seen.push(v));
    const next = { ...VIEWPORT, chrome: 'opaque' as const };
    deliver({ event: 'viewport.changed', data: next });
    off();
    deliver({ event: 'viewport.changed', data: VIEWPORT });
    expect(seen).toEqual([next]);
  });
});

describe('share', () => {
  const link = { url: 'https://skkuverse.com/p/m/booth-box/r/a', text: '뽑혔어요' };

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('window', win);
  });

  it('asks the app for its sheet when granted', async () => {
    inApp(['share.open']);
    await expect(share(link)).resolves.toBe('shared');
    expect(sent).toEqual([{ method: 'share.open', params: link }]);
  });

  it("uses the browser's sheet, and reports a dismissal", async () => {
    const nav = { share: vi.fn().mockResolvedValueOnce(undefined), clipboard: { writeText: vi.fn() } };
    vi.stubGlobal('navigator', nav);
    await expect(share(link)).resolves.toBe('shared');
    expect(nav.share).toHaveBeenCalledWith(link);
    nav.share.mockRejectedValueOnce(Object.assign(new Error('no'), { name: 'AbortError' }));
    await expect(share(link)).resolves.toBe('cancelled');
    expect(nav.clipboard.writeText).not.toHaveBeenCalled();
    expect(sent).toEqual([]);
  });

  it('copies when there is no sheet, or the sheet refuses', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await expect(share(link)).resolves.toBe('copied');
    expect(writeText).toHaveBeenLastCalledWith(`${link.text}\n${link.url}`);

    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'NotAllowedError' })),
      clipboard: { writeText },
    });
    await expect(share({ url: link.url })).resolves.toBe('copied');
    expect(writeText).toHaveBeenLastCalledWith(link.url);
  });

  it('fails what the app would drop, and drops an empty message', async () => {
    inApp(['share.open']);
    await expect(share({ url: 'skkuverse:///m/x' })).resolves.toBe('failed');
    await expect(share({ url: link.url, text: 'x'.repeat(513) })).resolves.toBe('failed');
    await expect(share({ url: link.url, text: '' })).resolves.toBe('shared');
    expect(sent).toEqual([{ method: 'share.open', params: { url: link.url } }]);
  });

  it('fails when nothing works', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    await expect(share(link)).resolves.toBe('failed');
  });
});
