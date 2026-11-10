/**
 * One session of one page, in a process of its own. `src/cli.ts` starts it with
 * the page named in the environment (see `page.contract.ts`) and reads how it
 * ended from the exit code.
 *
 * Vitest takes its settings from here, not from a config file. Installed from
 * npm, this package can sit in a folder no one may write to, and vite writes
 * the bundle of a config file it loads next to that file or under the nearest
 * node_modules. With `cache: false` vitest writes no results cache either.
 */
import { resolve } from 'node:path';
import { startVitest } from 'vitest/node';
import { shared } from '../vitest.shared.ts';

const tool = resolve(import.meta.dirname, '..');

const vitest = await startVitest(
  'test',
  [],
  {
    ...shared.test,
    config: false,
    root: tool,
    include: ['dist/page.contract.js'],
    run: true,
    cache: false,
    // Under node_modules vitest would hand the page contract to node, and node
    // would import the page, its CSS and the game's player without vite.
    server: { deps: { inline: ['@skkuverse/game-contract'] } },
  },
  { resolve: shared.resolve },
);
await vitest.exit();
