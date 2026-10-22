import bounds from '../../fixtures/bounds.json';

/**
 * The points that pin each ranked game's score bound, shared by the game's
 * bound tests and the server's validator tests so a bound moved on one side
 * fails the other's suite. The values live in `fixtures/bounds.json`, which
 * is also published as `@skkuverse/miniapp/fixtures/bounds.json` for a
 * consumer that cannot import this entry.
 */
export interface BoundFixtures {
  'wave-run': {
    /** `maxScoreAfter(seconds)`: the highest score a run can reach that long after its start. */
    maxScoreAfterSeconds: readonly { seconds: number; maxScore: number }[];
  };
  'subway-typing': {
    /** Keys to type the whole route. */
    totalKeys: number;
    /** The fastest time a run may have, in ms. */
    minRunMs: number;
  };
}

export const BOUND_FIXTURES: BoundFixtures = bounds;
