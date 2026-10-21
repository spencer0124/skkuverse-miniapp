import {
  GAME_NOTIFY_METHODS,
  GAME_PROTOCOL,
  hostBootstrapScript,
  parseMessage,
  ZERO_VIEWPORT,
  type GameHostEvent,
  type GameHostEvents,
  type GameInit,
  type PageMessage,
  type Viewport,
} from '../protocol';

/** One message in either direction, in the order they happened. */
export type ContractEntry =
  | { from: 'page'; raw: string; message: PageMessage | null }
  | { from: 'host'; event: string; data: unknown };

export interface FakeHostOptions {
  /** Granted methods. Defaults to `GAME_NOTIFY_METHODS`, what the app grants a game origin. */
  capabilities?: readonly string[];
  /** Defaults to `ZERO_VIEWPORT`. */
  viewport?: Viewport;
  /**
   * Answer `game.ready` with `game.init`, on a microtask as the app's
   * delivery is asynchronous. Defaults to this SDK's `GAME_PROTOCOL`, a best
   * of 0 and sound on. `false` leaves `init()` to the test.
   */
  init?: Partial<GameInit> | false;
}

export interface FakeHost {
  /**
   * Become the host: define `window.ReactNativeWebView`, which records what
   * the page posts, and run the app's real `hostBootstrapScript`, which
   * defines `window.skkuverse` and the CSS variables. Call it before or after
   * the page boots: after is the late host the page must wait for.
   */
  install(): void;
  readonly installed: boolean;
  /** Everything sent both ways, in order: what the contract assertions read. */
  readonly log: readonly ContractEntry[];
  /** What the page posted, parsed (`null` for a message that does not parse). */
  readonly messages: readonly (PageMessage | null)[];
  /** The method of each page message, `'?'` for one that does not parse. */
  methods(): string[];
  /** A CSS variable as the bootstrap set it on `<html>`, such as `--sv-inset-top`. */
  cssVar(name: string): string | undefined;
  /** Called for each page message as it arrives. Returns the unsubscribe function. */
  onMessage(callback: (message: PageMessage | null, raw: string) => void): () => void;
  /** Deliver a game event, as `hostDeliverScript` would. */
  send<E extends GameHostEvent>(event: E, data: GameHostEvents[E]): void;
  init(init?: Partial<GameInit>): void;
  pause(): void;
  resume(): void;
  sound(on: boolean): void;
  reset(): void;
  restart(): void;
  revive(): void;
  /** Change the viewport, as the app does on a rotation or a shell change. */
  setViewport(viewport: Viewport): void;
  /** Let pending deliveries (the automatic `game.init`) run. */
  flush(): Promise<void>;
}

interface HostReceiver {
  receive(json: string): void;
}

/** A `<html>` that only records its CSS variables, for a scope with no DOM. */
function recordingDocument(css: Map<string, string>) {
  return {
    documentElement: {
      style: {
        setProperty: (name: string, value: string) => css.set(name, value),
        getPropertyValue: (name: string) => css.get(name) ?? '',
      },
      setAttribute: () => {},
    },
  };
}

/**
 * A stand-in for the app's game host, for SDK and contract tests. It uses
 * the scope's `window` (a browser, jsdom, or a test's own stub) and its
 * `document`, or a recording one where the scope has none.
 *
 * It runs the real bootstrap with `new Function`, so a page under a CSP that
 * forbids `unsafe-eval` cannot host it; run tests without the production
 * headers.
 */
export function createFakeHost(options: FakeHostOptions = {}): FakeHost {
  const capabilities = options.capabilities ?? GAME_NOTIFY_METHODS;
  const viewport = options.viewport ?? ZERO_VIEWPORT;
  const autoInit = options.init === false ? null : (options.init ?? {});
  const log: ContractEntry[] = [];
  const listeners = new Set<(message: PageMessage | null, raw: string) => void>();
  const css = new Map<string, string>();
  let installed = false;
  let doc: { documentElement: { style: { getPropertyValue(name: string): string } } } | null = null;

  const scope = () => {
    const win = (globalThis as { window?: Window }).window;
    if (!win) throw new Error('createFakeHost needs a window: run it in a browser, jsdom or a stubbed scope');
    return win as Window & { skkuverse?: HostReceiver };
  };

  const deliver = (event: string, data: unknown) => {
    const win = scope();
    if (!installed || !win.skkuverse) throw new Error(`${event} sent before the fake host was installed`);
    log.push({ from: 'host', event, data });
    win.skkuverse.receive(JSON.stringify({ event, data }));
  };

  const init = (partial: Partial<GameInit> = {}) =>
    deliver('game.init', { gameProtocol: GAME_PROTOCOL, hi: 0, sound: true, ...partial });

  const record = (raw: string) => {
    const message = parseMessage(raw);
    log.push({ from: 'page', raw, message });
    for (const listener of listeners) listener(message, raw);
    if (autoInit && message?.method === 'game.ready') queueMicrotask(() => init(autoInit));
  };

  return {
    install() {
      if (installed) return;
      const win = scope();
      const realDocument = (globalThis as { document?: unknown }).document;
      doc = (realDocument as typeof doc) ?? recordingDocument(css);
      (win as { ReactNativeWebView?: unknown }).ReactNativeWebView = {
        postMessage: (raw: unknown) => record(String(raw)),
      };
      new Function('window', 'document', hostBootstrapScript({ capabilities, viewport }))(win, doc);
      installed = true;
    },
    get installed() {
      return installed;
    },
    get log() {
      return log;
    },
    get messages() {
      return log.flatMap((entry) => (entry.from === 'page' ? [entry.message] : []));
    },
    methods() {
      return log.flatMap((entry) => (entry.from === 'page' ? [entry.message?.method ?? '?'] : []));
    },
    cssVar(name) {
      const value = doc?.documentElement.style.getPropertyValue(name);
      return value ? value : undefined;
    },
    onMessage(callback) {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    send(event, data) {
      deliver(event, data);
    },
    init,
    pause: () => deliver('game.pause', {}),
    resume: () => deliver('game.resume', {}),
    sound: (on) => deliver('game.sound', { on }),
    reset: () => deliver('game.reset', {}),
    restart: () => deliver('game.restart', {}),
    revive: () => deliver('game.revive', {}),
    setViewport(next) {
      deliver('viewport.changed', next);
    },
    async flush() {
      for (let i = 0; i < 5; i++) await Promise.resolve();
    },
  };
}
