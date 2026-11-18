import { animate, FixedStep, PhaseMachine, strongerHaptic, type HapticStyle, type Phase } from '../kit/loop';
import type { CueName } from '../sound/sfx';
import { BIG_MILESTONE, TICK_MS } from './constants';
import { beginRun, createGame, resultOf, step, type GameResult, type GameState, type Input } from './engine';
import { Renderer, type Overlay } from './render/draw';
import { newSeed } from './rng';

export type { Phase };

export interface LoopCallbacks {
  onPhase(phase: Phase): void;
  /** A new run begins: the first one or a restart, not a resume. */
  onRunStart(): void;
  /** Every crash passes through here. */
  onCrash(result: GameResult): void;
  onHaptic(style: HapticStyle): void;
  onSound(cue: CueName): void;
}

/**
 * Runs the simulation at a fixed 60 Hz whatever the display rate, and draws in
 * between with interpolation. The fixed step is what makes a run replayable from
 * its seed and inputs; drawing at the display rate is what keeps a 120 Hz phone
 * smooth.
 *
 * The page is hosted by the app, which owns everything after a crash: the loop
 * never restarts on a tap, it waits for the host to say so.
 *
 * The phases are the kit's `PhaseMachine` and the fixed step its `FixedStep`
 * (at most `MAX_FRAME_MS` simulated after a stall, so a hitch does not
 * fast-forward into a crash); one tap of feedback a tick, the strongest, is
 * its `strongerHaptic`.
 */
export class GameLoop {
  private state: GameState;
  private readonly renderer: Renderer;
  private queue: Input[] = [];
  private readonly machine: PhaseMachine;
  private readonly clock = new FixedStep(TICK_MS);
  private stopFrames: (() => void) | null = null;
  private readonly overlay: Overlay;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly callbacks: LoopCallbacks,
  ) {
    this.renderer = new Renderer(canvas, () => callbacks.onSound('splash'));
    this.state = createGame(newSeed());
    this.overlay = { crashedAt: null, doubleJump: null };
    this.machine = new PhaseMachine({
      onPhase: (phase) => this.callbacks.onPhase(phase),
      begin: () => this.begin(),
      fresh: () => this.fresh(),
      pause: () => {
        // Whatever was held is released; the fingers are gone by the time it
        // resumes. Queued rather than stepped here, so a collision on that tick
        // still goes through tick() and reaches the host as a crash.
        this.queue.push('jumpEnd', 'duckEnd');
      },
      resume: () => this.clock.restart(),
    });
  }

  private get phase(): Phase {
    return this.machine.phase;
  }

  start(): void {
    this.clock.restart();
    this.stopFrames = animate((now) => this.frame(now));
  }

  stop(): void {
    this.stopFrames?.();
  }

  resize(w: number, h: number, dpr: number): void {
    this.renderer.resize(w, h, dpr);
    this.renderer.render(this.state, 1, performance.now(), this.overlay);
  }

  /** Every press and release from the player comes through here. */
  input(i: Input): void {
    const pressed = i === 'jump' || i === 'duck';
    if (this.phase === 'crashed') return;
    if (this.phase === 'paused') return;
    if (this.phase === 'ready') {
      // The first press starts the run and also counts, so a jump press jumps.
      if (!pressed) return;
      this.machine.start();
    }
    this.queue.push(i);
  }

  /** A run begins, the first or a restart; the machine turns the phase to running after. */
  private begin(): void {
    beginRun(this.state);
    this.callbacks.onRunStart();
    this.clock.restart();
  }

  /** The machine's fresh step, before a restart or a reset: a fresh game. */
  private fresh(): void {
    this.state = createGame(newSeed());
    this.renderer.reset();
    this.overlay.crashedAt = null;
    this.overlay.doubleJump = null;
    this.queue = [];
  }

  /** Start a fresh run straight away, as the original does after a crash. Only from a crash. */
  restart(): void {
    this.machine.restart();
  }

  /** Back to the title after a crash: a fresh game, waiting for the first tap. */
  reset(): void {
    this.machine.reset();
  }

  /** The app went to the background mid-run, or a screen came over it. */
  pause(): void {
    this.machine.pause();
  }

  resume(): void {
    this.machine.resume();
  }

  private frame(now: number): void {
    this.clock.advance(
      now,
      () => this.phase === 'running',
      () => this.tick(now),
    );
    const alpha = this.clock.alpha(this.phase === 'running');
    this.renderer.render(this.state, alpha, now, this.overlay);
  }

  private tick(now: number): void {
    const inputs = this.queue;
    this.queue = [];
    step(this.state, inputs);
    const s = this.state;
    let haptic: HapticStyle | null = null;
    let chime: CueName | null = null;
    for (const e of s.events) {
      switch (e.type) {
        case 'jump':
          if (e.double) {
            this.overlay.doubleJump = { at: now, y: s.player.jumpBase };
            this.callbacks.onSound('doubleJump');
            haptic = strongerHaptic(haptic, 'soft');
          } else {
            this.callbacks.onSound('jump');
          }
          break;
        case 'dive':
          this.callbacks.onSound('dive');
          break;
        case 'land':
          // An ordinary landing is silent: it comes every second, and the next jump is already sounding.
          if (e.hard) {
            this.callbacks.onSound('land');
            haptic = strongerHaptic(haptic, 'rigid');
          }
          break;
        case 'milestone':
          chime = e.at % BIG_MILESTONE === 0 ? 'thousand' : 'milestone';
          haptic = strongerHaptic(haptic, chime === 'thousand' ? 'medium' : 'light');
          break;
        case 'crash':
          this.callbacks.onSound('crash');
          haptic = strongerHaptic(haptic, 'heavy');
          break;
      }
    }
    if (chime) this.callbacks.onSound(chime);
    if (haptic) this.callbacks.onHaptic(haptic);
    if (s.status === 'crashed') this.crash(now);
  }

  private crash(now: number): void {
    this.overlay.crashedAt = now;
    const result = resultOf(this.state);
    this.machine.crash();
    this.callbacks.onCrash(result);
  }
}
