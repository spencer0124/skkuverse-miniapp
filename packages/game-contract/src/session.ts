/**
 * One session of one page, in a process of its own. `src/cli.ts` starts it with
 * the page named in the environment (see `page.contract.ts`) and reads how it
 * ended from the exit code, `SESSION_EXIT`.
 *
 * Vitest takes its settings from here, not from a config file. Installed from
 * npm, this package can sit in a folder no one may write to, and vite writes
 * the bundle of a config file it loads next to that file or under the nearest
 * node_modules. With `cache: false` and `fsModuleCache: false` vitest writes
 * no results cache and no module cache, which vitest 5 keeps in a node_modules
 * folder by default.
 */
import { resolve } from 'node:path';
import { startVitest, type Reporter, type TestModule } from 'vitest/node';
import { shared } from '../vitest.shared.ts';
import { SESSION_EXIT, type ContractMeta, type Outcome } from './outcome.ts';

const tool = resolve(import.meta.dirname, '..');

/** `broken` only when the one test failed after the contract checker named a rule, and nothing else failed. */
function outcomeOfRun(modules: ReadonlyArray<TestModule>, unhandledErrors: ReadonlyArray<unknown>): Outcome {
  if (unhandledErrors.length > 0) return 'error';
  if (modules.some((module) => module.errors().length > 0)) return 'error';
  const tests = modules.flatMap((module) => [...module.children.allTests()]);
  const [test] = tests;
  if (tests.length !== 1 || !test) return 'error';
  const { state } = test.result();
  if (state === 'passed') return 'kept';
  return state === 'failed' && (test.meta() as ContractMeta).contractBroken === true ? 'broken' : 'error';
}

let outcome: Outcome = 'error';
const verdict: Reporter = {
  onTestRunEnd(testModules, unhandledErrors) {
    outcome = outcomeOfRun(testModules, unhandledErrors);
  },
};

try {
  const vitest = await startVitest(
    [],
    {
      ...shared.test,
      config: false,
      root: tool,
      include: ['dist/page.contract.js'],
      run: true,
      cache: false,
      fsModuleCache: false,
      // The page runs in a thread of this process, so the kill at the session's
      // time limit (`src/cli.ts`) ends it too. A child process would outlive it.
      pool: 'threads',
      // vitest adds github-actions by itself only when no reporter is named.
      reporters: ['default', ...(process.env.GITHUB_ACTIONS === 'true' ? ['github-actions' as const] : []), verdict],
      // Under node_modules vitest would hand the page contract to node, and node
      // would import the page, its CSS and the game's player without vite.
      server: { deps: { inline: ['@skkuverse/game-contract'] } },
    },
    { resolve: shared.resolve },
  );
  process.exitCode = SESSION_EXIT[outcome];
  await vitest.exit();
} catch (error) {
  console.error(error);
  process.exitCode = SESSION_EXIT.error;
}
