/**
 * A page that takes a game.revive after it said none were left breaks
 * revive-capped: the runner revives to the final loss, then once more.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { assertContract, runContract } from '../src/harness';

const html = readFileSync(resolve(import.meta.dirname, '../../../templates/game/index.html'), 'utf8');

test('a page that revives past the revives it had left breaks revive-capped', async () => {
  const result = await runContract({ html, load: () => import('./fixtures/uncapped-revive') });
  expect(result.violations).toEqual([]);
  expect(result.problems.map((p) => p.rule)).toEqual(['revive-capped']);
  // Run 3 was revived once, to its final loss, before the revive it should have refused.
  const overs = result.host.messages.filter((m) => m?.method === 'game.over');
  expect(overs).toHaveLength(4);
  expect(() => assertContract(result)).toThrow(/revive-capped: a game\.revive after the final loss ran the game again/);
});
