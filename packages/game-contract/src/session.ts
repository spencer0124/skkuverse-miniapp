/**
 * One session of one page, in a process of its own. `src/cli.ts` starts it with
 * the page named in the environment (see `page.contract.ts`) and reads how it
 * ended from the exit code, `SESSION_EXIT`.
 *
 * Vitest takes its settings from here, not from a config file. Installed from
 * npm, this package can sit in a folder no one may write to, and vite writes
 * the bundle of a config file it loads next to that file or under the nearest
 * node_modules. With `cache: false` vitest writes no results cache either.
 */
import { resolve } from 'node:path';
import { startVitest, type Vitest } from 'vitest/node';
import { shared } from '../vitest.shared.ts';
import { CONTRACT_BROKEN, SESSION_EXIT, type Outcome } from './outcome.ts';

const tool = resolve(import.meta.dirname, '..');

/** `broken` only when the one test failed on the contract checker's error and nothing else failed. */
function outcome(vitest: Vitest): Outcome {
  if (vitest.state.getUnhandledErrors().length > 0) return 'error';
  const modules = vitest.state.getTestModules();
  if (modules.some((module) => module.errors().length > 0)) return 'error';
  const results = modules.flatMap((module) => [...module.children.allTests()].map((test) => test.result()));
  const [result] = results;
  if (results.length !== 1 || !result) return 'error';
  if (result.state === 'passed') return 'kept';
  const brokenOnly = result.state === 'failed' && result.errors.length > 0 && result.errors.every((e) => e.name === CONTRACT_BROKEN);
  return brokenOnly ? 'broken' : 'error';
}

try {
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
  process.exitCode = SESSION_EXIT[outcome(vitest)];
  await vitest.exit();
} catch (error) {
  console.error(error);
  process.exitCode = SESSION_EXIT.error;
}
