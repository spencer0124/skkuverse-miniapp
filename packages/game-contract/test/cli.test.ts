import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const cli = resolve(import.meta.dirname, '../dist/cli.js');
const scratch = mkdtempSync(join(tmpdir(), 'game-contract-cli-test-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function run(cwd: string) {
  return spawnSync(process.execPath, [cli], { cwd, encoding: 'utf8' });
}

describe('game-contract run from a folder', () => {
  it('fails when the folder holds no deploy.config.json, so a wrong working directory cannot pass', () => {
    const result = run(mkdtempSync(join(scratch, 'empty-')));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('no deploy.config.json');
  });

  it('passes in a repository that has no games', () => {
    const root = mkdtempSync(join(scratch, 'root-'));
    writeFileSync(join(root, 'deploy.config.json'), '{"apps":{},"games":{}}');
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('no games under games/');
  });
});
