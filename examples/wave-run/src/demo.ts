import { bootGame } from '@skkuverse/miniapp/game';
import type { FakeHost } from '@skkuverse/miniapp/testing';
import '../../shared/host-panel.css';
import { mountHostPanel } from '../../shared/host-panel';
import { bindInput } from './game/input';
import { GameLoop } from './game/loop';
import { playSound, setSoundOn, unlockSound } from './sound/sfx';
import './style.css';

/** Boots the game page and the message panel. An installed host, or none, is the caller's choice. */
export function bootDemo(host: FakeHost | null): void {
  const game = bootGame({
    onInit: ({ sound }) => setSoundOn(sound),
    onPause: () => loop.pause(),
    onResume: () => loop.resume(),
    onSound: setSoundOn,
    onReset: () => loop.reset(),
    onRestart: () => loop.restart(),
    onAudioUnlock: unlockSound,
  });

  const stage = document.getElementById('stage')!;
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  const loop = new GameLoop(canvas, {
    onPhase: (phase) => game.phase(phase),
    onRunStart: () => void game.start(),
    // The wire format requires these counts. The demo ranks nothing and has no comeback, so they are zero.
    onCrash: (r) => game.over({ score: 0, ticks: r.ticks, hit: r.hit, revives: 0, revivesLeft: 0 }),
    onHaptic: (style) => game.haptic(style),
    onSound: playSound,
  });

  const fit = () => {
    const r = stage.getBoundingClientRect();
    loop.resize(r.width, r.height, window.devicePixelRatio || 1);
  };
  new ResizeObserver(fit).observe(stage);
  fit();
  performance.mark('first-frame');

  bindInput(stage, (i) => {
    if (game.init !== null) loop.input(i);
  });
  loop.start();

  mountHostPanel({
    frame: document.getElementById('frame')!,
    panel: document.getElementById('panel')!,
    host,
    sheet: () => ({
      title: '부딪혔어요', // conventions:allow-korean
      action: { label: '다시 하기', run: () => host?.restart() }, // conventions:allow-korean
    }),
    closeSheetOn: ['game.restart', 'game.reset'],
  });
}
