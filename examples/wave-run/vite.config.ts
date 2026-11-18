import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// ZzFX's MIT licence asks for its notice in every copy, and the minifier drops comments.
const notices = readFileSync(new URL('./THIRD_PARTY_NOTICES.txt', import.meta.url), 'utf8')
  .trim()
  .replace(/\*\//g, '* /');

const keepNotices: Plugin = {
  name: 'third-party-notices',
  generateBundle(_, bundle) {
    for (const file of Object.values(bundle)) if (file.type === 'chunk') file.code = `/*!\n${notices}\n*/\n${file.code}`;
  },
};

export default defineConfig({
  plugins: [keepNotices],
  build: {
    assetsInlineLimit: (file) => (file.endsWith('.png') ? true : undefined),
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', '../shared/**/*.test.ts'],
  },
});
