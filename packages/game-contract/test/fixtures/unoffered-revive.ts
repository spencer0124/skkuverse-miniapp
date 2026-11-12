/*
 * A FIXTURE, not a game: a page that never offers a revive, since every
 * game.over says none is left, but runs again on game.revive. The contract's
 * tests assert that it fails revive-capped.
 */
import { bootTimedRun } from './timed-run';

bootTimedRun({ runMs: 10_000, reviveUnoffered: true });
