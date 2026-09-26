import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SHELL,
  parseManifest,
  parseMessage,
  parseShellPatch,
  sameViewport,
  viewportCssVars,
  ZERO_VIEWPORT,
} from '../src/protocol';

const msg = (value: unknown) => parseMessage(JSON.stringify(value));

describe('parseMessage', () => {
  it('accepts every notification with valid params', () => {
    expect(msg({ method: 'haptic.impact', params: { style: 'light' } })).toEqual({
      method: 'haptic.impact',
      params: { style: 'light' },
    });
    expect(msg({ method: 'link.open', params: { url: 'https://x.dev', appUrl: 'spotify:track:1' } })).not.toBeNull();
    expect(msg({ method: 'map.openPlace', params: { place: 'event:42' } })).not.toBeNull();
    expect(msg({ method: 'miniapp.open', params: { target: 'mukja' } })).not.toBeNull();
    expect(msg({ method: 'share.open', params: { url: 'https://skkuverse.com/p/m/x', text: 'hi' } })).toEqual({
      method: 'share.open',
      params: { url: 'https://skkuverse.com/p/m/x', text: 'hi' },
    });
    expect(msg({ method: 'analytics.track', params: { event: 'spin' } })).not.toBeNull();
    expect(msg({ method: 'app.ready' })).toEqual({ method: 'app.ready', params: {} });
    expect(msg({ method: 'shell.set', params: { statusBar: 'light' } })).toEqual({
      method: 'shell.set',
      params: { statusBar: 'light' },
    });
  });

  it('keeps only validated params', () => {
    expect(msg({ method: 'haptic.impact', params: { style: 'light', extra: 1 } })).toEqual({
      method: 'haptic.impact',
      params: { style: 'light' },
    });
  });

  it('drops malformed or unknown notifications', () => {
    expect(parseMessage('not json')).toBeNull();
    expect(parseMessage(42)).toBeNull();
    expect(msg({ method: 'web:haptic', style: 'light' })).toBeNull();
    expect(msg({ method: 'haptic.impact', params: { style: 'huge' } })).toBeNull();
    expect(msg({ method: 'link.open', params: { url: 'javascript:alert(1)' } })).toBeNull();
    expect(msg({ method: 'shell.set', params: { bar: 'top' } })).toBeNull();
    expect(msg({ method: 'map.openPlace', params: [] })).toBeNull();
    expect(msg({ method: 'share.open', params: { url: 'skkuverse:///m/x' } })).toBeNull();
    expect(msg({ method: 'share.open', params: { url: 'https://x.dev', text: '' } })).toBeNull();
    expect(msg({ method: 'toString' })).toBeNull();
    expect(parseMessage('x'.repeat(5000))).toBeNull();
  });

  it('returns requests whatever their method, so the app can answer unsupported', () => {
    expect(msg({ id: 'r1-abc', method: 'ads.showRewarded', params: {} })).toEqual({
      id: 'r1-abc',
      method: 'ads.showRewarded',
      params: {},
    });
    expect(msg({ id: 'bad id!', method: 'x' })).toBeNull();
  });
});

describe('manifest', () => {
  it('fills defaults and drops invalid fields', () => {
    expect(parseManifest(null)).toEqual({ shell: DEFAULT_SHELL });
    expect(
      parseManifest({ shell: { bar: 'top', header: 'sideways', statusBar: 'light', background: '#0a0b0c', x: 1 } }),
    ).toEqual({ shell: { ...DEFAULT_SHELL, bar: 'top', statusBar: 'light', background: '#0A0B0C' } });
  });

  it('lets shell.set change presentation but not layout', () => {
    expect(parseShellPatch({ header: 'overlay', bar: 'none' })).toEqual({ header: 'overlay' });
    expect(parseShellPatch({ bar: 'none' })).toBeNull();
  });
});

describe('viewport', () => {
  it('sums safe and content insets into --sv-inset-*', () => {
    const vars = viewportCssVars({
      safeArea: { top: 47, bottom: 34, left: 0, right: 0 },
      contentSafeArea: { top: 44, bottom: 66, left: 0, right: 0 },
      chrome: 'glass',
    });
    expect(vars['--sv-safe-top']).toBe('47px');
    expect(vars['--sv-content-top']).toBe('44px');
    expect(vars['--sv-inset-top']).toBe('91px');
    expect(vars['--sv-inset-bottom']).toBe('100px');
  });

  it('compares by value', () => {
    expect(sameViewport(ZERO_VIEWPORT, JSON.parse(JSON.stringify(ZERO_VIEWPORT)))).toBe(true);
    expect(sameViewport(ZERO_VIEWPORT, { ...ZERO_VIEWPORT, chrome: 'glass' })).toBe(false);
  });
});
