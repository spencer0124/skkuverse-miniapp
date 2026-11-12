/**
 * The contract run of one page, which `src/cli.ts` names through the
 * environment: `CONTRACT_ENTRY` (the module to import), `CONTRACT_HTML` (its
 * index.html), `CONTRACT_NAME`, `CONTRACT_PLAYER` (the game's player module,
 * when it has one) and `CONTRACT_HOST` (`late` for a host that appears only
 * after the page heard `onNoHost`). One vitest process a page, because a page pins
 * the clock and the timers on its window for good.
 */
import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import { assertContract, LATE_HOST_MS, runContract, type ContractPlayer } from './harness';
import type { ContractMeta } from './outcome.ts';

const entry = process.env.CONTRACT_ENTRY;
const htmlFile = process.env.CONTRACT_HTML;
const name = process.env.CONTRACT_NAME ?? entry;
const playerModule = process.env.CONTRACT_PLAYER;
const late = process.env.CONTRACT_HOST === 'late';
if (!entry || !htmlFile) throw new Error('run through `game-contract`, which sets CONTRACT_ENTRY and CONTRACT_HTML');

test(`${name} keeps the game contract${late ? `, the host after ${LATE_HOST_MS} ms` : ''}`, async ({ task }) => {
  const html = readFileSync(htmlFile, 'utf8');
  const player = playerModule
    ? ((await import(/* @vite-ignore */ playerModule)) as { default: ContractPlayer }).default
    : undefined;
  const result = await runContract(
    { html, load: () => import(/* @vite-ignore */ entry), ...(player ? { player } : {}) },
    late ? { hostDelayMs: LATE_HOST_MS } : {},
  );
  // What the session came to, for the log: each run's end as the page reported it.
  for (const m of result.host.messages) {
    if (m?.method !== 'game.over' || !('params' in m)) continue;
    const { score, hit, revives, revivesLeft, validator } = m.params as Record<string, unknown>;
    const line = `game.over score=${String(score)} hit=${String(hit)} revives=${String(revives)} revivesLeft=${String(revivesLeft)}`;
    // Not console.log, which vitest keeps to itself for a passing test.
    process.stdout.write(`${line}${validator ? ` validator=${String(validator)}` : ''}\n`);
  }
  try {
    assertContract(result);
  } catch (verdict) {
    (task.meta as ContractMeta).contractBroken = true;
    throw verdict;
  }
});
