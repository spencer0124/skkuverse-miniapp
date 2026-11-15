import { defineConfig } from 'tsup';

// The package ships JavaScript, for the reason in ../cli/tsup.config.ts.
export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  clean: true,
});
