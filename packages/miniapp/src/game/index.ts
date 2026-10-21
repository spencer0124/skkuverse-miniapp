/**
 * The client a game page boots through: `bootGame` finds the host, says
 * `game.ready`, waits for `game.init`, reports the run and hands the host's
 * events to the page. It imports no package, so a game's bundle carries
 * nothing beyond this SDK's own code.
 *
 * `installPageGuard` is what `bootGame` installs first; the parts are exported
 * for a game that guards a field of its own on top.
 */
export {
  bootGame,
  HOST_POLL_MS,
  HOST_WAIT_MS,
  type BootOptions,
  type GameClient,
  type GameHandlers,
} from './boot';
export { blocksEvent, installGuard, installPageGuard, lockGlobals } from './guard';
export {
  GAME_PROTOCOL,
  type GameHapticStyle,
  type GameInit,
  type GameOver,
  type GamePhase,
  type GameRect,
  type GameStats,
  type Viewport,
} from '../protocol';
