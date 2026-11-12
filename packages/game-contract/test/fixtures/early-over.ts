/*
 * A FIXTURE, not a game: a run that ends 200 ms after it starts, before the
 * runner begins to play it out. The contract's tests assert that it keeps the
 * contract.
 */
import { bootTimedRun } from './timed-run';

bootTimedRun({ runMs: 200 });
