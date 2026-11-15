import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    platform: 'node',
    target: 'node22',
    dts: true,
    clean: true,
  },
  {
    // The half that runs in the page, as one classic script with the protocol parser inside:
    // a page cannot resolve a bare import, and the dev server only reads this file as text.
    // tsup names an iife `.global.js` unless told otherwise.
    entry: { 'host-entry': 'src/host-entry.ts' },
    format: ['iife'],
    platform: 'browser',
    target: 'es2019',
    noExternal: [/^@skkuverse\/miniapp/],
    outExtension: () => ({ js: '.js' }),
  },
]);
