/**
 * The contract run of one page, which `src/cli.ts` names through the
 * environment: `CONTRACT_ENTRY` (the module to import), `CONTRACT_HTML` (its
 * index.html) and `CONTRACT_NAME`. One vitest process a page, because a page
 * pins the clock and the timers on its window for good.
 */
import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import { assertContract, runContract } from './harness';

const entry = process.env.CONTRACT_ENTRY;
const htmlFile = process.env.CONTRACT_HTML;
const name = process.env.CONTRACT_NAME ?? entry;
if (!entry || !htmlFile) throw new Error('run through `pnpm contract`, which sets CONTRACT_ENTRY and CONTRACT_HTML');

test(`${name} keeps the game contract`, async () => {
  const html = readFileSync(htmlFile, 'utf8');
  assertContract(await runContract({ html, load: () => import(/* @vite-ignore */ entry) }));
});
