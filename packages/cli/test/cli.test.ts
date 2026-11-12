import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, describe, it } from 'node:test';

/** The CLI as a user runs it: its own process, from a working directory. */
const cli = resolve(import.meta.dirname, '../src/cli.ts');
const scratch = mkdtempSync(join(tmpdir(), 'miniapp-cli-cli-test-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

function run(cwd: string, ...args: string[]) {
  // Node before 22.18 warns on stderr that type stripping is experimental; the published CLI is JavaScript.
  const node = ['--experimental-strip-types', '--disable-warning=ExperimentalWarning'];
  return spawnSync(process.execPath, [...node, cli, ...args], { cwd, encoding: 'utf8' });
}

/** A folder under the OS temp folder, with no deploy.config.json in it or above it. */
const folder = (prefix: string) => mkdtempSync(join(scratch, prefix));

describe('miniapp-cli help', () => {
  for (const args of [['--help'], ['-h'], ['help'], ['check', '--help']]) {
    it(`prints the usage to stdout and exits 0 on ${args.join(' ')}`, () => {
      const result = run(scratch, ...args);
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /^usage: miniapp-cli /);
      assert.equal(result.stderr, '');
    });
  }

  it('prints the usage to stderr and exits 1 on a command it does not know', () => {
    const result = run(scratch, 'deploy');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^usage: miniapp-cli /);
  });
});

describe('miniapp-cli --root', () => {
  it('works on the repository it names, whatever the working directory', () => {
    const root = folder('root-');
    writeFileSync(join(root, 'deploy.config.json'), '{"apps":{},"games":{}}');
    const elsewhere = folder('elsewhere-');
    const result = run(elsewhere, 'new', 'club', '--root', root);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(join(root, 'apps', 'club', 'package.json')));
    assert.ok(!existsSync(join(elsewhere, 'apps')));
  });

  it('fails with one line naming the folder when the folder holds no deploy.config.json', () => {
    const empty = folder('empty-');
    const result = run(scratch, 'check', '--root', empty);
    assert.equal(result.status, 1);
    assert.equal(result.stderr.trimEnd().split('\n').length, 1, result.stderr);
    assert.ok(result.stderr.includes(`no deploy.config.json in ${empty}`), result.stderr);
    assert.doesNotMatch(result.stderr, /ENOENT/);
  });
});

describe('miniapp-cli check --dir', () => {
  it('checks a miniapp with no repository around it', () => {
    const outside = folder('outside-');
    const dir = join(outside, 'club');
    mkdirSync(dir);
    const result = run(outside, 'check', '--dir', dir, '--id', 'club');
    // An empty folder breaks rules; the point is that the CLI checked it rather than asking for a repository.
    assert.match(result.stdout, /^✗ club /m);
    assert.equal(result.status, 1);
    assert.doesNotMatch(result.stderr, /deploy\.config\.json/);
  });
});
