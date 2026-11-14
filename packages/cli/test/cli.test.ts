import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
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

describe('miniapp-cli check --json', () => {
  const FIELDS = ['id', 'kind', 'level', 'message', 'rule', 'spec'];

  /** A repository with the scaffolded miniapp `club` registered, and `react` dropped from its package.json (S2). */
  function repoBreakingS2(): string {
    const root = folder('json-');
    writeFileSync(join(root, 'deploy.config.json'), JSON.stringify({ apps: { club: { project: 'miniapp-club' } }, games: {} }));
    assert.equal(run(root, 'new', 'club').status, 0);
    const file = join(root, 'apps', 'club', 'package.json');
    const pkg = JSON.parse(readFileSync(file, 'utf8'));
    delete pkg.dependencies.react;
    writeFileSync(file, JSON.stringify(pkg));
    return root;
  }

  it('prints an empty array and exits 0 when no package breaks a rule', () => {
    const root = folder('json-empty-');
    writeFileSync(join(root, 'deploy.config.json'), '{"apps":{},"games":{}}');
    const result = run(root, 'check', '--json');
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), []);
    assert.equal(result.stderr, '');
  });

  it('prints each finding with its package, kind, rule, level, message and spec heading, and exits 1', () => {
    const result = run(repoBreakingS2(), 'check', 'club', '--json');
    assert.equal(result.status, 1);
    assert.equal(result.stderr, '');
    const findings: Record<string, unknown>[] = JSON.parse(result.stdout);
    for (const finding of findings) assert.deepEqual(Object.keys(finding).sort(), FIELDS);
    // One finding to a line between the brackets, so a long list stays short to read and to grep.
    assert.equal(result.stdout.trimEnd().split('\n').length, findings.length + 2);
    assert.deepEqual(
      findings.filter((finding) => finding.rule === 'S2'),
      [
        {
          id: 'club',
          kind: 'app',
          rule: 'S2',
          level: 'error',
          message: 'package.json does not depend on react',
          spec: 'docs/reference/miniapp-spec.md#package',
        },
      ],
    );
  });

  it('keeps a finding on one line when a file name holds a line separator', () => {
    const root = repoBreakingS2();
    const assets = join(root, 'apps', 'club', 'dist', 'assets');
    mkdirSync(assets, { recursive: true });
    writeFileSync(join(assets, 'logo\u2028v2.png'), '');
    const result = run(root, 'check', 'club', '--json');
    const findings: { message: string }[] = JSON.parse(result.stdout);
    assert.ok(findings.some((finding) => finding.message.includes('\u2028')), 'the file name reaches a message');
    // U+0085, U+2028 and U+2029 end a line for a reader that splits on Unicode line breaks.
    assert.equal(result.stdout.trimEnd().split(/[\n\u0085\u2028\u2029]/).length, findings.length + 2);
  });

  it('lists the findings of the text output, in its order', () => {
    const root = repoBreakingS2();
    const text = run(root, 'check', 'club')
      .stdout.split('\n')
      .filter((line) => /^[✗!] /.test(line))
      .map((line) => line.slice(2));
    const json: { id: string; rule: string; message: string }[] = JSON.parse(run(root, 'check', 'club', '--json').stdout);
    assert.ok(text.length > 1, 'the fixture breaks more than one rule');
    assert.deepEqual(json.map((f) => `${f.id} ${f.rule} ${f.message}`), text);
  });

  it('prints the findings of a package outside the repository under its id and kind', () => {
    const outside = folder('json-outside-');
    const dir = join(outside, 'club');
    mkdirSync(dir);
    const repo = folder('json-repo-');
    writeFileSync(join(repo, 'deploy.config.json'), '{"apps":{},"games":{}}');
    const kinds = [
      { flags: [], kind: 'app' },
      { flags: ['--kind', 'game', '--root', repo], kind: 'game' },
    ];
    for (const { flags, kind } of kinds) {
      const result = run(outside, 'check', '--dir', dir, '--id', 'club', ...flags, '--json');
      assert.equal(result.status, 1, result.stderr);
      const findings: { id: string; kind: string }[] = JSON.parse(result.stdout);
      assert.ok(findings.length > 0);
      assert.ok(findings.every((finding) => finding.id === 'club' && finding.kind === kind), kind);
    }
  });

  it('tells the findings of an app and a game that share an id apart', () => {
    const root = folder('json-shared-');
    writeFileSync(join(root, 'deploy.config.json'), JSON.stringify({ apps: { dup: { project: 'miniapp-dup' } }, games: { dup: { project: 'game-dup' } } }));
    assert.equal(run(root, 'new', 'dup').status, 0);
    // `new` refuses a game with the id of a miniapp, so the clash is made by renaming the folder.
    assert.equal(run(root, 'new', '--kind', 'game', 'other').status, 0);
    renameSync(join(root, 'games', 'other'), join(root, 'games', 'dup'));
    const findings: { id: string; kind: string; rule: string }[] = JSON.parse(run(root, 'check', 'dup', '--json').stdout);
    // Neither package is installed, so each reports S4 under the same id and the same message.
    assert.deepEqual(findings.filter((f) => f.rule === 'S4').map((f) => f.kind).sort(), ['app', 'game']);
  });

  it('prints an error to stderr and nothing to stdout when a package does not exist', () => {
    const result = run(repoBreakingS2(), 'check', 'nope', '--json');
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /apps\/nope or games\/nope does not exist/);
  });

  it('is refused by the commands that have no JSON output', () => {
    const root = repoBreakingS2();
    for (const args of [['new', 'other', '--json'], ['ship', 'nope', '--json']]) {
      const result = run(root, ...args);
      assert.equal(result.status, 1, args.join(' '));
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /--json is only for check/, args.join(' '));
    }
    assert.ok(!existsSync(join(root, 'apps', 'other')));
  });
});
