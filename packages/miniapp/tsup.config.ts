import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // The npm build. Three entries, so `./protocol` stays free of DOM and React
    // and `./react` is the only one that touches either peer.
    entry: {
      index: 'src/index.ts',
      'protocol/index': 'src/protocol/index.ts',
      'react/index': 'src/react/index.ts',
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
