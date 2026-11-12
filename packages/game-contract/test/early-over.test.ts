/**
 * A run can end before the runner starts to play it out, during the time it
 * waits for game.start. That game.over ends the run; the runner must not wait
 * for another.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { assertContract, runContract } from '../src/harness';

const html = readFileSync(resolve(import.meta.dirname, '../../cli/templates/game/index.html'), 'utf8');

test('a run that ends before the runner plays it out has ended', async () => {
  const result = await runContract({ html, load: () => import('./fixtures/early-over') });
  assertContract(result);
  expect(result.host.methods().filter((m) => m === 'game.over')).toHaveLength(3);
});
