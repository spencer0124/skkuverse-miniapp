import { defineConfig } from 'tsup';

// The package ships JavaScript. Node refuses to run a .ts file under
// node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING), so the
// published bin cannot be the source.
export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  clean: true,
});
