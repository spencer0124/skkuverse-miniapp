/**
 * Builds the package before any test file runs. `cli.test.ts` and
 * `installed.test.ts` run `dist/`, the files that ship, so a run that skips
 * turbo's build (`pnpm --filter @skkuverse/game-contract test`) would test
 * whatever an older build left there.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

export default function setup(): void {
  const result = spawnSync('pnpm', ['run', 'build'], { cwd: resolve(import.meta.dirname, '..'), encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`pnpm run build exited ${result.status}\n${result.stdout}${result.stderr}`);
}
