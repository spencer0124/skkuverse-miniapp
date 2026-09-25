import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // The npm build. `./protocol` stays free of DOM and React, `./react` of
    // `@skkuverse/ui`: only `./react/ui` imports it, so a page that uses the
    // hooks without the design system installs cleanly.
    entry: {
      index: 'src/index.ts',
      'protocol/index': 'src/protocol/index.ts',
      'react/index': 'src/react/index.ts',
      'react/ui/index': 'src/react/ui/index.ts',
    },
    format: ['esm'],
    dts: true,
    clean: true,
    target: 'es2022',
  },
  {
    // A single script exposing the core SDK as `window.SkkuverseMiniapp`. Not
    // published for anyone to load yet: it is the seed of the host-served
    // `miniapp-sdk/vN.js` in skkuverse-app ADR 0006, built from the same source
    // so the two can never disagree.
    entry: { 'miniapp-sdk': 'src/index.ts' },
    format: ['iife'],
    globalName: 'SkkuverseMiniapp',
    minify: true,
    target: 'es2019',
  },
]);
