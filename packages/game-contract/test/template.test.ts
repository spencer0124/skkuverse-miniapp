/** The game template keeps the contract, played from its source with the real bootGame. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { assertContract, runContract } from '../src/harness';

const template = (path: string) => resolve(import.meta.dirname, '../../../templates/game', path);

test('templates/game keeps the game contract', async () => {
  const result = await runContract({
    html: readFileSync(template('index.html'), 'utf8'),
    load: () => import(/* @vite-ignore */ template('src/main.ts')),
  });
  assertContract(result);
  // Three scripted runs, each started and ended once, after one handshake.
  const methods = result.host.methods();
  expect(methods[0]).toBe('game.ready');
  expect(methods.filter((m) => m === 'game.start')).toHaveLength(3);
  expect(methods.filter((m) => m === 'game.over')).toHaveLength(3);
});
