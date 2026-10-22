/**
 * The game template still plays when the host appears only after bootGame
 * called onNoHost: a late game.init brings the page back. A file of its own,
 * because a page boots once a module graph.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { assertContract, LATE_HOST_MS, runContract } from '../src/harness';

const template = (path: string) => resolve(import.meta.dirname, '../../../templates/game', path);

test('templates/game keeps the game contract with a host that comes after onNoHost', async () => {
  const result = await runContract(
    {
      html: readFileSync(template('index.html'), 'utf8'),
      load: () => import(/* @vite-ignore */ template('src/main.ts')),
    },
    { hostDelayMs: LATE_HOST_MS },
  );
  assertContract(result);
  const methods = result.host.methods();
  expect(methods[0]).toBe('game.ready');
  expect(methods.filter((m) => m === 'game.start')).toHaveLength(3);
  expect(methods.filter((m) => m === 'game.over')).toHaveLength(3);
});
