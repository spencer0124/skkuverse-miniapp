import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountHostPanel, toPanelEntry, type LogEntry, type PanelHandle, type PanelHost } from './host-panel';

describe('host panel', () => {
  let log: LogEntry[];
  let host: PanelHost;
  let frame: HTMLElement;
  let panel: HTMLElement;
  let handle: PanelHandle;

  beforeEach(() => {
    vi.useFakeTimers();
    log = [];
    host = { log, pause: vi.fn(), resume: vi.fn() };
    frame = document.createElement('div');
    panel = document.createElement('div');
    handle = mountHostPanel({ frame, panel, host });
  });

  afterEach(() => {
    handle.dispose();
    vi.useRealTimers();
  });

  it('renders the raw name of a method it has no note for', () => {
    log.push({ from: 'page', raw: '{}', message: { method: 'vendor.unheard-of', params: { a: 1 } } });
    vi.advanceTimersByTime(60);
    const item = panel.querySelector<HTMLElement>('.hp-entry')!;
    expect(item.dataset.method).toBe('vendor.unheard-of');
    expect(item.querySelector('.hp-method')!.textContent).toBe('vendor.unheard-of');
    expect(item.querySelector('.hp-note')).toBeNull();
    expect(item.textContent).toContain('{"a":1}');
  });

  it('renders an entry from the host with the direction app-to-page', () => {
    log.push({ from: 'host', event: 'game.restart', data: {} });
    vi.advanceTimersByTime(60);
    const item = panel.querySelector<HTMLElement>('.hp-entry')!;
    expect(item.dataset.direction).toBe('app-to-page');
    expect(item.querySelector('.hp-method')!.textContent).toBe('game.restart');
    expect(item.querySelector('.hp-note')!.textContent).toBe('The app starts a new run.');
  });

  it('shows a page message that did not parse as unparsed, with the raw text', () => {
    expect(toPanelEntry({ from: 'page', raw: 'not json', message: null }, 0)).toMatchObject({
      direction: 'page-to-app',
      method: '(unparsed)',
      params: 'not json',
    });
  });

  it('shows the newest message in the latest bar, and the list keeps them all', () => {
    const bar = panel.querySelector<HTMLElement>('.hp-latest')!;
    expect(bar.hidden).toBe(true);
    log.push({ from: 'page', raw: '{}', message: { method: 'game.ready' } });
    vi.advanceTimersByTime(60);
    log.push({ from: 'page', raw: '{}', message: { method: 'game.over', params: {} } });
    vi.advanceTimersByTime(60);
    expect(bar.hidden).toBe(false);
    expect(bar.dataset.method).toBe('game.over');
    expect(bar.textContent).toBe('page to appgame.over');
    expect(panel.querySelectorAll('.hp-entry')).toHaveLength(2);
  });

  it('calls the host from the pause and resume buttons', () => {
    const [pause, resume] = panel.querySelectorAll<HTMLButtonElement>('.hp-button');
    pause!.click();
    resume!.click();
    expect(host.pause).toHaveBeenCalledTimes(1);
    expect(host.resume).toHaveBeenCalledTimes(1);
  });

  it('draws the sheet an effect asks for, and closes it on the named method', () => {
    handle.dispose();
    const run = vi.fn();
    handle = mountHostPanel({
      frame,
      panel,
      host,
      sheet: () => ({ title: 'Crashed', action: { label: 'Again', run } }),
      closeSheetOn: ['game.restart'],
    });
    log.push({ from: 'page', raw: '{}', message: { method: 'game.over', params: {} } });
    vi.advanceTimersByTime(60);
    expect(frame.querySelector('.hp-sheet-title')!.textContent).toBe('Crashed');
    frame.querySelector<HTMLButtonElement>('.hp-sheet .hp-button')!.click();
    expect(run).toHaveBeenCalledTimes(1);
    log.push({ from: 'host', event: 'game.restart', data: {} });
    vi.advanceTimersByTime(60);
    expect(frame.querySelector('.hp-sheet')).toBeNull();
  });

  it('shakes the frame for a haptic tap', () => {
    log.push({ from: 'page', raw: '{}', message: { method: 'haptic.impact', params: { style: 'light' } } });
    vi.advanceTimersByTime(60);
    expect(frame.classList.contains('hp-shake')).toBe(true);
    vi.advanceTimersByTime(500);
    expect(frame.classList.contains('hp-shake')).toBe(false);
  });

  it('draws a map card for map.openPlace and a plain sheet for link.open, and closes either from its button', () => {
    handle.dispose();
    handle = mountHostPanel({
      frame,
      panel,
      host,
      sheet: (entry) => ({ title: entry.method, detail: JSON.stringify(entry.params), dismiss: 'Close' }),
    });
    log.push({ from: 'page', raw: '{}', message: { method: 'link.open', params: { url: 'https://skkuverse.com/p/m/x' } } });
    vi.advanceTimersByTime(60);
    expect(frame.querySelector('.hp-sheet-title')!.textContent).toBe('link.open');
    expect(frame.querySelector('.hp-map')).toBeNull();

    log.push({ from: 'page', raw: '{}', message: { method: 'map.openPlace', params: { place: 'event:a' } } });
    vi.advanceTimersByTime(60);
    expect(frame.querySelectorAll('.hp-sheet')).toHaveLength(1);
    expect(frame.querySelector('.hp-map')).not.toBeNull();
    expect(frame.querySelector('.hp-sheet-detail')!.textContent).toBe('{"place":"event:a"}');

    frame.querySelector<HTMLButtonElement>('.hp-sheet .hp-button')!.click();
    expect(frame.querySelector('.hp-sheet')).toBeNull();
  });

  it('keeps no more entries than the limit', () => {
    handle.dispose();
    handle = mountHostPanel({ frame, panel, host, maxEntries: 2 });
    for (const event of ['a', 'b', 'c']) log.push({ from: 'host', event, data: null });
    vi.advanceTimersByTime(60);
    expect([...panel.querySelectorAll<HTMLElement>('.hp-entry')].map((i) => i.dataset.method)).toEqual(['b', 'c']);
  });
});
