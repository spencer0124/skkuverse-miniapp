/**
 * The parts of a game loop a first-party game repeats:
 *
 * - `PhaseMachine`: ready → running ⇄ paused, running → crashed, and back from
 *   crashed by restart or reset. The page is hosted by the app, which owns
 *   everything after a crash: a loop never restarts on a tap, it waits for the
 *   host to say so.
 * - `FixedStep`: the simulation at a fixed tick whatever the display rate,
 *   drawn in between with interpolation.
 * - `strongerHaptic`: one tap of feedback a tick at most, the strongest felt.
 */

export type Phase = 'ready' | 'running' | 'paused' | 'crashed';

/** The game haptic styles the host plays. */
export type HapticStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' | 'error' | 'success';

/** Longest stretch simulated after a stall, so a hitch does not fast-forward into a crash. */
export const MAX_FRAME_MS = 250;

/**
 * One tap of feedback a tick at most: when two moments land together, the
 * stronger one is felt.
 */
export const HAPTIC_RANK: Readonly<Record<HapticStyle, number>> = {
  light: 0,
  soft: 1,
  rigid: 2,
  medium: 3,
  error: 4,
  heavy: 5,
  success: 6,
};

/** The stronger of two styles; a tie keeps the one already chosen. */
export const strongerHaptic = (a: HapticStyle | null, b: HapticStyle): HapticStyle =>
  a && HAPTIC_RANK[a] >= HAPTIC_RANK[b] ? a : b;

/**
 * What a game does at each transition. Each step runs before the phase
 * changes and `onPhase` reports it, in the order the games' loops used.
 */
export interface PhaseSteps {
  onPhase(phase: Phase): void;
  /** A run begins (the first or a restart): set it up, announce it, restart the clock. */
  begin(): void;
  /** Throw the finished run away before a restart or a reset. */
  fresh(): void;
  /** Let go of whatever was held, before the phase turns paused. */
  pause?(): void;
  /** Restart the clock, before the phase turns running again. */
  resume?(): void;
}

export class PhaseMachine {
  private current: Phase = 'ready';

  constructor(private readonly steps: PhaseSteps) {}

  get phase(): Phase {
    return this.current;
  }

  /** The first press on the title starts a run. Only from ready. */
  start(): boolean {
    if (this.current !== 'ready') return false;
    this.run();
    return true;
  }

  /** Start a fresh run straight away. Only from a crash. */
  restart(): void {
    if (this.current !== 'crashed') return;
    this.steps.fresh();
    this.run();
  }

  /** Back to the title after a crash, waiting for the first press. */
  reset(): void {
    if (this.current !== 'crashed') return;
    this.steps.fresh();
    this.set('ready');
  }

  /** The app went to the background mid-run, or a screen came over it. */
  pause(): void {
    if (this.current !== 'running') return;
    this.steps.pause?.();
    this.set('paused');
  }

  resume(): void {
    if (this.current !== 'paused') return;
    this.steps.resume?.();
    this.set('running');
  }

  /** The run ended. Only from running; the game reports the result after. */
  crash(): boolean {
    if (this.current !== 'running') return false;
    this.set('crashed');
    return true;
  }

  private run(): void {
    this.steps.begin();
    this.set('running');
  }

  private set(phase: Phase): void {
    if (this.current === phase) return;
    this.current = phase;
    this.steps.onPhase(phase);
  }
}

/**
 * A fixed-step accumulator. Each frame adds the time since the last one, at
 * most `maxFrameMs`, and runs whole ticks while the run is running; what is
 * left over is the interpolation alpha the frame draws at.
 */
export class FixedStep {
  private acc = 0;
  private last = 0;

  constructor(
    readonly tickMs: number,
    private readonly clock: () => number = () => performance.now(),
    readonly maxFrameMs: number = MAX_FRAME_MS,
  ) {}

  /** Forget the time before now: on start, on a run and on a resume. */
  restart(): void {
    this.last = this.clock();
    this.acc = 0;
  }

  /**
   * One frame at `now`: runs `tick` once per whole step while `running()`
   * holds, checked before every step so a crash stops the frame. Returns the
   * frame's clamped time.
   */
  advance(now: number, running: () => boolean, tick: () => void): number {
    const dt = Math.min(now - this.last, this.maxFrameMs);
    this.last = now;
    if (running()) {
      this.acc += dt;
      while (this.acc >= this.tickMs && running()) {
        tick();
        this.acc -= this.tickMs;
      }
    }
    return dt;
  }

  /** Where between two ticks to draw; a still frame (not running) draws the last tick. */
  alpha(running: boolean): number {
    return running ? this.acc / this.tickMs : 1;
  }
}

/** Calls `frame` on every animation frame until the returned stop is called. */
export function animate(frame: (now: number) => void): () => void {
  let raf = 0;
  const next = (now: number) => {
    frame(now);
    raf = requestAnimationFrame(next);
  };
  raf = requestAnimationFrame(next);
  return () => cancelAnimationFrame(raf);
}
