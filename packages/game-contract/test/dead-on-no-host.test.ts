/**
 * A page that stays dead after onNoHost breaks run-starts when the host is
 * only late: it answers the handshake but never starts a run.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { assertContract, LATE_HOST_MS, runContract } from '../src/harness';

const html = readFileSync(resolve(import.meta.dirname, '../../cli/templates/game/index.html'), 'utf8');

test('a page that gives up on onNoHost breaks run-starts when the host comes late', async () => {
  const result = await runContract({ html, load: () => import('./fixtures/dead-on-no-host') }, { hostDelayMs: LATE_HOST_MS });
  expect(result.violations).toEqual([]);
  expect(result.problems.map((p) => p.rule)).toEqual(['run-starts']);
  expect(result.host.methods()).toEqual(['game.ready']);
  expect(() => assertContract(result)).toThrow(/run-starts: run 1 \(a press on the title\) sent no game\.start/);
});
