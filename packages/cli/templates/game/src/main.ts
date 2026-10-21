import './style.css';

/*
 * PLACEHOLDER — switch to bootGame once @skkuverse/miniapp 0.4.0 is published
 * (add-game-factory task 3.4). The page will then start with:
 *
 *   import { bootGame } from '@skkuverse/miniapp/game';
 *
 *   bootGame({ ... });
 *
 * bootGame installs the page guard, waits for the host, sends game.ready and
 * hands the page game.init; the page reports game.start, game.phase and
 * game.over through it and obeys pause, resume, sound, reset, restart and
 * revive. Until then this page only draws, and never talks to the host: spec
 * G2 allows no other way to reach it.
 */

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('index.html has no <canvas id="game">');
const context = canvas.getContext('2d');

function draw(): void {
  if (!canvas || !context) return;
  const dpr = window.devicePixelRatio || 1;
  const { clientWidth: width, clientHeight: height } = canvas;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#1b1d1f';
  context.font = '600 20px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('__ID__', width / 2, height / 2);
}

window.addEventListener('resize', draw);
draw();
