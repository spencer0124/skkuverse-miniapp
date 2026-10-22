import { fileURLToPath } from 'node:url';
import type { ViteUserConfig } from 'vitest/config';

/**
 * A source entry outside this package (the game template) imports
 * `@skkuverse/miniapp/*` from a folder with no node_modules of its own; it
 * resolves to this package's copy, the one the fake host comes from.
 */
const sdk = (subpath: string) => fileURLToPath(import.meta.resolve(`@skkuverse/miniapp/${subpath}`));

export const shared = {
  resolve: {
    alias: [{ find: /^@skkuverse\/miniapp\/game$/, replacement: sdk('game') }],
  },
  test: {
    environment: 'node',
    // A page pins the clock and the timers on its window; each file gets its own.
    isolate: true,
    testTimeout: 120_000,
  },
} satisfies ViteUserConfig;
