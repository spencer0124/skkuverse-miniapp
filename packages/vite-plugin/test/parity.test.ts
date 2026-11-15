import { GAME_NOTIFY_METHODS, NOTIFY_METHODS } from '@skkuverse/miniapp/protocol';
import { expect, it } from 'vitest';
import { handlers } from '../src/handlers';

it('handles every miniapp and game notify method, and nothing else', () => {
  expect(Object.keys(handlers).sort()).toEqual([...NOTIFY_METHODS, ...GAME_NOTIFY_METHODS].sort());
});
