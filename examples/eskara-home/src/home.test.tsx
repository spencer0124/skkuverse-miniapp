import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MiniappRoot } from '@skkuverse/miniapp/react';
import { NOTIFY_METHODS } from '@skkuverse/miniapp/protocol';
import { createFakeHost } from '@skkuverse/miniapp/testing';
import { SDSProvider } from '@skkuverse/ui';
import Home from './Home';
import { ARCHIVE_NOTICE, ROWS } from './festival';
import { sheetFor } from './panel';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('the ESKARA home on the fake host', () => {
  const host = createFakeHost({ capabilities: NOTIFY_METHODS });
  let root: Root;
  let container: HTMLElement;

  beforeAll(async () => {
    host.install();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => {
      root.render(
        <MiniappRoot id="eskara-2026" browser="allow">
          <SDSProvider>
            <Home />
          </SDSProvider>
        </MiniappRoot>,
      );
    });
  });

  afterAll(() => act(() => root.unmount()));

  const buttons = () => [...container.querySelectorAll<HTMLButtonElement>('button')];
  const tap = async (title: string) => {
    const button = buttons().find((b) => b.textContent?.includes(title));
    if (!button) throw new Error(`no row titled ${title}`);
    const before = host.messages.length;
    await act(async () => button.click());
    return host.messages.slice(before);
  };

  it('shows the archive notice, the lineup strip and every row', () => {
    expect(container.textContent).toContain(ARCHIVE_NOTICE);
    expect(container.querySelector('.eskara-marquee-viewport')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(buttons().map((b) => b.textContent)).toEqual(ROWS.map((row) => expect.stringContaining(row.title)));
  });

  it.each(ROWS)('sends a haptic tap and then the action when the $title row is tapped', async (row) => {
    const sent = await tap(row.title);
    expect(sent.map((m) => m?.method)).toEqual(['haptic.impact', row.action.kind === 'page' ? 'link.open' : 'map.openPlace']);
    expect(sent[0]?.params).toEqual({ style: 'light' });
    expect(sent[1]?.params).toEqual(row.action.kind === 'page' ? { url: row.action.url } : { place: row.action.place });
  });

  it('gives the panel a sheet titled with the row for each action it sent', () => {
    for (const row of ROWS) {
      const params = row.action.kind === 'page' ? { url: row.action.url } : { place: row.action.place };
      const method = row.action.kind === 'page' ? 'link.open' : 'map.openPlace';
      expect(sheetFor({ direction: 'page-to-app', method, params, at: 0 })?.title).toBe(row.title);
    }
    expect(sheetFor({ direction: 'page-to-app', method: 'link.open', params: { url: 'https://example.com' }, at: 0 })).toBeNull();
  });
});
