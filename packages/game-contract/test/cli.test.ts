import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

/**
 * Plays one fixture page; `out` is stdout and stderr with vitest's colors taken
 * out. A run that outlives `timeout` is killed, so a hung runner fails the case.
 */
function play(fixture: string, env: Record<string, string> = {}, timeout = 60_000) {
  const result = spawnSync(process.execPath, [cli, '--entry', `${fixture}.ts`, '--html', html, '--name', fixture], {
    cwd: fixtures,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout,
  });
  return { status: result.status, out: `${result.stdout}${result.stderr}`.replace(/\x1b\[[0-9;]*m/g, '') };
}

describe('game-contract --help', () => {
  it.each(['--help', '-h'])('%s prints the usage on stdout and exits 0, from any folder', (flag) => {
    const result = run(mkdtempSync(join(scratch, 'help-')), flag);
    expect(result.stdout).toMatch(/^usage: game-contract \[<id>\.\.\.\]/);
    expect(result.stdout).toContain('--entry <module> --html <index.html>');
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });
});

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

  it('reads a page error named ContractBroken as a runner error, not as a verdict', () => {
    const { status, out } = play('forged-verdict');
    expect(out).toContain('a page error, not a verdict');
    expect(out).toContain('✗ runner error, contract not checked: forged-verdict; forged-verdict, host after onNoHost');
    expect(out).not.toContain('broke the game contract');
    expect(status).toBe(2);
  });
});

describe('game-contract on a page stuck in a loop', () => {
  const pidFile = join(scratch, 'busy-loop.pids');
  const pids = () => (existsSync(pidFile) ? readFileSync(pidFile, 'utf8').split('\n').filter(Boolean).map(Number) : []);
  const alive = (pid: number) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  };
  afterAll(() => {
    for (const pid of pids().filter(alive)) process.kill(pid, 'SIGKILL');
  });

  it('stops each session at the time limit, ends its process, and reports a runner error', () => {
    const { status, out } = play('busy-loop', { GAME_CONTRACT_SESSION_TIMEOUT_MS: '5000', BUSY_LOOP_PID_FILE: pidFile });
    expect(pids(), 'both sessions reached the loop').toHaveLength(2);
    expect(pids().filter(alive), 'processes still running the page').toEqual([]);
    expect(out).toContain('busy-loop did not finish within 5 s');
    expect(out).toContain('busy-loop, host after onNoHost did not finish within 5 s');
    expect(out).toContain('✗ runner error, contract not checked: busy-loop; busy-loop, host after onNoHost');
    expect(status).toBe(2);
  }, 90_000);
});

describe('game-contract on built games', () => {
  it('finds the module script by its attributes, in any order, with a src relative to the page', () => {
    const root = mkdtempSync(join(scratch, 'built-'));
    writeFileSync(join(root, 'deploy.config.json'), '{"apps":{},"games":{}}');
    const pages = {
      relative: '<script type="module" crossorigin src="./assets/index-a1b2c3d4.js"></script>',
      'src-first': '<script src="/assets/index-a1b2c3d4.js" type="module"></script>',
    };
    for (const [id, script] of Object.entries(pages)) {
      mkdirSync(join(root, 'games', id, 'dist', 'assets'), { recursive: true });
      writeFileSync(join(root, 'games', id, 'dist', 'index.html'), `<!doctype html><html lang="ko"><head>${script}</head><body><canvas id="game"></canvas></body></html>`);
      // A page that never sends game.ready: played, it breaks the contract on host-found.
      writeFileSync(join(root, 'games', id, 'dist', 'assets', 'index-a1b2c3d4.js'), 'export {};\n');
    }
    const result = run(root);
    const out = `${result.stdout}${result.stderr}`.replace(/\x1b\[[0-9;]*m/g, '');
    expect(out).not.toContain('loads no module script');
    expect(out).toContain('host-found: no game.ready');
    expect(out).toContain('✗ broke the game contract: relative; relative, host after onNoHost; src-first; src-first, host after onNoHost');
    expect(result.status).toBe(1);
  });
});

describe('game-contract on a page that breaks the contract', () => {
  it('names the rule and exits 1', () => {
    const { status, out } = play('double-over');
    expect(out).toContain('one-over-per-run');
    expect(out).toContain('✗ broke the game contract: double-over; double-over, host after onNoHost');
    expect(out).not.toContain('runner error');
    expect(status).toBe(1);
  });
});
