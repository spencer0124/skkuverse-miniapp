import { defineConfig } from 'tsup';

// The package ships JavaScript. Node refuses to run a .ts file under
// node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING), so the
// published bin cannot be the source. `platform` and `config` are entries of
// their own, with types, because @skkuverse/miniapp-contract serves a build with
// the headers `platform` defines and reads deploy.config.json through the parser
// `check` uses, so each has one owner.
export default defineConfig({
  entry: { cli: 'src/cli.ts', platform: 'src/platform.ts', config: 'src/config.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  clean: true,
  dts: { entry: { platform: 'src/platform.ts', config: 'src/config.ts' } },
});
