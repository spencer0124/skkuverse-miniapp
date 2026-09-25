import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canOpenMap,
  getCapabilities,
  handleLinkClick,
  haptic,
  openMapPlace,
  openUrl,
  postToApp,
} from '../src';
import type { HostBridgeGlobal } from '../src/protocol';

// No DOM here: each case builds the slice of `window` it needs, the way the
// app's WebView or a plain browser would present it.
function inBrowser() {
  const open = vi.fn();
  vi.stubGlobal('window', { open });
  return { open };
}

function inApp(bridge?: HostBridgeGlobal) {
  const sent: unknown[] = [];
  vi.stubGlobal('window', {
    ReactNativeWebView: { postMessage: (s: string) => sent.push(JSON.parse(s)) },
    skkuverse: bridge ? { bridge } : undefined,
    open: vi.fn(),
  });
  return { sent };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getCapabilities', () => {
  it('grants nothing in a plain browser', () => {
    inBrowser();
    expect(getCapabilities()).toEqual({ inApp: false, protocol: 0, capabilities: new Set() });
  });

  it('derives v1 capabilities from the channel and bridge.actions', () => {
    inApp({ actions: ['map', 'miniapp'] });
    const info = getCapabilities();
    expect(info.protocol).toBe(1);
    expect([...info.capabilities].sort()).toEqual(['action.map', 'action.miniapp', 'haptic', 'openUrl']);
  });

  it('treats an app build without the injected bridge as v1 with no actions', () => {
    inApp();
    expect([...getCapabilities().capabilities].sort()).toEqual(['haptic', 'openUrl']);
    expect(canOpenMap()).toBe(false);
  });

  it('takes a v2 host at its word', () => {
    inApp({ protocol: 2, capabilities: ['haptic', 'ads.rewarded'], actions: ['map'] });
    const info = getCapabilities();
    expect(info.protocol).toBe(2);
    expect([...info.capabilities].sort()).toEqual(['ads.rewarded', 'haptic']);
  });
});

describe('messages', () => {
  it('sends nothing outside the app', () => {
    inBrowser();
    expect(() => postToApp({ type: 'web:ready' })).not.toThrow();
    expect(() => haptic('light')).not.toThrow();
  });

  it('sends the v1 wire shapes the app parses', () => {
    const { sent } = inApp({ actions: ['map'] });
    haptic('heavy');
    openMapPlace('event:42');
    openUrl('https://open.spotify.com/track/x', { appUrl: 'spotify:track:x' });
    openUrl('https://example.com');
    expect(sent).toEqual([
      { type: 'web:haptic', style: 'heavy' },
      { type: 'web:action', actionType: 'map', actionValue: 'event:42' },
      { type: 'web:open-url', url: 'https://open.spotify.com/track/x', appUrl: 'spotify:track:x' },
      { type: 'web:open-url', url: 'https://example.com' },
    ]);
  });

  it('vibrates in a browser only when asked', () => {
    const vibrate = vi.fn();
    inBrowser();
    vi.stubGlobal('navigator', { vibrate });
    haptic('heavy');
    haptic('heavy', { vibrate: 40 });
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(40);
  });

  it('opens a new tab outside the app', () => {
    const { open } = inBrowser();
    openUrl('https://example.com');
    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });

  it('lets an anchor do its own work outside the app', () => {
    inBrowser();
    const preventDefault = vi.fn();
    handleLinkClick({ preventDefault }, 'https://example.com');
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('takes over an anchor inside the app', () => {
    const { sent } = inApp();
    const preventDefault = vi.fn();
    handleLinkClick({ preventDefault }, 'https://example.com');
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(sent).toEqual([{ type: 'web:open-url', url: 'https://example.com' }]);
  });
});
