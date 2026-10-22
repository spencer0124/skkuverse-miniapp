/**
 * Plays a game page against the SDK's fake host and holds it to the protocol
 * contract (`checkGameContract` from `@skkuverse/miniapp/testing`).
 *
 * It runs inside vitest, in node with a happy-dom window, not in a browser:
 *
 * - The page is the real one. For a built game it is the module `vite build`
 *   wrote to `dist/assets/`, with the real `bootGame` bundled in; the markup is
 *   `dist/index.html`'s body. A source entry works the same way, which is how
 *   the template and the broken fixture are checked.
 * - The page gets a happy-dom `Window` of its own as `window` and `document`,
 *   rather than vitest's happy-dom environment. The page guard pins the
 *   clock and the timers on `window` for good, and in that environment
 *   `window` is the runner's own global, which vitest reassigns between
 *   suites. Bare `setTimeout`, `setImmediate`, `performance` and `Date` stay
 *   the runner's, faked by vitest before the page boots; `requestAnimationFrame`
 *   is a 60 Hz frame on that fake clock. A two-minute round plays in seconds.
 *   `setImmediate` is there for React: its scheduler takes it in node, and
 *   left real, a render a host event caused (subway-typing going back to its
 *   title on `game.restart`) was not on the page by the runner's next press.
 * - Canvas drawing is a no-op 2D context: the contract is about messages, not
 *   pixels. Layout is happy-dom's, so every box measures zero.
 * - A press is a `pointerdown`, `pointerup` and `click` marked trusted. The
 *   page guard drops untrusted input, and in happy-dom every event is
 *   untrusted, so the mark stands in for a real finger. Nothing else is
 *   trusted, except what a game's player dispatches through `PlayerInput`.
 * - A game whose runs do not end on their own (a pile that must be filled, a
 *   route that must be typed) ships a player next to its page,
 *   `games/<id>/contract.player.ts`, whose default export is a
 *   `ContractPlayer`: it keeps playing while a run plays out.
 *
 * A browser (Playwright) would add pixels and real layout, not protocol
 * coverage, and costs a browser download in CI; the visual check stays manual.
 */
import { Window } from 'happy-dom';
import { vi } from 'vitest';
import {
  checkGameContract,
  createFakeHost,
  type ContractViolation,
  type FakeHost,
} from '@skkuverse/miniapp/testing';

export interface ContractPage {
  /** A page's `index.html`. Its `<body>` markup, scripts aside, is mounted before `load`. */
  html: string;
  /** Imports the page's entry module, which boots the game. */
  load(): Promise<unknown>;
  /** How the game is played, when presses on the title alone would not play it. */
  player?: ContractPlayer;
}

/** What a player may do to the page: the same trusted input the runner uses. */
export interface PlayerInput {
  readonly document: Document;
  /** A trusted tap (`pointerdown`, `pointerup`, `click`) on `target`, by default where the runner presses. */
  press(target?: Element | null, at?: { x: number; y: number }): void;
  /** Dispatches `event` on `target` marked trusted, as a real finger or keyboard would have sent it. */
  dispatch(target: EventTarget, event: Event): void;
}

/**
 * A game's player, for a game whose runs need playing to end. Each part is
 * optional; the runner presses where it always does for what is left out.
 */
export interface ContractPlayer {
  /** Begin a run from the title. Defaults to a press. */
  start?(input: PlayerInput): void;
  /** Called every step while a run plays out, until it sends `game.over`: tap, type, aim. */
  play?(input: PlayerInput): void;
  /**
   * `game.restart` takes this game back to its title rather than into a run,
   * as a keyboard game's must (iOS raises the keyboard only inside a tap on
   * the page); the runner then starts run 2 from the title with `start`.
   */
  restartToTitle?: boolean;
}

export interface ContractOptions {
  /** How long a run may take to end on its own before the runner gives up. Defaults to 5 minutes. */
  runCapMs?: number;
  /** How late the host appears after the page boots, to exercise `bootGame`'s wait. Defaults to 300 ms. */
  hostDelayMs?: number;
}

/**
 * What the runner itself checks beyond the contract: that the script could
 * play, and that a page takes no revive past the ones it said were left.
 */
export type RunnerRule = 'host-found' | 'run-starts' | 'run-ends' | 'revive-capped';

export interface RunnerProblem {
  rule: RunnerRule;
  detail: string;
}

export interface ContractResult {
  host: FakeHost;
  /** The contract's violations, by rule. */
  violations: ContractViolation[];
  /** Where the scripted session could not go on (a run that never started or never ended). */
  problems: RunnerProblem[];
}

const STEP_MS = 500;
/** More revives than any game offers a run: a page still offering one after these never stops. */
const MAX_REVIVES_PLAYED = 8;
/** The clock and timers the page sees, faked before the page boots. */
const FAKED = ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'performance', 'Date'] as const;
/** A display's frame. */
const FRAME_MS = 1000 / 60;
/** The DOM the page and the host's bootstrap reach by bare name, taken from the page's window over node's own. */
const DOM_GLOBALS = ['Event', 'CustomEvent', 'EventTarget'] as const;

/**
 * The scripted session:
 *
 * 1. The page boots with no host; the host appears `hostDelayMs` later.
 * 2. Before `game.init`, a press: the page must not start a run.
 * 3. Run 1 starts on a press; mid-run the host pauses, waits, resumes and
 *    turns the sound off; the run plays out to its end.
 * 4. Run 2 starts on `game.restart` and plays out.
 * 5. `game.reset` back to the title; run 3 starts on a press and plays out.
 * 6. While the last `game.over` leaves revives, `game.revive` and play out
 *    again, to the final loss; then one `game.revive` more, which the page
 *    must refuse: it may not run again.
 *
 * A game's player (`ContractPage.player`) starts the runs it presses for, plays
 * each run while it plays out, and may send run 2 through the title.
 */
export async function runContract(page: ContractPage, options: ContractOptions = {}): Promise<ContractResult> {
  const runCapMs = options.runCapMs ?? 5 * 60_000;
  const problems: RunnerProblem[] = [];

  vi.useFakeTimers({ toFake: [...FAKED] });
  mount(page.html);
  const player = page.player ?? {};
  const input: PlayerInput = { document, press, dispatch: trusted };
  const startRun = () => (player.start ? player.start(input) : press());
  const host = createFakeHost({ init: false });
  const count = (method: string) => host.methods().filter((m) => m === method).length;
  const advance = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
    await host.flush();
  };

  await page.load();
  await advance(options.hostDelayMs ?? 300);
  host.install();
  await advance(1_000);
  if (count('game.ready') === 0) {
    problems.push({ rule: 'host-found', detail: 'no game.ready within a second of the host appearing' });
    return { host, violations: checkGameContract(host.log), problems };
  }

  // A press before game.init: a page that starts here breaks no-start-before-init.
  startRun();
  await advance(1_000);
  host.init();
  await advance(1_000);

  const playOut = async (run: string) => {
    const before = count('game.over');
    for (let waited = 0; count('game.over') === before; waited += STEP_MS) {
      if (waited >= runCapMs) {
        problems.push({ rule: 'run-ends', detail: `${run} sent no game.over within ${runCapMs} ms` });
        return false;
      }
      player.play?.(input);
      await advance(STEP_MS);
    }
    return true;
  };
  const begin = async (run: string, start: () => void) => {
    const before = count('game.start');
    start();
    await advance(1_000);
    if (count('game.start') > before) return true;
    problems.push({ rule: 'run-starts', detail: `${run} sent no game.start` });
    return false;
  };

  if (!(await begin('run 1 (a press on the title)', startRun))) return finish();
  await advance(1_000);
  host.pause();
  await advance(5_000);
  host.resume();
  host.sound(false);
  await advance(1_000);
  if (!(await playOut('run 1'))) return finish();
  host.sound(true);

  if (player.restartToTitle) {
    host.restart();
    await advance(1_000);
    if (!(await begin('run 2 (a press after game.restart took it to the title)', startRun))) return finish();
  } else if (!(await begin('run 2 (game.restart)', () => host.restart()))) return finish();
  if (!(await playOut('run 2'))) return finish();

  host.reset();
  await advance(1_000);
  if (!(await begin('run 3 (a press after game.reset)', startRun))) return finish();
  if (!(await playOut('run 3'))) return finish();

  const revivesLeft = () => {
    const last = [...host.messages].reverse().find((m) => m?.method === 'game.over');
    const params = last && 'params' in last ? (last.params as { revivesLeft?: unknown }) : {};
    return typeof params.revivesLeft === 'number' ? params.revivesLeft : 0;
  };
  let revives = 0;
  while (revivesLeft() > 0) {
    if (revives === MAX_REVIVES_PLAYED) {
      problems.push({ rule: 'revive-capped', detail: `still offering a revive after ${MAX_REVIVES_PLAYED}` });
      return finish();
    }
    revives += 1;
    host.revive();
    await advance(1_000);
    if (!(await playOut(`run 3 after game.revive ${revives}`))) return finish();
  }
  if (revives > 0) {
    // The final loss: none left, so another game.revive must change nothing.
    const sent = host.messages.length;
    host.revive();
    await advance(1_000);
    const after = host.messages.slice(sent);
    const ran = after.some((m) => m?.method === 'game.start' || m?.method === 'game.over' || (m?.method === 'game.phase' && 'params' in m && (m.params as { phase?: unknown }).phase === 'running'));
    if (ran) problems.push({ rule: 'revive-capped', detail: `a game.revive after the final loss ran the game again: ${after.map((m) => m?.method ?? '?').join(', ')}` });
  }
  return finish();

  function finish(): ContractResult {
    return { host, violations: checkGameContract(host.log), problems };
  }
}

/**
 * Gives the page a window of its own (see the top of this file) with the
 * page's `<body>` markup, scripts aside, and a no-op 2D context on every canvas.
 */
function mount(html: string): void {
  const win = new Window({ url: 'https://contract.game.skkuverse.com/', width: 390, height: 844 });
  const scope = globalThis as unknown as Record<string, unknown>;
  const page = win as unknown as Record<string, unknown>;
  for (const key of Object.getOwnPropertyNames(win)) {
    if (!(key in globalThis) && !key.startsWith('_')) scope[key] = page[key];
  }
  for (const key of DOM_GLOBALS) scope[key] = page[key];
  scope.window = win;
  scope.document = win.document;
  scope.self = win;
  scope.requestAnimationFrame = (frame: FrameRequestCallback) => setTimeout(() => frame(performance.now()), FRAME_MS);
  scope.cancelAnimationFrame = (handle: ReturnType<typeof setTimeout>) => clearTimeout(handle);

  const document = win.document;
  const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? '';
  document.body.innerHTML = body.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
  const lang = /<html\b[^>]*\blang=["']([^"']+)["']/i.exec(html)?.[1];
  if (lang) document.documentElement.lang = lang;
  win.HTMLCanvasElement.prototype.getContext = function getContext(this: HTMLCanvasElement) {
    return stubContext(this);
  } as never;
}

/**
 * A press where the player would make one: on `target`, by default the first
 * canvas, else the body's first element; at `at` in client px when given.
 */
function press(target?: Element | null, at?: { x: number; y: number }): void {
  const on = target ?? document.querySelector('canvas') ?? document.body.firstElementChild ?? document.body;
  const where = at ? { clientX: at.x, clientY: at.y } : {};
  for (const type of ['pointerdown', 'pointerup'] as const) {
    trusted(on, new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 1, button: 0, isPrimary: true, ...where }));
  }
  trusted(on, new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, button: 0, ...where }));
}

/** Dispatches `event` marked trusted: the page guard lets it through. */
function trusted(target: EventTarget, event: Event): void {
  Object.defineProperty(event, 'isTrusted', { value: true });
  target.dispatchEvent(event);
}

const CONTEXT_METHODS = [
  'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clearRect', 'clip', 'closePath', 'drawImage', 'ellipse',
  'fill', 'fillRect', 'fillText', 'lineTo', 'moveTo', 'putImageData', 'quadraticCurveTo', 'rect', 'reset',
  'resetTransform', 'restore', 'rotate', 'roundRect', 'save', 'scale', 'setLineDash', 'setTransform', 'stroke',
  'strokeRect', 'strokeText', 'transform', 'translate',
] as const;

function stubContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const gradient = { addColorStop() {} };
  const context: Record<string, unknown> = {
    canvas,
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createConicGradient: () => gradient,
    createPattern: () => null,
    measureText: (text: string) => ({ width: text.length * 8, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 }),
    getImageData: (_x: number, _y: number, w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    getLineDash: () => [],
    isPointInPath: () => false,
  };
  for (const name of CONTEXT_METHODS) context[name] = () => {};
  return context as unknown as CanvasRenderingContext2D;
}

/** Throws naming every contract rule the page broke and every place the script could not go on. */
export function assertContract(result: ContractResult): void {
  const lines = [
    ...result.violations.map((v) => `  ${v.rule} (entry ${v.index}): ${v.detail}`),
    ...result.problems.map((p) => `  ${p.rule}: ${p.detail}`),
  ];
  if (lines.length === 0) return;
  const sent = result.host.methods().join(', ');
  throw new Error(`game contract broken:\n${lines.join('\n')}\npage sent: ${sent}`);
}
