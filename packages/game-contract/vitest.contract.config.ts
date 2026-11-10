import { defineConfig } from 'vitest/config';
import { shared } from './vitest.shared';

/** One built game, named by the environment `src/cli.ts` sets. */
export default defineConfig({ ...shared, test: { ...shared.test, include: ['dist/page.contract.js'] } });
