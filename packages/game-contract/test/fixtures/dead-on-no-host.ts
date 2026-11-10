/*
 * A FIXTURE, not a game: templates/game/src/main.ts with one change, a page
 * that gives up for good on onNoHost. Once bootGame says the host has not
 * appeared, presses do nothing, even after a late host's game.init. The
 * contract's tests assert that it fails run-starts when the host comes after
 * onNoHost; keep it in step with the template otherwise.
 *
 * __ID__'s page. A starting point: tap as often as you can in ten seconds.
 *
 * The page owns gameplay; the host owns everything a run is worth. The title,
 * the pause card, the result, the best score and any leaderboard are drawn by
 * the app over this page, so the page draws only the game itself.
 *
 * It reaches the app only through bootGame (spec G2): bootGame installs the
 * page guard, waits for the host, sends game.ready and hands the page
 * game.init. The page reports game.start, game.phase and game.over through
 * it and obeys pause, resume, sound, reset, restart and revive.
 */
import { bootGame, type GamePhase } from '@skkuverse/miniapp/game';

const RUN_MS = 10_000;
/** 60 Hz ticks, the unit game.over reports. */
const TICK_MS = 1000 / 60;

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('index.html has no <canvas id="game">');
const context = canvas.getContext('2d');

let phase: GamePhase = 'ready';
let score = 0;
/** Time charged to the run, so a pause holds the clock. */
let elapsed = 0;
let last: number | null = null;
let size = { width: 0, height: 0, dpr: 1 };
/** BROKEN ON PURPOSE: set by onNoHost and never cleared, so a late game.init cannot bring the page back. */
let dead = false;

const game = bootGame({
  // Until game.init arrives, game.start() refuses: no run before the host speaks.
  onInit: () => draw(),
  onPause: () => setPhase(phase === 'running' ? 'paused' : phase),
  onResume: () => {
    if (phase !== 'paused') return;
    last = null;
    setPhase('running');
  },
  onReset: () => {
    if (phase !== 'crashed') return;
    score = 0;
    elapsed = 0;
    setPhase('ready');
  },
  onRestart: () => {
    if (phase === 'crashed') run();
  },
  onViewport: () => fit(),
  onNoHost: () => {
    dead = true;
  },
});

function setPhase(next: GamePhase): void {
  if (phase === next) return;
  phase = next;
  game.phase(next);
  draw();
}

function run(): void {
  if (!game.start()) return;
  score = 0;
  elapsed = 0;
  last = null;
  setPhase('running');
}

function over(): void {
  setPhase('crashed');
  // One game.over a run. This game has no revives, so the host never offers one.
  game.over({ score, ticks: Math.round(elapsed / TICK_MS), hit: 'time', revives: 0, revivesLeft: 0 });
}

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  if (dead) return;
  if (phase === 'ready') run();
  else if (phase === 'running') {
    score += 1;
    game.haptic('light');
  }
});

function frame(now: number): void {
  if (phase === 'running') {
    elapsed += last === null ? 0 : now - last;
    last = now;
    if (elapsed >= RUN_MS) over();
  }
  draw();
  requestAnimationFrame(frame);
}

function fit(): void {
  if (!canvas) return;
  size = { width: canvas.clientWidth, height: canvas.clientHeight, dpr: window.devicePixelRatio || 1 };
  canvas.width = Math.round(size.width * size.dpr);
  canvas.height = Math.round(size.height * size.dpr);
  draw();
}

function draw(): void {
  if (!context) return;
  const { width, height, dpr } = size;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#1b1d1f';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 64px system-ui, sans-serif';
  context.fillText(String(score), width / 2, height / 2);
  const left = Math.max(0, 1 - elapsed / RUN_MS);
  context.fillRect(width * 0.2, height / 2 + 56, width * 0.6 * left, 6);
}

window.addEventListener('resize', fit);
fit();
requestAnimationFrame(frame);
