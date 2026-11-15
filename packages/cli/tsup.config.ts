import { defineConfig } from 'tsup';

// The package ships JavaScript. Node refuses to run a .ts file under
// node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING), so the
// published bin cannot be the source. `platform` is an entry of its own, with
// types, because @skkuverse/miniapp-contract serves a build with the headers it
// defines, and so reads them from the one file that owns them.
export default defineConfig({
  entry: { cli: 'src/cli.ts', platform: 'src/platform.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  clean: true,
  dts: { entry: { platform: 'src/platform.ts' } },
});
