import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { MiniappRoot } from '@skkuverse/miniapp/react';
import { SDSProvider } from '@skkuverse/ui';
import Home from './Home';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('the ESKARA home in a plain browser', () => {
  it('sends nothing and opens nothing when a row is tapped, and leaves out the map row', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const container = document.createElement('div');
    document.body.append(container);
    await act(async () => {
      createRoot(container).render(
        <MiniappRoot id="eskara-2026" browser="allow">
          <SDSProvider>
            <Home />
          </SDSProvider>
        </MiniappRoot>,
      );
    });
    const buttons = [...container.querySelectorAll<HTMLButtonElement>('button')];
    expect(buttons.some((b) => b.textContent?.includes('지도') || b.textContent?.includes('위치'))).toBe(false); // conventions:allow-korean
    for (const button of buttons) await act(async () => button.click());
    expect(open).not.toHaveBeenCalled();
    expect((window as { ReactNativeWebView?: unknown }).ReactNativeWebView).toBeUndefined();
  });
});
