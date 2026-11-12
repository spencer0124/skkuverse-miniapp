/*
 * A FIXTURE, not a game: the smallest page that keeps the protocol, whose run
 * ends on its own `runMs` after it starts. The fixtures that import it change
 * one thing each, which their tests assert the runner catches or accepts.
 */
import { bootGame, type GamePhase } from '@skkuverse/miniapp/game';

export interface TimedRunOptions {
  runMs: number;
  /** Takes every game.revive, though each game.over says none is left. */
  reviveUnoffered?: boolean;
}

export function bootTimedRun({ runMs, reviveUnoffered = false }: TimedRunOptions): void {
  let phase: GamePhase = 'ready';
  let end: ReturnType<typeof setTimeout> | undefined;

  const game = bootGame({
    onInit: () => {},
    onReset: () => {
      if (phase === 'crashed') setPhase('ready');
    },
    onRestart: () => {
      if (phase === 'crashed') run();
    },
    ...(reviveUnoffered
      ? {
          onRevive: () => {
            if (phase !== 'crashed') return;
            setPhase('running');
            end = setTimeout(over, runMs);
          },
        }
      : {}),
  });

  function setPhase(next: GamePhase): void {
    if (phase === next) return;
    phase = next;
    game.phase(next);
  }

  function run(): void {
    if (!game.start()) return;
    setPhase('running');
    clearTimeout(end);
    end = setTimeout(over, runMs);
  }

  function over(): void {
    setPhase('crashed');
    game.over({ score: 0, ticks: Math.round(runMs / (1000 / 60)), hit: 'time', revives: 0, revivesLeft: 0 });
  }

  document.addEventListener('pointerdown', () => {
    if (phase === 'ready') run();
  });
}
