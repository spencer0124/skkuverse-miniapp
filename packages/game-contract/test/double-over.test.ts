/**
 * The broken fixture, the template with a second game.over a run, fails the
 * contract on one-over-per-run, which is what makes CI fail for such a game.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { assertContract, runContract } from '../src/harness';

const html = readFileSync(resolve(import.meta.dirname, '../../../templates/game/index.html'), 'utf8');

test('a page that sends game.over twice in a run breaks one-over-per-run', async () => {
  const result = await runContract({ html, load: () => import('./fixtures/double-over') });
  expect(result.problems).toEqual([]);
  expect(new Set(result.violations.map((v) => v.rule))).toEqual(new Set(['one-over-per-run']));
  // One violation per scripted run, each at the second game.over.
  expect(result.violations).toHaveLength(3);
  expect(() => assertContract(result)).toThrow(/one-over-per-run \(entry \d+\): game\.over number 2 in one run/);
});
