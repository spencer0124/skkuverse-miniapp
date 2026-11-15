/**
 * The tag backfill on a fixture repository with a real pnpm workspace and a fake registry. In the fixture's history,
 * `packages/cli` holds 0.1.0 under an older name on day 1, then as `@skkuverse/miniapp-cli` holds 0.1.0 from day 2 to
 * day 4 (day 3 changes only the docs) and 0.2.0 on day 5. The fake registry serves 0.1.0 as built on day 2 and
 * published on day 4, 0.2.0 with one built byte changed, and a 0.0.0-stage that no commit holds.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  candidates,
  changelogSection,
  createBuilder,
  differingFiles,
  NO_COMMIT,
  unstableFiles,
  packageTable,
  provenance,
  push,
  remoteTags,
  RULE,
  serialize,
  tagPlan,
} from '../scripts/backfill-tags.mjs';

const root = path.join(import.meta.dirname, '../../..');
const CLI = '@skkuverse/miniapp-cli';
const CHANGELOG = `# ${CLI}\n\n## 0.2.0\n\n### Minor Changes\n\n- Say two.\n\n## 0.1.0\n\n### Minor Changes\n\n- Say one.\n`;

const sh = (cwd, cmd, args, env = {}) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...env } });
const day = (n) => `2026-01-${String(n).padStart(2, '0')}T00:00:00Z`;
const IDENTITY = ['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false'];
const git = (cwd, ...args) => sh(cwd, 'git', [...IDENTITY, ...args]);

function write(dir, files) {
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  }
}

function commit(dir, n, message, files, paths = Object.keys(files)) {
  write(dir, files);
  git(dir, 'add', '--', ...paths);
  sh(dir, 'git', [...IDENTITY, 'commit', '-q', '-m', message], { GIT_AUTHOR_DATE: day(n), GIT_COMMITTER_DATE: day(n) });
  return git(dir, 'rev-parse', 'HEAD').trim();
}

const manifest = (name, version, extra = {}) => `${JSON.stringify({ name, version, files: ['dist'], scripts: { build: 'node build.mjs' }, ...extra }, null, 2)}\n`;
const BUILD = "import fs from 'node:fs';\nfs.mkdirSync('dist', { recursive: true });\nfs.copyFileSync('src.txt', 'dist/out.txt');\n";

let dir;
let work;
const sha = {};
const published = {};
const asked = [];
const RELEASES = [
  { version: '0.0.0-stage', time: day(1) },
  { version: '0.1.0', time: '2026-01-04T12:00:00Z' },
  { version: '0.2.0', time: '2026-01-05T12:00:00Z' },
];
const registry = {
  releases(name) {
    asked.push(name);
    return name === CLI ? RELEASES : [];
  },
  tarball: (name, version) => published[`${name}@${version}`],
};
let builder;

before(() => {
  work = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-test-'));
  dir = path.join(work, 'repo');
  fs.mkdirSync(dir);
  git(dir, 'init', '-q', '-b', 'main');
  const { packageManager } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  write(dir, {
    'package.json': `${JSON.stringify({ name: 'fixture', private: true, packageManager })}\n`,
    'pnpm-workspace.yaml': 'packages:\n  - "packages/*"\n',
    'packages/cli/package.json': manifest('skkuverse-cli', '0.1.0'),
    'packages/cli/build.mjs': BUILD,
    'packages/cli/src.txt': 'one\n',
    'packages/cli/CHANGELOG.md': CHANGELOG,
    'packages/checks/package.json': manifest('checks', '0.0.0', { private: true }),
  });
  sh(dir, 'pnpm', ['install', '--lockfile-only']);
  commit(dir, 1, 'start', {}, ['.']);
  sha.first = commit(dir, 2, 'name the CLI for npm', { 'packages/cli/package.json': manifest(CLI, '0.1.0') });
  sha.docs = commit(dir, 3, 'docs only', { 'docs/guide.md': '# Guide\n' });
  sha.second = commit(dir, 4, 'change the source, same version', { 'packages/cli/src.txt': 'one, again\n' });
  sha.bump = commit(dir, 5, 'version 0.2.0', { 'packages/cli/package.json': manifest(CLI, '0.2.0'), 'packages/cli/src.txt': 'two\n' });

  builder = createBuilder(dir);
  published[`${CLI}@0.1.0`] = builder.pack(sha.first, CLI);
  const tamper = createBuilder(dir, { afterBuild: (tree) => fs.appendFileSync(path.join(tree, 'packages/cli/dist/out.txt'), 'x') });
  const tampered = tamper.pack(sha.bump, CLI);
  published[`${CLI}@0.2.0`] = path.join(work, 'published-0.2.0.tgz');
  fs.copyFileSync(tampered, published[`${CLI}@0.2.0`]);
  tamper.dispose();
});

after(() => {
  builder?.dispose();
  fs.rmSync(work, { recursive: true, force: true });
});

describe('backfill-tags', () => {
  it('maps packages/cli to its npm name and leaves private packages out', () => {
    assert.deepEqual(packageTable(dir, 'HEAD'), [{ dir: 'cli', name: CLI }]);
  });

  it('finds the commits that hold a version under its npm name, and keeps one of commits with the same build inputs', () => {
    const cli = { dir: 'cli', name: CLI };
    assert.deepEqual(candidates(dir, 'HEAD', cli, '0.2.0', day(9)), [sha.bump]);
    assert.deepEqual(candidates(dir, 'HEAD', cli, '0.0.0-stage', day(9)), []);
  });

  it('tries the newest commit made by the publish time first, then later commits, oldest first', () => {
    const cli = { dir: 'cli', name: CLI };
    assert.deepEqual(candidates(dir, 'HEAD', cli, '0.1.0', day(9)), [sha.second, sha.docs], 'the docs commit stands for the first');
    assert.deepEqual(candidates(dir, 'HEAD', cli, '0.1.0', '2026-01-02T12:00:00Z'), [sha.first, sha.second]);
    assert.deepEqual(candidates(dir, 'HEAD', cli, '0.1.0', day(1)), [sha.first, sha.second]);
  });

  it('builds one commit twice to the same files', () => {
    assert.deepEqual(unstableFiles(dir, 'HEAD', builder), []);
  });

  it('records a match, a mismatch with its closest commit and files, and a version no commit holds', () => {
    asked.length = 0;
    const records = provenance(dir, 'HEAD', { registry, builder });

    assert.deepEqual(asked, [CLI], 'asks npm for @skkuverse/miniapp-cli, never for the directory name');
    assert.deepEqual(records, [
      { name: CLI, version: '0.0.0-stage', reproducible: false, closest: null, reason: NO_COMMIT },
      { name: CLI, version: '0.1.0', reproducible: true, tag: `${CLI}@0.1.0`, commit: sha.docs, rule: RULE },
      { name: CLI, version: '0.2.0', reproducible: false, closest: sha.bump, differing: ['dist/out.txt'] },
    ]);
    assert.equal(serialize(provenance(dir, 'HEAD', { registry, builder })), serialize(records), 'a second run writes the same bytes');
  });

  it('names a file only one tarball holds as differing', () => {
    const extra = createBuilder(dir, { afterBuild: (tree) => fs.writeFileSync(path.join(tree, 'packages/cli/dist/extra.txt'), '') });
    try {
      assert.deepEqual(differingFiles(published[`${CLI}@0.1.0`], extra.pack(sha.first, CLI)), ['dist/extra.txt']);
    } finally {
      extra.dispose();
    }
  });

  it('cuts one version out of a Changesets CHANGELOG', () => {
    assert.equal(changelogSection(CHANGELOG, '0.2.0'), '### Minor Changes\n\n- Say two.');
    assert.equal(changelogSection(CHANGELOG, '0.1.0'), '### Minor Changes\n\n- Say one.');
    assert.equal(changelogSection(CHANGELOG, '0.0.0-stage'), null);
  });

  it('plans tags for reproducible records only, and stops on a tag the remote holds at another commit', () => {
    const records = [
      { name: CLI, version: '0.0.0-stage', reproducible: false, closest: null, reason: NO_COMMIT },
      { name: CLI, version: '0.1.0', reproducible: true, tag: `${CLI}@0.1.0`, commit: sha.first, rule: RULE },
      { name: CLI, version: '0.2.0', reproducible: false, closest: sha.bump, differing: ['dist/out.txt'] },
    ];
    const tag = { tag: `${CLI}@0.1.0`, commit: sha.first };
    assert.deepEqual(tagPlan(records, new Map()), { create: [tag], present: [] });
    assert.deepEqual(tagPlan(records, new Map([[tag.tag, sha.first]])), { create: [], present: [tag] });
    assert.throws(() => tagPlan(records, new Map([[`${CLI}@0.1.0`, sha.second]])), /already exists at/);
  });

  it('pushes an annotated tag and a release with the CHANGELOG section, once', () => {
    const remote = path.join(work, 'remote.git');
    git(work, 'init', '-q', '--bare', remote);
    git(dir, 'remote', 'add', 'origin', remote);
    const calls = path.join(work, 'gh-calls');
    const gh = path.join(work, 'gh');
    fs.writeFileSync(gh, `#!/bin/sh\nnotes=$(eval echo \\$$#)\n{ echo "$@"; cat "$notes"; } >> '${calls}'\n`, { mode: 0o755 });
    const records = provenance(dir, 'HEAD', { registry, builder });

    push(dir, records, { gh });
    push(dir, records, { gh });

    const tag = `${CLI}@0.1.0`;
    assert.deepEqual([...remoteTags(dir, 'origin')], [[tag, sha.docs]]);
    assert.equal(git(dir, 'cat-file', '-t', tag).trim(), 'tag', 'the tag is annotated');
    assert.match(git(dir, 'cat-file', '-p', tag), new RegExp(`${tag} ${RULE} at ${sha.docs}`));
    const logged = fs.readFileSync(calls, 'utf8');
    assert.equal(logged.match(/^release create/gm).length, 1, 'a second push releases nothing again');
    assert.match(logged, new RegExp(`^release create ${tag} --verify-tag --title ${tag} --notes-file \\S+\\n### Minor Changes\\n\\n- Say one\\.\\n`, 'm'));
  });
});
