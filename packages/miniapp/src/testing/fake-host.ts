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
  type Response,
  type Viewport,
} from '../protocol';
import { resolvePreset, type FailureMode, type FailureModes, type HostPreset, type HostPresetName } from './presets';

/**
 * One message in either direction, in the order they happened. The host's answer
 * to a request is logged as the event `response`, with the response as its data.
 */
export type ContractEntry =
  | { from: 'page'; raw: string; message: PageMessage | null }
  | { from: 'host'; event: string; data: unknown };

/**
 * Without a `preset`, the host grants `GAME_NOTIFY_METHODS` (what the app grants
 * a game origin) on `ZERO_VIEWPORT`, and answers `game.ready` with `game.init`
 * on a microtask, as the app's delivery is asynchronous. `init` defaults to this
 * SDK's `GAME_PROTOCOL`, a best of 0 and sound on, and `false` leaves `init()` to
 * the test. A field passed here wins over the same field of the preset.
 */
export interface FakeHostOptions extends HostPreset {
  /** A named host state: `granted`, `nothing-granted`, `no-host`, `late-host`, `slow-init` or `old-host:<version>`. */
  preset?: HostPresetName;
  /**
   * What the host does to the request methods it names. A named method joins the
   * host's capabilities, because `request()` rejects a method the host does not
   * grant with `unsupported` before anything is posted.
   */
  failureModes?: FailureModes;
}

export interface FakeHost {
  /**
   * Become the host: define `window.ReactNativeWebView`, which records what
   * the page posts, and run the app's real `hostBootstrapScript`, which
   * defines `window.skkuverse` and the CSS variables. Call it before or after
   * the page boots: after is the late host the page must wait for. With a
   * `hostDelayMs`, the host appears that long after this call, and with
   * `Infinity` it never does.
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
  /**
   * Change what the host does to request methods, on top of `failureModes`. The
   * newest override of a method wins. With `once`, an override answers the next
   * request to its method only. A method the host does not grant yet joins the
   * capabilities if the host is not installed, and throws if it is, because the
   * bootstrap froze the list.
   */
  use(overrides: FailureModes, options?: { once?: boolean }): void;
  /** Drop every `use()` override. What `failureModes` named at creation stays. */
  resetHandlers(): void;
  /** Cancel a delayed install, a delayed `game.init` and any answer still on its way. */
  dispose(): void;
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
  const preset = options.preset === undefined ? {} : resolvePreset(options.preset);
  const pick = <K extends keyof HostPreset>(key: K): HostPreset[K] => (options[key] !== undefined ? options[key] : preset[key]);
  const capabilities = pick('capabilities') ?? GAME_NOTIFY_METHODS;
  const viewport = pick('viewport') ?? ZERO_VIEWPORT;
  const initOption = pick('init');
  const autoInit = initOption === false ? null : (initOption ?? {});
  const hostDelayMs = pick('hostDelayMs') ?? 0;
  const initDelayMs = pick('initDelayMs') ?? 0;
  const baseModes = new Map<string, FailureMode>(Object.entries(options.failureModes ?? {}));
  const overrides = new Map<string, { mode: FailureMode; once: boolean }[]>();
  const log: ContractEntry[] = [];
  const listeners = new Set<(message: PageMessage | null, raw: string) => void>();
  const css = new Map<string, string>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let granted: ReadonlySet<string> = new Set(capabilities);
  let installed = false;
  let installScheduled = false;
  let epoch = 0;
  let doc: { documentElement: { style: { getPropertyValue(name: string): string } } } | null = null;

  const scope = () => {
    const win = (globalThis as { window?: Window }).window;
    if (!win) throw new Error('createFakeHost needs a window: run it in a browser, jsdom or a stubbed scope');
    return win as Window & { skkuverse?: HostReceiver };
  };

  /** Run `fn` after `ms`, or on a microtask for 0. `dispose()` cancels it. */
  const after = (ms: number, fn: () => void) => {
    const born = epoch;
    if (ms <= 0) {
      queueMicrotask(() => {
        if (born === epoch) fn();
      });
      return;
    }
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (born === epoch) fn();
    }, ms);
    timers.add(timer);
  };

  const send = (logged: string, data: unknown, wire: unknown) => {
    const win = scope();
    if (!installed || !win.skkuverse) throw new Error(`${logged} sent before the fake host was installed`);
    log.push({ from: 'host', event: logged, data });
    win.skkuverse.receive(JSON.stringify(wire));
  };

  const deliver = (event: string, data: unknown) => send(event, data, { event, data });

  const respond = (response: Response) => send('response', response, response);

  const init = (partial: Partial<GameInit> = {}) =>
    deliver('game.init', { gameProtocol: GAME_PROTOCOL, hi: 0, sound: true, ...partial });

  /** The mode that applies to the next request for `method`, consuming a `once` override. */
  const take = (method: string): FailureMode | undefined => {
    const stack = overrides.get(method);
    const top = stack?.at(-1);
    if (stack && top) {
      if (top.once) stack.pop();
      return top.mode;
    }
    return baseModes.get(method);
  };

  const answer = (id: string, method: string) => {
    const mode = take(method);
    if (mode === 'timeout') return;
    if (mode === 'denied' || mode === 'failed') {
      after(0, () => respond({ id, ok: false, error: { code: mode, message: `${method} was ${mode} by the fake host` } }));
      return;
    }
    after(mode === undefined ? 0 : mode.slowMs, () => respond({ id, ok: true, result: null }));
  };

  const record = (raw: string) => {
    const message = parseMessage(raw);
    log.push({ from: 'page', raw, message });
    for (const listener of listeners) listener(message, raw);
    if (message?.id !== undefined) answer(message.id, message.method);
    if (autoInit && message?.method === 'game.ready') after(initDelayMs, () => init(autoInit));
  };

  const installNow = () => {
    const win = scope();
    const names = new Set([...capabilities, ...baseModes.keys(), ...overrides.keys()]);
    granted = names;
    const realDocument = (globalThis as { document?: unknown }).document;
    doc = (realDocument as typeof doc) ?? recordingDocument(css);
    (win as { ReactNativeWebView?: unknown }).ReactNativeWebView = {
      postMessage: (raw: unknown) => record(String(raw)),
    };
    new Function('window', 'document', hostBootstrapScript({ capabilities: [...names], viewport }))(win, doc);
    installed = true;
  };

  return {
    install() {
      if (installed || installScheduled) return;
      scope();
      if (hostDelayMs <= 0) return installNow();
      if (!Number.isFinite(hostDelayMs)) return;
      installScheduled = true;
      after(hostDelayMs, () => {
        installScheduled = false;
        installNow();
      });
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
    use(overrides_, { once = false } = {}) {
      for (const method of Object.keys(overrides_)) {
        if (installed && !granted.has(method)) {
          throw new Error(
            `use(): ${method} is not granted, and the installed host's capabilities are frozen. Name it in failureModes, or call use() before install().`,
          );
        }
      }
      for (const [method, mode] of Object.entries(overrides_)) {
        const stack = overrides.get(method) ?? [];
        stack.push({ mode, once });
        overrides.set(method, stack);
      }
    },
    resetHandlers() {
      overrides.clear();
    },
    dispose() {
      epoch += 1;
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      installScheduled = false;
    },
    async flush() {
      for (let i = 0; i < 5; i++) await Promise.resolve();
    },
  };
}
