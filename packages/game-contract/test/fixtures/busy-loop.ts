/*
 * A FIXTURE, not a game: a page whose press handler never returns, as a game
 * stuck in a synchronous loop would. Before it loops it appends the id of the
 * process it runs in to the file BUSY_LOOP_PID_FILE names, so a test can check
 * that the runner ended that process.
 */
import { appendFileSync } from 'node:fs';
import { bootGame } from '@skkuverse/miniapp/game';

bootGame({ onInit() {} });

document.querySelector('#game')?.addEventListener('pointerdown', () => {
  const file = process.env.BUSY_LOOP_PID_FILE;
  if (file) appendFileSync(file, `${process.pid}\n`);
  for (;;);
});
