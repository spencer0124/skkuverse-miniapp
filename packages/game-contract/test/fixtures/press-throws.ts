/*
 * A FIXTURE, not a game: a page that answers the handshake and whose press
 * handler throws, as a bug in a game's input code would. The contract's tests
 * assert that the run ends as a runner error that shows the throw.
 */
import { bootGame } from '@skkuverse/miniapp/game';

bootGame({ onInit() {} });

document.querySelector('#game')?.addEventListener('pointerdown', () => {
  throw new TypeError('page bug in a press handler');
});
