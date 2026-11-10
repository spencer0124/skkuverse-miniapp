import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const cli = resolve(import.meta.dirname, '../dist/cli.js');
const fixtures = resolve(import.meta.dirname, 'fixtures');
const html = resolve(import.meta.dirname, '../../cli/templates/game/index.html');
const scratch = mkdtempSync(join(tmpdir(), 'game-contract-cli-test-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function run(cwd: string, ...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
}

/** Plays one fixture page; `out` is stdout and stderr with vitest's colors taken out. */
function play(fixture: string) {
  const result = run(fixtures, '--entry', `${fixture}.ts`, '--html', html, '--name', fixture);
  return { status: result.status, out: `${result.stdout}${result.stderr}`.replace(/\x1b\[[0-9;]*m/g, '') };
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

describe('game-contract on a page that fails outside the contract', () => {
  it('reports a throw in an input listener as a runner error, with its stack', () => {
    const { status, out } = play('press-throws');
    expect(out).toContain('TypeError: page bug in a press handler');
    expect(out).toMatch(/press-throws\.ts:\d+:\d+/);
    expect(out).toContain('✗ runner error, contract not checked: press-throws; press-throws, host after onNoHost');
    expect(out).not.toContain('broke the game contract');
    expect(status).toBe(2);
  });
});
