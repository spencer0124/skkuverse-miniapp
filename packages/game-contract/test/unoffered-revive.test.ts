/**
 * A page that never offered a revive must still refuse game.revive: the runner
 * sends one after the final loss whether or not any revive was played.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { runContract } from '../src/harness';

const html = readFileSync(resolve(import.meta.dirname, '../../cli/templates/game/index.html'), 'utf8');

test('a page that offers no revive but takes game.revive breaks revive-capped', async () => {
  const result = await runContract({ html, load: () => import('./fixtures/unoffered-revive') });
  expect(result.violations).toEqual([]);
  expect(result.problems.map((p) => p.rule)).toEqual(['revive-capped']);
});
