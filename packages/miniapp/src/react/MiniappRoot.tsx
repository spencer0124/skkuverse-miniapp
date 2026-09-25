import { createContext, useContext, useLayoutEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { CssTypo, SdsColors } from '@skkuverse/tokens';
import { viewportCssVars, type Viewport } from '../protocol';
import { isInApp } from '../transport';

export interface MiniappRootProps {
  /** The miniapp's registry id, as in `skkuverse://m/<id>`. */
  id: string;
  /**
   * What a plain browser gets.
   * - `block` (default): a full-screen "open in the skkuverse app" page.
   * - `allow`: the miniapp itself, with every app feature reporting unavailable.
   *
   * Blocking is the default so that a miniapp is shared outside the app only
   * when someone decided it should be. It is presentation, not protection:
   * anything that must not be reachable from a browser needs a server check.
   */
  browser?: 'block' | 'allow';
  /**
   * Development mode: never block, show a thin banner instead, and apply
   * `mockViewport` so layouts can be checked in a desktop browser. Pass
   * `import.meta.env.DEV`. Defaults to true on localhost and private addresses.
   */
  dev?: boolean;
  /** Viewport to simulate in development outside the app. Defaults to all zeros. */
  mockViewport?: Viewport;
  children: ReactNode;
}

interface RootState {
  id: string;
}

const RootContext = createContext<RootState | null>(null);

/** The enclosing root. Every SDK hook calls it, so none works outside `MiniappRoot`. */
export function useMiniappRoot(): RootState {
  const root = useContext(RootContext);
  if (!root) throw new Error('@skkuverse/miniapp: wrap the app in <MiniappRoot id="…"> before using its hooks.');
  return root;
}

const LOCAL_HOST = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|.+\.local)$/;

function isLocal(): boolean {
  return typeof location !== 'undefined' && LOCAL_HOST.test(location.hostname);
}

/** Where "open in the app" goes: a universal link that opens the app, or the store when it is missing. */
export function openInAppUrl(id: string): string {
  return `https://skkuverse.com/p/m/${encodeURIComponent(id)}`;
}

function applyVars(vars: Record<string, string>, chrome: Viewport['chrome']): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  root.setAttribute('data-sv-chrome', chrome);
}

/**
 * Outside the app there is no app UI, and the device safe area is whatever the
 * browser reports: `env()`, which Safari fills in under `viewport-fit=cover`.
 * Setting the variables to `env()` rather than to zero keeps an allowed page
 * clear of the notch in a browser too.
 */
function browserVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const edge of ['top', 'bottom', 'left', 'right']) {
    const safe = `env(safe-area-inset-${edge}, 0px)`;
    vars[`--sv-safe-${edge}`] = safe;
    vars[`--sv-content-${edge}`] = '0px';
    vars[`--sv-inset-${edge}`] = safe;
  }
  return vars;
}

/**
 * The root every miniapp renders inside. Outside the app it blocks by default
 * (see `browser`). It also guarantees the `--sv-*` CSS variables exist: the
 * app sets them before the page loads, and outside it they are set here, to
 * the browser's `env(safe-area-inset-*)` or to `mockViewport`, so
 * `var(--sv-inset-top)` never falls through.
 */
export function MiniappRoot({ id, browser = 'block', dev, mockViewport, children }: MiniappRootProps) {
  const inApp = isInApp();
  const devMode = dev ?? isLocal();
  const state = useMemo(() => ({ id }), [id]);

  useLayoutEffect(() => {
    if (inApp) return;
    if (devMode && mockViewport) applyVars(viewportCssVars(mockViewport), mockViewport.chrome);
    else applyVars(browserVars(), 'opaque');
  }, [inApp, devMode, mockViewport]);

  if (!inApp && browser === 'block' && !devMode) return <BrowserGate id={id} />;

  return (
    <RootContext.Provider value={state}>
      {!inApp && devMode ? <DevBanner blocked={browser === 'block'} /> : null}
      {children}
    </RootContext.Provider>
  );
}

const gate: Record<string, CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '24px 24px calc(24px + env(safe-area-inset-bottom, 0px))',
    background: SdsColors.background,
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  title: { ...CssTypo.t3, fontWeight: '700', color: SdsColors.grey900, margin: 0 },
  body: { ...CssTypo.t6, color: SdsColors.grey600, margin: 0 },
  button: {
    ...CssTypo.t5,
    fontWeight: '600',
    marginTop: 20,
    width: '100%',
    maxWidth: 320,
    padding: '16px 0',
    borderRadius: 16,
    background: SdsColors.blue500,
    color: '#FFFFFF',
    textDecoration: 'none',
  },
};

function BrowserGate({ id }: { id: string }) {
  return (
    <main style={gate.page}>
      <p style={gate.title}>스꾸버스 앱에서 열어 주세요</p>
      <p style={gate.body}>이 서비스는 스꾸버스 앱 안에서 이용할 수 있어요.</p>
      <a style={gate.button} href={openInAppUrl(id)}>
        스꾸버스 앱에서 열기
      </a>
    </main>
  );
}

function DevBanner({ blocked }: { blocked: boolean }) {
  return (
    <div
      role="note"
      style={{
        position: 'fixed',
        left: 8,
        bottom: 8,
        zIndex: 2147483647,
        padding: '4px 8px',
        borderRadius: 6,
        background: SdsColors.greyOpacity800,
        color: '#FFFFFF',
        font: '11px/1.4 ui-monospace, monospace',
        pointerEvents: 'none',
      }}
    >
      {blocked ? 'dev: outside the app (browsers see the gate)' : 'dev: outside the app'}
    </div>
  );
}
