import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MiniappRoot, useIsInApp } from '../src/react';

// Server rendering needs no DOM. The layout effect that sets CSS variables
// does not run here, which is fine: these cases are about what renders.

function Probe() {
  return <span>{useIsInApp() ? 'in-app' : 'browser'}</span>;
}

function browser(hostname = 'mukja.mini.skkuverse.com') {
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('location', { hostname });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MiniappRoot', () => {
  it('blocks a browser by default, linking to the app', () => {
    browser();
    const html = renderToString(
      <MiniappRoot id="mukja">
        <Probe />
      </MiniappRoot>,
    );
    expect(html).toContain('스꾸버스 앱에서 열기');
    expect(html).toContain('https://skkuverse.com/p/m/mukja');
    expect(html).not.toContain('browser');
  });

  it('renders the miniapp when browsers are allowed', () => {
    browser();
    const html = renderToString(
      <MiniappRoot id="mukja" browser="allow">
        <Probe />
      </MiniappRoot>,
    );
    expect(html).toContain('browser');
    expect(html).not.toContain('스꾸버스 앱에서 열기');
  });

  it('never blocks in development', () => {
    browser('localhost');
    const html = renderToString(
      <MiniappRoot id="mukja">
        <Probe />
      </MiniappRoot>,
    );
    expect(html).toContain('browser');
    expect(html).toContain('dev:');
  });

  it('renders the miniapp inside the app', () => {
    const win = Object.assign(new EventTarget(), {
      ReactNativeWebView: { postMessage: () => {} },
      skkuverse: { protocol: 1, capabilities: [], getViewport: () => null, receive: () => {} },
    });
    vi.stubGlobal('window', win);
    vi.stubGlobal('location', { hostname: 'mukja.mini.skkuverse.com' });
    const html = renderToString(
      <MiniappRoot id="mukja">
        <Probe />
      </MiniappRoot>,
    );
    expect(html).toContain('in-app');
  });

  it('makes hooks throw outside it', () => {
    browser();
    expect(() => renderToString(<Probe />)).toThrow(/MiniappRoot/);
  });
});
