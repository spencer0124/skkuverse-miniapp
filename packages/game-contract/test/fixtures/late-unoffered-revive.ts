/*
 * A FIXTURE, not a game: unoffered-revive.ts, except that the run goes on
 * 1.5 s after game.revive rather than at once. The contract's tests assert
 * that it fails revive-capped.
 */
import { bootTimedRun } from './timed-run';

bootTimedRun({ runMs: 10_000, reviveUnoffered: true, reviveDelayMs: 1_500 });
