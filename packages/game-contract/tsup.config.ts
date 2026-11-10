import { defineConfig } from 'tsup';

// The package ships JavaScript, for the reason in ../cli/tsup.config.ts. The
// page contract and the vitest config are entries of their own because
// `src/cli.ts` starts vitest on them in a child process.
export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    'page.contract': 'src/page.contract.ts',
    'vitest.contract.config': 'vitest.contract.config.ts',
  },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  clean: true,
});
