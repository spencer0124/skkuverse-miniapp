import { defineConfig } from 'tsup';

// The package ships JavaScript, for the reason in ../cli/tsup.config.ts. The
// session and the page contract are entries of their own because `src/cli.ts`
// starts each session in a child process, which runs the page contract in vitest.
export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    session: 'src/session.ts',
    'page.contract': 'src/page.contract.ts',
  },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  clean: true,
});
