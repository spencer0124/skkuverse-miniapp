import type { GameNotifyMethod, MiniappNotifyMethod } from '@skkuverse/miniapp/protocol';
import { expectTypeOf, it } from 'vitest';
import type { handlers } from '../src/handlers';

it('keys the handler table by exactly the notify methods', () => {
  expectTypeOf<keyof typeof handlers>().toEqualTypeOf<MiniappNotifyMethod | GameNotifyMethod>();
});
