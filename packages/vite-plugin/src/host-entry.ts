import { DEFAULT_SHELL, parseMessage, type HostGlobal, type HostMessage } from '@skkuverse/miniapp/protocol';
import { handlers, type HostContext } from './handlers';
import { formatLogLine, SENTINEL, viewportFor, type DevHostRuntime, type LogEntry } from './shared';

interface HostWindow {
  ReactNativeWebView?: { postMessage(message: string): void };
  skkuverse?: HostGlobal;
  [SENTINEL]?: DevHostRuntime;
}

const win = window as unknown as HostWindow;
const found = win[SENTINEL];
if (!found) throw new Error(`[skkuverse dev host] window.${SENTINEL} is not set, so there is no host to install`);
const runtime: DevHostRuntime = found;

const granted: ReadonlySet<string> = new Set(runtime.capabilities);

function log(entry: LogEntry): void {
  if (runtime.log) runtime.log(entry);
  else console.info(formatLogLine(entry));
}

function send(name: string, data: unknown, message: HostMessage): void {
  log({ dir: 'host', name, data });
  win.skkuverse?.receive(JSON.stringify(message));
}

const context: HostContext = {
  config: runtime,
  shell: { header: runtime.header, statusBar: DEFAULT_SHELL.statusBar, background: DEFAULT_SHELL.background },
  viewport: viewportFor(runtime.viewport, runtime.header),
  deliver: (event, data) => send(event, data, { event, data } as HostMessage),
  after: (ms, fn) => {
    if (ms !== null) setTimeout(fn, ms);
  },
};

function parseLoosely(text: string): { method?: string; params?: unknown } | null {
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === 'object' && value !== null ? (value as { method?: string; params?: unknown }) : null;
  } catch {
    return null;
  }
}

/** A message the app would drop without a word throws here, so the page's console and the terminal both name it. */
function postMessage(raw: unknown): void {
  const text = String(raw);
  const message = parseMessage(text);
  if (!message) {
    const loose = parseLoosely(text);
    const method = typeof loose?.method === 'string' ? loose.method : null;
    if (method === null) {
      log({ dir: 'page', name: '(dropped, not a { method, params } object)', data: text.slice(0, 120) });
      throw new Error(`[skkuverse dev host] dropped a message that is not a { method, params } object: ${text.slice(0, 80)}`);
    }
    log({ dir: 'page', name: `${method} (dropped)`, data: loose?.params });
    throw new Error(
      Object.prototype.hasOwnProperty.call(handlers, method)
        ? `[skkuverse dev host] ${method} was dropped: its params fail the app's validator`
        : `[skkuverse dev host] ${method} is not handled`,
    );
  }
  log({ dir: 'page', name: message.method, data: message.params });
  if (message.id !== undefined) {
    const error = { code: 'unsupported', message: `${message.method} is not handled by the dev host` } as const;
    send('response', { id: message.id, ok: false, error }, { id: message.id, ok: false, error });
    return;
  }
  if (!granted.has(message.method)) {
    throw new Error(`[skkuverse dev host] ${message.method} is not granted by the preset "${runtime.preset}"`);
  }
  (handlers[message.method] as (params: unknown, host: HostContext) => void)(message.params, context);
}

function install(): void {
  if (win.skkuverse) {
    log({ dir: 'info', name: 'a host is already installed here, so the dev host stays out of the way' });
    return;
  }
  win.ReactNativeWebView = { postMessage };
  runtime.bootstrap();
  log({ dir: 'info', name: `dev host installed, preset ${runtime.preset}`, data: { capabilities: runtime.capabilities } });
}

if (runtime.installDelayMs === null) {
  log({ dir: 'info', name: `no dev host: preset ${runtime.preset} never installs one, as in a plain browser` });
} else if (runtime.installDelayMs <= 0) {
  install();
} else {
  setTimeout(install, runtime.installDelayMs);
}
