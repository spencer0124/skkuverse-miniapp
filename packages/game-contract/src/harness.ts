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
 *   suites. Bare `setTimeout`, `performance` and `Date` stay the runner's,
 *   faked by vitest before the page boots; `requestAnimationFrame` is a
 *   60 Hz frame on that fake clock. A two-minute round plays in seconds.
 * - Canvas drawing is a no-op 2D context: the contract is about messages, not
 *   pixels. Layout is happy-dom's, so every box measures zero.
 * - A press is a `pointerdown` and `pointerup` marked trusted. The page guard
 *   drops untrusted input, and in happy-dom every event is untrusted, so the
 *   mark stands in for a real finger. Nothing else is trusted.
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
}

export interface ContractOptions {
  /** How long a run may take to end on its own before the runner gives up. Defaults to 5 minutes. */
  runCapMs?: number;
  /** How late the host appears after the page boots, to exercise `bootGame`'s wait. Defaults to 300 ms. */
  hostDelayMs?: number;
}

/** What the runner itself checks beyond the contract: that the script could play. */
export type RunnerRule = 'host-found' | 'run-starts' | 'run-ends';

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
/** The clock and timers the page sees, faked before the page boots. */
const FAKED = ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'] as const;
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
 * 6. If the last `game.over` left revives, `game.revive` and play out again.
 */
export async function runContract(page: ContractPage, options: ContractOptions = {}): Promise<ContractResult> {
  const runCapMs = options.runCapMs ?? 5 * 60_000;
  const problems: RunnerProblem[] = [];

  vi.useFakeTimers({ toFake: [...FAKED] });
  mount(page.html);
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
  press();
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

  if (!(await begin('run 1 (a press on the title)', press))) return finish();
  await advance(1_000);
  host.pause();
  await advance(5_000);
  host.resume();
  host.sound(false);
  await advance(1_000);
  if (!(await playOut('run 1'))) return finish();
  host.sound(true);

  if (!(await begin('run 2 (game.restart)', () => host.restart()))) return finish();
  if (!(await playOut('run 2'))) return finish();

  host.reset();
  await advance(1_000);
  if (!(await begin('run 3 (a press after game.reset)', press))) return finish();
  if (!(await playOut('run 3'))) return finish();

  const last = [...host.messages].reverse().find((m) => m?.method === 'game.over');
  const params = last && 'params' in last ? (last.params as { revivesLeft?: unknown }) : {};
  if (typeof params.revivesLeft === 'number' && params.revivesLeft > 0) {
    host.revive();
    await advance(1_000);
    await playOut('run 3 after game.revive');
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

/** A press where the player would make one: on the first canvas, else the body's first element. */
function press(): void {
  const target = document.querySelector('canvas') ?? document.body.firstElementChild ?? document.body;
  for (const type of ['pointerdown', 'pointerup'] as const) {
    const event = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, isPrimary: true });
    Object.defineProperty(event, 'isTrusted', { value: true });
    target.dispatchEvent(event);
  }
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
