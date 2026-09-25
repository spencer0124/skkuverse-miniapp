import {
  MESSAGE_EVENT,
  type HostEvent,
  type HostEvents,
  type HostGlobal,
  type HostMessage,
  type NotifyMethod,
  type NotifyMethods,
  type ProtocolError,
} from './protocol';

declare global {
  interface Window {
    /** react-native-webview's channel to the app. */
    ReactNativeWebView?: { postMessage(message: string): void };
    /** Injected by the app before the page's script runs. Absent in a browser. */
    skkuverse?: HostGlobal;
  }
}

/** The app's injected object, or undefined outside the app. */
export function host(): HostGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  const h = window.skkuverse;
  return h && typeof h.protocol === 'number' && window.ReactNativeWebView ? h : undefined;
}

/**
 * Whether this page runs inside the skkuverse app. Feature detection, not a
 * user-agent guess: the app injects `window.skkuverse`, a browser does not.
 */
export function isInApp(): boolean {
  return host() !== undefined;
}

/** Whether the app grants this page `method`. */
export function isGranted(method: string): boolean {
  return host()?.capabilities.includes(method) ?? false;
}

function post(message: unknown): void {
  window.ReactNativeWebView!.postMessage(JSON.stringify(message));
}

/**
 * Send a notification. A no-op outside the app and for a method the app does
 * not grant. There is no answer, so never depend on it having happened.
 */
export function notify<M extends NotifyMethod>(method: M, params: NotifyMethods[M]): void {
  if (!isGranted(method)) return;
  post({ method, params });
}

/** Thrown by `request` when the app answers with an error, or never answers. */
export class MiniappError extends Error {
  readonly code: ProtocolError['code'];
  constructor(error: ProtocolError) {
    super(error.message);
    this.name = 'MiniappError';
    this.code = error.code;
  }
}

type Pending = { resolve(value: unknown): void; reject(error: MiniappError): void; timer: ReturnType<typeof setTimeout> };

const pending = new Map<string, Pending>();
const listeners = new Map<string, Set<(data: unknown) => void>>();
let listening = false;
let counter = 0;

function listen(): void {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener(MESSAGE_EVENT, (event) => {
    const msg = (event as CustomEvent<HostMessage>).detail;
    if (!msg || typeof msg !== 'object') return;
    if ('id' in msg && typeof msg.id === 'string') {
      const entry = pending.get(msg.id);
      if (!entry) return;
      pending.delete(msg.id);
      clearTimeout(entry.timer);
      if (msg.ok) entry.resolve(msg.result);
      else entry.reject(new MiniappError(msg.error));
      return;
    }
    if ('event' in msg && typeof msg.event === 'string') {
      for (const cb of listeners.get(msg.event) ?? []) cb(msg.data);
    }
  });
}

/**
 * Send a request and await the app's answer. Rejects with a `MiniappError`:
 * `unsupported` outside the app or for a method the app does not grant,
 * `timeout` when no answer arrives, otherwise whatever code the app sent.
 *
 * Typed loosely on purpose while `RequestMethods` is empty; the first request
 * method gets a typed wrapper in `sdk/`.
 */
export function request<T = unknown>(
  method: string,
  params: Record<string, unknown> = {},
  { timeoutMs = 10_000 }: { timeoutMs?: number } = {},
): Promise<T> {
  if (!isGranted(method)) {
    return Promise.reject(new MiniappError({ code: 'unsupported', message: `${method} is not available here` }));
  }
  listen();
  counter += 1;
  const id = `r${counter}-${Math.random().toString(36).slice(2, 10)}`;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new MiniappError({ code: 'timeout', message: `${method} got no answer in ${timeoutMs}ms` }));
    }, timeoutMs);
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
    post({ id, method, params });
  });
}

/** Subscribe to an app event. Returns the unsubscribe function. */
export function onEvent<E extends HostEvent>(event: E, callback: (data: HostEvents[E]) => void): () => void {
  listen();
  let set = listeners.get(event);
  if (!set) listeners.set(event, (set = new Set()));
  const cb = callback as (data: unknown) => void;
  set.add(cb);
  return () => {
    set!.delete(cb);
  };
}
