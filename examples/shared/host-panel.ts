/**
 * A message panel for an example that runs on the fake host. It reads the
 * host's log and lists each message, in either direction, as it arrives. It is
 * plain DOM and imports nothing, so a React page and a canvas game both mount
 * it, and no second copy of React can end up in a page.
 */

export type Direction = 'page-to-app' | 'app-to-page';

export interface PanelEntry {
  direction: Direction;
  method: string;
  params: unknown;
  /** Milliseconds from the panel's mount to the poll that first saw the entry. */
  at: number;
}

export type MethodEffect = 'shake' | 'toast' | 'sheet' | 'map';

export interface MethodNote {
  label: string;
  effect?: MethodEffect;
}

export const METHOD_NOTES: Record<string, MethodNote> = {
  'game.ready': { label: 'The page asks the app to start the game.' },
  'game.init': { label: 'The app answers with its settings. No run starts before this.' },
  'game.start': { label: 'A run began.' },
  'game.phase': { label: 'The run moved to another phase.' },
  'game.haptic': { label: 'The page asks for a tap of feedback.' },
  'game.over': { label: 'The run ended. The app draws what comes next.', effect: 'sheet' },
  'game.pause': { label: 'The app pauses the page.' },
  'game.resume': { label: 'The app resumes the page.' },
  'game.restart': { label: 'The app starts a new run.' },
  'game.reset': { label: 'The app sends the page back to its title.' },
  'game.sound': { label: 'The app changes the sound setting.' },
  'haptic.impact': { label: 'The page asks for a tap of feedback.', effect: 'shake' },
  'link.open': { label: 'The page asks the app to open a link.', effect: 'sheet' },
  'map.openPlace': { label: 'The page asks the app to open the map.', effect: 'map' },
  response: { label: 'The app answers a request.' },
};

/** The structural subset of a fake host log entry that the panel reads. */
export type LogEntry =
  | { from: 'page'; raw: string; message: { method: string; params?: unknown } | null }
  | { from: 'host'; event: string; data: unknown };

/** The structural subset of the fake host that the panel uses. */
export interface PanelHost {
  readonly log: readonly LogEntry[];
  pause(): void;
  resume(): void;
}

export function toPanelEntry(entry: LogEntry, at: number): PanelEntry {
  if (entry.from === 'host') return { direction: 'app-to-page', method: entry.event, params: entry.data, at };
  if (entry.message === null) return { direction: 'page-to-app', method: '(unparsed)', params: entry.raw, at };
  return { direction: 'page-to-app', method: entry.message.method, params: entry.message.params, at };
}

export interface SheetSpec {
  title: string;
  /** A line under the title, such as the address or place the page asked for. */
  detail?: string;
  action?: { label: string; run(): void };
  /** The label of a button that closes the sheet. */
  dismiss?: string;
}

export interface PanelOptions {
  /** The phone frame. It receives the shake class and holds the sheet and the toast. */
  frame: HTMLElement;
  /** Where the panel draws itself. */
  panel: HTMLElement;
  /** Null when the page runs with no host. */
  host: PanelHost | null;
  /** What a `sheet` or `map` effect shows for an entry. */
  sheet?: (entry: PanelEntry) => SheetSpec | null;
  /** Methods that close the sheet when they appear. */
  closeSheetOn?: readonly string[];
  /** The panel drops its oldest entries past this many. */
  maxEntries?: number;
}

export interface PanelHandle {
  entries(): readonly PanelEntry[];
  dispose(): void;
}

const POLL_MS = 50;
const SHAKE_MS = 400;
const TOAST_MS = 1800;
const DEFAULT_MAX = 200;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatParams(params: unknown): string {
  if (params === undefined) return '';
  const json = typeof params === 'string' ? params : JSON.stringify(params);
  return json.length > 160 ? `${json.slice(0, 157)}...` : json;
}

export function renderEntry(entry: PanelEntry): HTMLLIElement {
  const note = METHOD_NOTES[entry.method];
  const item = el('li', 'hp-entry');
  item.dataset.direction = entry.direction;
  item.dataset.method = entry.method;

  const head = el('div', 'hp-entry-head');
  head.append(
    el('span', 'hp-direction', entry.direction === 'page-to-app' ? 'page to app' : 'app to page'),
    el('code', 'hp-method', entry.method),
    el('span', 'hp-time', `+${(entry.at / 1000).toFixed(1)}s`),
  );
  item.append(head);
  if (note) item.append(el('div', 'hp-note', note.label));
  const params = formatParams(entry.params);
  if (params) item.append(el('code', 'hp-params', params));
  return item;
}

export function mountHostPanel(options: PanelOptions): PanelHandle {
  const { frame, panel, host } = options;
  const max = options.maxEntries ?? DEFAULT_MAX;
  const started = performance.now();
  const entries: PanelEntry[] = [];
  let seen = 0;
  let sheet: HTMLElement | null = null;
  let toast: HTMLElement | null = null;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  panel.classList.add('hp-panel');
  const title = el('h2', 'hp-title', 'Messages between the page and the app');
  const controls = el('div', 'hp-controls');
  const list = el('ol', 'hp-list');
  list.setAttribute('aria-live', 'polite');
  const empty = el('p', 'hp-empty', host ? 'No messages yet.' : 'No host is installed, so the page sends nothing.');
  for (const [label, run] of [
    ['Pause', () => host?.pause()],
    ['Resume', () => host?.resume()],
  ] as const) {
    const button = el('button', 'hp-button', label);
    button.type = 'button';
    button.disabled = host === null;
    button.addEventListener('click', () => {
      run();
      // Focus left on the button would turn the game's next Space into another press of it.
      button.blur();
    });
    controls.append(button);
  }
  // On a phone the list sits below the fold, so the newest message also shows in a bar that stays in view beside the frame.
  const latest = el('div', 'hp-latest');
  latest.setAttribute('aria-hidden', 'true');
  latest.hidden = true;
  panel.replaceChildren(title, controls, list, empty, latest);

  const later = (fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      fn();
    }, ms);
    timers.add(timer);
  };

  const closeSheet = () => {
    sheet?.remove();
    sheet = null;
  };

  const showSheet = (spec: SheetSpec, effect: 'sheet' | 'map') => {
    closeSheet();
    const mine = el('div', effect === 'map' ? 'hp-sheet hp-sheet-map' : 'hp-sheet');
    sheet = mine;
    mine.setAttribute('role', 'dialog');
    if (effect === 'map') mine.append(el('div', 'hp-map'));
    mine.append(el('p', 'hp-sheet-title', spec.title));
    if (spec.detail) mine.append(el('code', 'hp-sheet-detail', spec.detail));
    if (spec.action) {
      const button = el('button', 'hp-button hp-button-primary', spec.action.label);
      button.type = 'button';
      button.addEventListener('click', spec.action.run);
      mine.append(button);
    }
    if (spec.dismiss) {
      const button = el('button', 'hp-button', spec.dismiss);
      button.type = 'button';
      button.addEventListener('click', closeSheet);
      mine.append(button);
    }
    frame.append(mine);
  };

  const showToast = (text: string) => {
    toast?.remove();
    toast = el('div', 'hp-toast', text);
    frame.append(toast);
    const mine = toast;
    later(() => {
      mine.remove();
      if (toast === mine) toast = null;
    }, TOAST_MS);
  };

  const act = (entry: PanelEntry) => {
    if (options.closeSheetOn?.includes(entry.method)) closeSheet();
    const note = METHOD_NOTES[entry.method];
    if (!note?.effect) return;
    if (note.effect === 'shake') {
      frame.classList.remove('hp-shake');
      void frame.offsetWidth;
      frame.classList.add('hp-shake');
      later(() => frame.classList.remove('hp-shake'), SHAKE_MS);
    } else if (note.effect === 'toast') {
      showToast(note.label);
    } else {
      const spec = options.sheet?.(entry);
      if (spec) showSheet(spec, note.effect);
    }
  };

  const poll = () => {
    if (!host || host.log.length === seen) return;
    const at = performance.now() - started;
    const fresh = host.log.slice(seen).map((entry) => toPanelEntry(entry, at));
    seen = host.log.length;
    empty.hidden = true;
    for (const entry of fresh) {
      entries.push(entry);
      const item = renderEntry(entry);
      item.classList.add('hp-flash');
      list.append(item);
      act(entry);
    }
    while (entries.length > max) {
      entries.shift();
      list.firstElementChild?.remove();
    }
    list.scrollTop = list.scrollHeight;
    const newest = entries[entries.length - 1];
    if (newest) {
      latest.hidden = false;
      latest.dataset.method = newest.method;
      latest.replaceChildren(
        el('span', 'hp-latest-label', newest.direction === 'page-to-app' ? 'page to app' : 'app to page'),
        el('code', 'hp-latest-method', newest.method),
      );
    }
  };

  // The fake host announces its own events, such as the automatic game.init, to no one, so the log is polled.
  const interval = setInterval(poll, POLL_MS);
  poll();

  return {
    entries: () => entries,
    dispose() {
      clearInterval(interval);
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      closeSheet();
      toast?.remove();
    },
  };
}
