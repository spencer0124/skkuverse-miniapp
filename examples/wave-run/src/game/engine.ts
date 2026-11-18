import {
  ACCELERATION,
  CLEAR_TICKS,
  MAX_SPEED,
  MILESTONE,
  NIGHT_EVERY,
  NIGHT_FADE_TICKS,
  PROGRESS_COEFFICIENT,
  START_SPEED,
} from './constants';
import { anyOverlap } from './collision';
import { obstacleBoxes, updateObstacles, type Obstacle, type ObstacleKind } from './obstacles';
import {
  createPlayer,
  playerBoxes,
  pressDuck,
  releaseDuck,
  releaseJump,
  startJump,
  updatePlayer,
  type Player,
} from './player';

export type Input = 'jump' | 'jumpEnd' | 'duck' | 'duckEnd';

export type GameEvent =
  | { type: 'jump'; double: boolean }
  /** Ducking in the air: the runner starts to plunge. */
  | { type: 'dive' }
  /** Back on the ground; `hard` when it came down in a dive. */
  | { type: 'land'; hard: boolean }
  | { type: 'milestone'; at: number }
  | { type: 'crash'; into: ObstacleKind };

export type Status = 'ready' | 'running' | 'crashed';

export interface GameState {
  seed: number;
  rng: number;
  status: Status;
  /** Ticks since the run started. */
  tick: number;
  speed: number;
  distance: number;
  prevDistance: number;
  /** Distance in points: it paces the milestones and the day and night swap. */
  progress: number;
  player: Player;
  obstacles: Obstacle[];
  history: ObstacleKind[];
  /** What ended the run. */
  hit: ObstacleKind | null;
  /** Nothing spawns before this tick. */
  graceUntil: number;
  /** 0 = day, 1 = night; eases toward the phase the progress calls for. */
  night: number;
  /** What happened during the last step, for the shell to react to. */
  events: GameEvent[];
}

export function createGame(seed: number): GameState {
  return {
    seed,
    rng: seed,
    status: 'ready',
    tick: 0,
    speed: START_SPEED,
    distance: 0,
    prevDistance: 0,
    progress: 0,
    player: createPlayer(),
    obstacles: [],
    history: [],
    hit: null,
    graceUntil: CLEAR_TICKS,
    night: 0,
    events: [],
  };
}

/** Leave the title pose and start running. */
export function beginRun(s: GameState): void {
  if (s.status === 'ready') s.status = 'running';
}

function applyInput(s: GameState, input: Input): void {
  const p = s.player;
  switch (input) {
    case 'jump': {
      p.jumpHeld = true;
      const kind = startJump(p, s.speed);
      if (kind) s.events.push({ type: 'jump', double: kind === 'double' });
      break;
    }
    case 'jumpEnd':
      p.jumpHeld = false;
      releaseJump(p);
      break;
    case 'duck': {
      p.duckHeld = true;
      const diving = p.speedDrop;
      pressDuck(p);
      if (p.speedDrop && !diving) s.events.push({ type: 'dive' });
      break;
    }
    case 'duckEnd':
      p.duckHeld = false;
      releaseDuck(p);
      break;
  }
}

/**
 * Advance one tick. Inputs apply first, so a press lands on the tick it is
 * given for; a replay that feeds the same inputs on the same ticks reproduces
 * the run exactly.
 */
export function step(s: GameState, inputs: readonly Input[] = []): void {
  s.events = [];
  if (s.status !== 'running') return;

  for (const input of inputs) {
    applyInput(s, input);
  }

  const airborne = s.player.jumping;
  const diving = s.player.speedDrop;
  updatePlayer(s.player);
  if (airborne && !s.player.jumping) s.events.push({ type: 'land', hard: diving });
  updateObstacles(s, s.speed, s.tick >= s.graceUntil);

  const mine = playerBoxes(s.player);
  for (const o of s.obstacles) {
    if (anyOverlap(mine, obstacleBoxes(o))) {
      s.status = 'crashed';
      s.hit = o.kind;
      s.events.push({ type: 'crash', into: o.kind });
      return;
    }
  }

  s.prevDistance = s.distance;
  s.distance += s.speed;
  const progress = Math.floor(s.distance * PROGRESS_COEFFICIENT);
  if (Math.floor(progress / MILESTONE) > Math.floor(s.progress / MILESTONE)) {
    s.events.push({ type: 'milestone', at: Math.floor(progress / MILESTONE) * MILESTONE });
  }
  s.progress = progress;
  if (s.speed < MAX_SPEED) s.speed = Math.min(MAX_SPEED, s.speed + ACCELERATION);

  const nightTarget = Math.floor(s.progress / NIGHT_EVERY) % 2;
  const fade = 1 / NIGHT_FADE_TICKS;
  s.night = nightTarget > s.night ? Math.min(1, s.night + fade) : Math.max(0, s.night - fade);

  s.tick++;
}

/** What a finished run hands on: how long it lasted and what it hit. */
export interface GameResult {
  ticks: number;
  hit: ObstacleKind | null;
}

export function resultOf(s: GameState): GameResult {
  return { ticks: s.tick, hit: s.hit };
}
