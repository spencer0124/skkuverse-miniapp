/**
 * The tag backfill on a fixture repository with a real pnpm workspace and a fake registry. In the fixture's history,
 * `packages/cli` holds 0.1.0 under an older name on day 1, then as `@skkuverse/miniapp-cli` holds 0.1.0 from day 2 to
 * day 4 (day 3 changes only the docs) and 0.2.0 on day 5. The fake registry serves 0.1.0 as built on day 2 and
 * published on day 4, 0.2.0 with one built byte changed, and a 0.0.0-stage that no commit holds.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import {
  candidates,
  changelogSection,
  createBuilder,
  differingFiles,
  githubRepo,
  NO_COMMIT,
  unstableFiles,
  packageTable,
  provenance,
  push,
  releaseRepository,
  remoteTags,
  RULE,
  serialize,
  tagPlan,
} from '../scripts/backfill-tags.mjs';

const root = path.join(import.meta.dirname, '../../..');
const CLI = '@skkuverse/miniapp-cli';
const GH_REPO = 'fixture-owner/fixture-repo';
const CHANGELOG = `# ${CLI}\n\n## 0.2.0\n\n### Minor Changes\n\n- Say two.\n\n## 0.1.0\n\n### Minor Changes\n\n- Say one.\n`;

const sh = (cwd, cmd, args, env = {}) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...env } });
const day = (n) => `2026-01-${String(n).padStart(2, '0')}T00:00:00Z`;
const git = (cwd, ...args) => sh(cwd, 'git', args);

function write(dir, files) {
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  }
}

function commit(dir, n, message, files, paths = Object.keys(files)) {
  write(dir, files);
  git(dir, 'add', '--', ...paths);
  sh(dir, 'git', ['commit', '-q', '-m', message], { GIT_AUTHOR_DATE: day(n), GIT_COMMITTER_DATE: day(n) });
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
let gh;
let calls;
let failNext;

before(() => {
  // Every remote the fixture names is on github.com; insteadOf sends origin to a local bare repository, and this keeps a
  // broken guard from pushing anywhere else.
  process.env.GIT_ALLOW_PROTOCOL = 'file';
  work = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-test-'));
  dir = path.join(work, 'repo');
  fs.mkdirSync(dir);
  git(dir, 'init', '-q', '-b', 'main');
  // A CI runner has no git identity, and push runs `git tag -a` in this repository, so `-c` flags on the test's own calls are not enough.
  for (const [key, value] of [['user.name', 'fixture'], ['user.email', 'fixture@example.com'], ['commit.gpgsign', 'false'], ['tag.gpgsign', 'false']]) {
    git(dir, 'config', key, value);
  }
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

  // origin names a GitHub repository, and git reaches it in a local bare repository.
  const remote = path.join(work, 'remote.git');
  git(work, 'init', '-q', '--bare', remote);
  git(dir, 'remote', 'add', 'origin', `https://github.com/${GH_REPO}.git`);
  git(dir, 'config', `url.${remote}.insteadOf`, `https://github.com/${GH_REPO}.git`);
  calls = path.join(work, 'gh-calls');
  failNext = path.join(work, 'gh-fail-next');
  gh = path.join(work, 'gh');
  fs.writeFileSync(
    gh,
    [
      '#!/bin/sh',
      `if [ -e '${failNext}' ]; then rm '${failNext}'; exit 1; fi`,
      `echo "$@" >> '${calls}'`,
      `if [ "$1 $2" = "release view" ]; then grep -q "^release create $3 " '${calls}' && exit 0; echo 'release not found' >&2; exit 1; fi`,
      `for notes; do :; done; cat "$notes" >> '${calls}'`,
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
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

  it('names a file whose mode differs, also where the umask would mask the difference on extraction', () => {
    // pnpm pack writes 0644 for every file outside `bin`, so the tarball is repacked by hand.
    for (const mode of [0o755, 0o664]) {
      const tree = fs.mkdtempSync(path.join(work, 'mode-'));
      sh(tree, 'tar', ['-xpzf', published[`${CLI}@0.1.0`]]);
      fs.chmodSync(path.join(tree, 'package/dist/out.txt'), mode);
      sh(tree, 'tar', ['-czf', path.join(tree, 'mode.tgz'), 'package']);
      assert.deepEqual(differingFiles(published[`${CLI}@0.1.0`], path.join(tree, 'mode.tgz')), ['dist/out.txt'], mode.toString(8));
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
    assert.deepEqual(tagPlan(records, new Map([[tag.tag, { commit: sha.first, annotated: true }]])), { create: [], present: [tag] });
    assert.throws(() => tagPlan(records, new Map([[tag.tag, { commit: sha.second, annotated: true }]])), /already exists at/);
    assert.throws(() => tagPlan(records, new Map([[tag.tag, { commit: sha.first, annotated: false }]])), /lightweight/);
  });

  it('reads the GitHub repository from a github.com remote URL, and refuses any other host', () => {
    const valid = [
      'https://github.com/o/r.git',
      'https://github.com/o/r',
      'https://github.com/o/r/',
      'https://github.com/o/r.git/',
      'git@github.com:o/r.git',
      'git@github.com:o/r',
      'ssh://git@github.com/o/r.git',
      'ssh://git@github.com:22/o/r.git',
      'ssh://git@github.com/o/r',
    ];
    for (const url of valid) assert.equal(githubRepo(url), 'o/r', url);
    assert.equal(githubRepo('https://github.com/my-org/my.repo_2.git'), 'my-org/my.repo_2');
    const invalid = [
      'git@notgithub.com:o/r.git',
      'https://mygithub.com/o/r.git',
      'https://evil.example/github.com/o/r.git',
      'https://github.com.evil.example/o/r.git',
      'https://github.com/o/r.git.git',
      'https://github.com/o/r/extra',
      'http://github.com/o/r.git',
      'https://user@github.com/o/r.git',
      '/srv/git/r.git',
    ];
    for (const url of invalid) assert.throws(() => githubRepo(url), /not a GitHub repository URL/, url);
  });

  it('pushes nothing when a tag it would push is lightweight, locally or on the remote, or a package is gone from HEAD', () => {
    const records = provenance(dir, 'HEAD', { registry, builder });
    const tag = `${CLI}@0.1.0`;

    git(dir, 'tag', tag, sha.docs);
    assert.throws(() => push(dir, records, { gh }), /local .* is a lightweight tag/);
    git(dir, 'push', '-q', 'origin', `refs/tags/${tag}`);
    git(dir, 'tag', '-d', tag);
    assert.deepEqual([...remoteTags(dir, 'origin')], [[tag, { commit: sha.docs, annotated: false }]]);
    assert.throws(() => push(dir, records, { gh }), /exists as a lightweight tag/);
    git(dir, 'push', '-q', 'origin', `:refs/tags/${tag}`);

    const gone = { name: '@skkuverse/gone', version: '1.0.0', reproducible: true, tag: '@skkuverse/gone@1.0.0', commit: sha.first, rule: RULE };
    assert.throws(() => push(dir, [...records, gone], { gh }), /@skkuverse\/gone is not a package at HEAD/);

    assert.deepEqual([...remoteTags(dir, 'origin')], []);
    assert.equal(git(dir, 'tag', '--list').trim(), '');
    assert.equal(fs.existsSync(calls), false, 'gh was never called');
  });

  it('pushes nothing when git would push somewhere other than the repository the remote\'s URL names', () => {
    const records = provenance(dir, 'HEAD', { registry, builder });
    const url = `https://github.com/${GH_REPO}.git`;
    const mirror = 'https://github.com/o/mirror.git';
    const withConfig = (entries, check) => {
      for (const [key, value] of entries) git(dir, 'config', '--add', key, value);
      try {
        check();
      } finally {
        for (const [key, value] of entries) git(dir, 'config', '--fixed-value', '--unset', key, value);
      }
    };
    const refusals = [
      ['origin', /origin has 2 urls/, ['remote.origin.url', mirror]],
      ['origin', /origin has 2 push URLs/, ['remote.origin.pushurl', url], ['remote.origin.pushurl', mirror]],
      ['origin', /but git pushes it to https:\/\/github\.com\/o\/mirror\.git$/, ['remote.origin.pushurl', mirror]],
      ['origin', /but git pushes it to https:\/\/github\.com\/o\/fixture-owner\//, ['url.https://github.com/o/.pushInsteadOf', 'https://github.com/']],
      ['origin', /but ls-remote reads/, ['remote.origin.pushurl', path.join(work, 'other.git')]],
      [
        'source',
        /source is https:\/\/github\.com\/o\/source\.git, but git pushes it to https:\/\/github\.com\/o\/mirror\.git$/,
        ['remote.source.url', 'https://github.com/o/source.git'],
        [`url.${mirror}.insteadOf`, 'https://github.com/o/source.git'],
      ],
    ];
    for (const [remote, error, ...entries] of refusals) withConfig(entries, () => assert.throws(() => push(dir, records, { gh, remote }), error));

    const gone = { name: '@skkuverse/gone', version: '1.0.0', reproducible: true, tag: '@skkuverse/gone@1.0.0', commit: sha.first, rule: RULE };
    const harmless = [['remote.origin.pushurl', url], ['url.https://gitlab.com/o/.pushInsteadOf', 'https://gitlab.com/']];
    withConfig(harmless, () =>
      assert.throws(() => push(dir, [...records, gone], { gh }), /@skkuverse\/gone is not a package at HEAD/, 'a pushurl equal to the url, and a pushInsteadOf for another host, pass'),
    );
    const ssh = [['remote.ssh.url', 'https://github.com/o/r.git'], ['url.git@github.com:.insteadOf', 'https://github.com/']];
    withConfig(ssh, () => assert.equal(releaseRepository(dir, 'ssh'), 'o/r', 'a rewrite to the same repository over ssh passes'));
    assert.equal(releaseRepository(dir, 'origin'), GH_REPO, 'a rewrite to a local path passes');

    assert.deepEqual([...remoteTags(dir, 'origin')], []);
    assert.equal(git(dir, 'tag', '--list').trim(), '');
    assert.equal(fs.existsSync(calls), false, 'gh was never called');
  });

  it('runs as a command through a symlink, and does nothing when only imported', () => {
    const script = path.join(import.meta.dirname, '../scripts/backfill-tags.mjs');
    const link = path.join(work, 'linked-backfill-tags.mjs');
    fs.symlinkSync(script, link);
    const usage = spawnSync('node', [link], { encoding: 'utf8' });
    assert.equal(usage.status, 2, usage.stderr);
    assert.match(usage.stderr, /^usage: backfill-tags/);

    const imported = spawnSync('node', ['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(script).href)})`], { encoding: 'utf8' });
    assert.equal(imported.status, 0, imported.stderr);
    assert.equal(imported.stderr, '');
  });

  it('pushes an annotated tag and a release with the CHANGELOG section, once, and creates a release a stopped run left out', () => {
    const records = provenance(dir, 'HEAD', { registry, builder });
    const tag = `${CLI}@0.1.0`;
    const atDocs = [[tag, { commit: sha.docs, annotated: true }]];

    git(dir, 'config', 'push.followTags', 'true');
    git(dir, 'tag', '-a', 'unplanned', sha.first, '-m', 'an annotated tag on an ancestor of the tagged commit');
    fs.writeFileSync(failNext, '');
    assert.throws(() => push(dir, records, { gh }), /release create/, 'gh fails after the tag push');
    assert.deepEqual([...remoteTags(dir, 'origin')], atDocs);

    push(dir, records, { gh });
    push(dir, records, { gh });

    assert.deepEqual([...remoteTags(dir, 'origin')], atDocs);
    assert.doesNotMatch(git(dir, 'ls-remote', '--tags', 'origin'), /unplanned/, 'push.followTags carries no other tag along');
    assert.equal(git(dir, 'cat-file', '-t', tag).trim(), 'tag', 'the tag is annotated');
    assert.match(git(dir, 'cat-file', '-p', tag), new RegExp(`${tag} ${RULE} at ${sha.docs}`));
    const logged = fs.readFileSync(calls, 'utf8');
    const ghCalls = logged.split('\n').filter((line) => line.startsWith('release '));
    assert.deepEqual(
      ghCalls.map((line) => line.split(' ').slice(0, 2).join(' ')),
      ['release view', 'release create', 'release view'],
      'the next run creates the release the stopped run left out, and a third creates nothing',
    );
    for (const line of ghCalls) assert.match(line, new RegExp(` -R ${GH_REPO} `), 'gh releases in the repository git pushes to');
    assert.match(logged, new RegExp(`^release create ${tag} -R ${GH_REPO} --verify-tag --latest=false --title ${tag} --notes-file \\S+\\n### Minor Changes\\n\\n- Say one\\.\\n`, 'm'));
  });
});
