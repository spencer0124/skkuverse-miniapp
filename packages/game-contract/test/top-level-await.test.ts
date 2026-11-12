/**
 * An entry module may wait on a timer at its top level. The page's timers are
 * fake, so the runner moves time on while the module loads, or it would wait
 * for good.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { assertContract, runContract } from '../src/harness';

const html = readFileSync(resolve(import.meta.dirname, '../../cli/templates/game/index.html'), 'utf8');

test('a page whose entry module awaits a timer at its top level is played', async () => {
  const result = await runContract({ html, load: () => import('./fixtures/top-level-await') });
  assertContract(result);
  expect(result.host.methods().filter((m) => m === 'game.start')).toHaveLength(3);
}, 20_000);
