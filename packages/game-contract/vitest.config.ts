import { defineConfig } from 'vitest/config';
import { shared } from './vitest.shared';

/** The runner's own tests: the template keeps the contract, the broken fixture does not. */
export default defineConfig({ ...shared, test: { ...shared.test, include: ['test/**/*.test.ts'] } });
