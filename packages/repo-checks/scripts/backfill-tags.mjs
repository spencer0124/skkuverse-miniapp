/**
 * Records, for each version npm lists, the commit that rebuilds it byte for byte, or the closest commit and the files
 * that differ, or why no commit could be tried. A rebuild matches when its tarball holds the same files with the same
 * contents and modes as the one npm serves; the .tgz bytes themselves are not compared. Only a version that rebuilds
 * byte for byte gets a tag.
 *
 *     pnpm --filter repo-checks backfill-tags --dry-run   print the records and the tag plan, write nothing
 *     pnpm --filter repo-checks backfill-tags --write     write release-provenance.json
 *     pnpm --filter repo-checks backfill-tags --push      tag, push and release what release-provenance.json names
 *
 * `--ref <rev>` names the history the first two search, `origin/main` by default. `--push` refuses an origin that git
 * resolves to a local path unless BACKFILL_ALLOW_LOCAL_REMOTE=1, which only a rehearsal sets.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const RULE = 'rebuilds byte for byte';
export const NO_COMMIT = 'no commit holds this version';
export const PROVENANCE = 'packages/repo-checks/release-provenance.json';
const TAG_PREFIX = 'refs/tags/@skkuverse/';
const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

const run = (cmd, args, cwd, input) =>
  execFileSync(cmd, args, { cwd, input, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['pipe', 'pipe', 'pipe'] });
const git = (repo, ...args) => run('git', ['-C', repo, ...args]);

function readBlobs(repo, specs) {
  if (specs.length === 0) return [];
  const out = execFileSync('git', ['-C', repo, 'cat-file', '--batch'], { input: `${specs.join('\n')}\n`, maxBuffer: 1 << 28 });
  const blobs = [];
  let at = 0;
  for (let i = 0; i < specs.length; i++) {
    const eol = out.indexOf(10, at);
    const header = out.subarray(at, eol).toString();
    at = eol + 1;
    if (header.endsWith(' missing')) {
      blobs.push(null);
      continue;
    }
    const size = Number(header.split(' ')[2]);
    blobs.push(out.subarray(at, at + size).toString());
    at += size + 1;
  }
  return blobs;
}

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export function packageTable(repo, ref) {
  const dirs = git(repo, 'ls-tree', '--name-only', `${ref}:packages`).split('\n').filter(Boolean);
  const manifests = readBlobs(repo, dirs.map((dir) => `${ref}:packages/${dir}/package.json`)).map(parseJson);
  return dirs
    .map((dir, i) => ({ dir, json: manifests[i] }))
    .filter(({ json }) => json !== null && json.private !== true)
    .map(({ dir, json }) => ({ dir, name: json.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * A version was built from a tree that existed when it was published, so the newest commit at or before the publish
 * time goes first, back to the oldest, and only then the later commits. Of commits with the same build inputs, only
 * the first is built.
 */
export function candidates(repo, ref, { dir, name }, version, publishedAt) {
  const commits = git(repo, 'log', '--topo-order', '--reverse', '--format=%H %ct', ref)
    .split('\n')
    .filter(Boolean)
    .map((line) => ({ sha: line.slice(0, 40), time: Number(line.slice(41)) * 1000 }));
  const manifests = readBlobs(repo, commits.map(({ sha }) => `${sha}:packages/${dir}/package.json`)).map(parseJson);
  const holding = commits.filter((_, i) => manifests[i]?.name === name && manifests[i]?.version === version);
  const cutoff = Date.parse(publishedAt);
  const before = holding.filter(({ time }) => time <= cutoff).reverse();
  const after = holding.filter(({ time }) => time > cutoff);
  const seen = new Set();
  return [...before, ...after]
    .map(({ sha }) => sha)
    .filter((sha) => {
      const key = buildInputsHash(repo, sha, dir);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function workspaceClosure(repo, sha, dir) {
  const dirs = git(repo, 'ls-tree', '--name-only', `${sha}:packages`).split('\n').filter(Boolean);
  const manifests = readBlobs(repo, dirs.map((d) => `${sha}:packages/${d}/package.json`)).map(parseJson);
  const dirOf = new Map(dirs.map((d, i) => [manifests[i]?.name, d]));
  const closure = new Set([dir]);
  for (const queue = [dir]; queue.length > 0; ) {
    const json = manifests[dirs.indexOf(queue.pop())] ?? {};
    for (const field of DEP_FIELDS) {
      for (const [dep, spec] of Object.entries(json[field] ?? {})) {
        const depDir = dirOf.get(dep);
        if (String(spec).startsWith('workspace:') && depDir !== undefined && !closure.has(depDir)) {
          closure.add(depDir);
          queue.push(depDir);
        }
      }
    }
  }
  return [...closure].sort();
}

function buildInputsHash(repo, sha, dir) {
  const trees = workspaceClosure(repo, sha, dir).map((d) => `${d} ${git(repo, 'rev-parse', `${sha}:packages/${d}`).trim()}`);
  const rootFilesButMarkdown = git(repo, 'ls-tree', sha)
    .split('\n')
    .filter((line) => line.includes(' blob ') && !line.endsWith('.md'));
  return crypto.createHash('sha256').update([...trees, ...rootFilesButMarkdown].join('\n')).digest('hex');
}

export function fileHashes(tarball) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-extract-'));
  try {
    run('tar', ['-xpzf', tarball, '-C', dir]);
    const hashes = new Map();
    for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const full = path.join(entry.parentPath, entry.name);
      const inside = path.relative(dir, full).split(path.sep).slice(1).join('/');
      const mode = (fs.statSync(full).mode & 0o777).toString(8);
      hashes.set(inside, `${mode} ${crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex')}`);
    }
    return hashes;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function differingFiles(a, b) {
  const [left, right] = [fileHashes(a), fileHashes(b)];
  const all = new Set([...left.keys(), ...right.keys()]);
  return [...all].filter((file) => left.get(file) !== right.get(file)).sort();
}

/** Each commit is exported with `git archive`, so an untracked or ignored file in the checkout never reaches a build. */
export function createBuilder(repo, { afterBuild } = {}) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-build-'));
  const trees = new Map();
  let count = 0;
  const prepare = (sha) => {
    const dir = path.join(work, `tree-${++count}`);
    fs.mkdirSync(dir);
    const archive = path.join(work, `tree-${count}.tar`);
    git(repo, 'archive', '--format=tar', '-o', archive, sha);
    run('tar', ['-xf', archive, '-C', dir]);
    fs.rmSync(archive);
    run('pnpm', ['install', '--frozen-lockfile'], dir);
    return dir;
  };
  const pack = (dir, name) => {
    run('pnpm', ['--filter', `${name}...`, 'build'], dir);
    afterBuild?.(dir, name);
    const out = fs.mkdtempSync(path.join(work, 'pack-'));
    run('pnpm', ['--filter', name, 'pack', '--pack-destination', out], dir);
    const [file] = fs.readdirSync(out);
    return path.join(out, file);
  };
  return {
    pack(sha, name) {
      if (!trees.has(sha)) trees.set(sha, prepare(sha));
      return pack(trees.get(sha), name);
    },
    dispose() {
      fs.rmSync(work, { recursive: true, force: true });
    },
  };
}

export function createRegistry() {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-npm-'));
  return {
    releases(name) {
      const view = (field) => JSON.parse(run('npm', ['view', name, field, '--json', '--min-release-age=0']));
      const time = view('time');
      return view('versions').map((version) => {
        if (time[version] === undefined) throw new Error(`npm lists ${name}@${version} with no publish time`);
        return { version, time: time[version] };
      });
    },
    tarball(name, version) {
      const dir = fs.mkdtempSync(path.join(work, 'v-'));
      // A user .npmrc may set min-release-age, and npm pack then answers notarget for a version younger than that.
      const [packed] = JSON.parse(run('npm', ['pack', `${name}@${version}`, '--min-release-age=0', '--json', '--pack-destination', dir]));
      const file = path.join(dir, packed.filename);
      const expected = run('npm', ['view', `${name}@${version}`, 'dist.integrity', '--min-release-age=0']).trim();
      const actual = `sha512-${crypto.createHash('sha512').update(fs.readFileSync(file)).digest('base64')}`;
      if (actual !== expected) throw new Error(`${name}@${version}: fetched tarball is ${actual}, npm records ${expected}`);
      return file;
    },
    dispose() {
      fs.rmSync(work, { recursive: true, force: true });
    },
  };
}

export function unstableFiles(repo, ref, builder) {
  const sha = git(repo, 'rev-parse', `${ref}^{commit}`).trim();
  const second = createBuilder(repo);
  try {
    return packageTable(repo, ref).flatMap(({ name }) =>
      differingFiles(builder.pack(sha, name), second.pack(sha, name)).map((file) => `${name} ${file}`),
    );
  } finally {
    second.dispose();
  }
}

const seconds = (start) => ((performance.now() - start) / 1000).toFixed(1);

export function provenance(repo, ref, { registry, builder, log = () => {} }) {
  const records = [];
  for (const pkg of packageTable(repo, ref)) {
    for (const { version, time } of registry.releases(pkg.name)) {
      const start = performance.now();
      const record = { name: pkg.name, version, ...recordFor(repo, ref, pkg, version, time, { registry, builder }) };
      const outcome = record.reproducible ? `${RULE} at ${record.commit}` : `not reproducible, ${record.reason ?? `closest ${record.closest}`}`;
      log(`${pkg.name}@${version}: ${outcome} (${seconds(start)} s)`);
      records.push(record);
    }
  }
  return records;
}

function recordFor(repo, ref, pkg, version, publishedAt, { registry, builder }) {
  const commits = candidates(repo, ref, pkg, version, publishedAt);
  if (commits.length === 0) return { reproducible: false, closest: null, reason: NO_COMMIT };
  const published = registry.tarball(pkg.name, version);
  let closest = null;
  for (const sha of commits) {
    const differing = differingFiles(published, builder.pack(sha, pkg.name));
    if (differing.length === 0) return { reproducible: true, tag: `${pkg.name}@${version}`, commit: sha, rule: RULE };
    if (closest === null || differing.length < closest.differing.length) closest = { sha, differing };
  }
  return { reproducible: false, closest: closest.sha, differing: closest.differing };
}

export const serialize = (records) => `${JSON.stringify(records, null, 2)}\n`;

export function changelogSection(text, version) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${version}`);
  if (start === -1) return null;
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  return lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join('\n')
    .trim();
}

/** Maps each remote tag to the commit it names, and whether it is annotated. */
export function remoteTags(repo, remote) {
  const tags = new Map();
  for (const line of git(repo, 'ls-remote', '--tags', remote, `${TAG_PREFIX}*`).split('\n').filter(Boolean)) {
    const [sha, ref] = line.split('\t');
    // ls-remote lists an annotated tag twice: the tag object, then `<tag>^{}` with the commit it points at.
    const tag = ref.slice('refs/tags/'.length).replace(/\^\{\}$/, '');
    if (ref.endsWith('^{}')) tags.set(tag, { commit: sha, annotated: true });
    else if (!tags.has(tag)) tags.set(tag, { commit: sha, annotated: false });
  }
  return tags;
}

/** A pushed tag cannot move under the release-tags ruleset, so a remote tag that is not the one to push stops the plan. */
export function tagPlan(records, remote) {
  const plan = { create: [], present: [] };
  for (const { tag, commit } of records.filter((record) => record.reproducible)) {
    const at = remote.get(tag);
    if (at !== undefined && at.commit !== commit) throw new Error(`${tag} already exists at ${at.commit}, not ${commit}`);
    if (at !== undefined && !at.annotated) throw new Error(`${tag} exists as a lightweight tag, not an annotated one`);
    plan[at === undefined ? 'create' : 'present'].push({ tag, commit });
  }
  return plan;
}

export function releaseNotes(repo, { dir, name }, version, commit) {
  const text = readBlobs(repo, [`${commit}:packages/${dir}/CHANGELOG.md`])[0];
  return (text === null ? null : changelogSection(text, version)) ?? `${name}@${version} has no CHANGELOG section.`;
}

const GITHUB_URLS = [
  /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/,
  /^git@github\.com:([\w.-]+\/[\w.-]+?)(?:\.git)?$/,
  /^ssh:\/\/git@github\.com(?::\d+)?\/([\w.-]+\/[\w.-]+?)(?:\.git)?$/,
];

/** A remote URL can carry a token, so every message prints it with the userinfo replaced. */
const redact = (url) => url.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/]*@/i, '$1***@').replace(/^[^/:]+@/, '***@');

/** The GitHub repository a remote URL names, so gh releases where git pushes, whatever `gh repo set-default` says. */
export function githubRepo(url) {
  const repo = GITHUB_URLS.map((pattern) => pattern.exec(url)?.[1]).find((match) => match !== undefined);
  if (repo === undefined || repo.endsWith('.git')) throw new Error(`${redact(url)} is not a GitHub repository URL`);
  return repo;
}

const isLocalPath = (url) => url.startsWith('file://') || !/^[^/]*:/.test(url);

/**
 * The GitHub repository the remote's configured URL names, once git's own resolution shows the tags go there too.
 * A second URL, a pushurl and an insteadOf or pushInsteadOf rule can each send a push elsewhere, or make ls-remote read
 * another repository than the one pushed to. A rewrite to a local path is refused unless `allowLocalRemote` is set:
 * the tags then go to that path, and the check for a tag at another commit reads it, not GitHub, while
 * `gh release create --verify-tag` only asks GitHub whether the tag exists. Only the tests and the rehearsal set it.
 */
export function releaseRepository(repo, remote, { allowLocalRemote = false } = {}) {
  const urls = (...args) => {
    try {
      return git(repo, ...args).split('\n').filter(Boolean);
    } catch {
      return [];
    }
  };
  const configured = urls('config', '--get-all', `remote.${remote}.url`);
  const pushes = urls('remote', 'get-url', '--push', '--all', remote);
  const [fetched] = urls('remote', 'get-url', remote);
  if (configured.length === 0) throw new Error(`no remote named ${remote}`);
  if (configured.length > 1) throw new Error(`${remote} has ${configured.length} urls, and git pushes to every one`);
  if (pushes.length > 1) throw new Error(`${remote} has ${pushes.length} push URLs, and git pushes to every one`);
  const ghRepo = githubRepo(configured[0]);
  const place = (url) => {
    if (isLocalPath(url)) return url;
    try {
      return githubRepo(url).toLowerCase();
    } catch {
      return url;
    }
  };
  const [pushed] = pushes;
  const local = [pushed, fetched].find(isLocalPath);
  if (local !== undefined && !allowLocalRemote) {
    throw new Error(`git pushes ${remote} to a local path ${redact(local)}, and BACKFILL_ALLOW_LOCAL_REMOTE=1 is for a rehearsal only`);
  }
  if (!isLocalPath(pushed) && place(pushed) !== ghRepo.toLowerCase()) {
    throw new Error(`${remote} is ${redact(configured[0])}, but git pushes it to ${redact(pushed)}`);
  }
  if (place(pushed) !== place(fetched)) throw new Error(`git pushes ${remote} to ${redact(pushed)}, but ls-remote reads ${redact(fetched)}`);
  return ghRepo;
}

/** A tag push is permanent, so gh must be able to release in the repository before the first one. */
function checkCanRelease(gh, repo, ghRepo) {
  let canPush;
  try {
    canPush = run(gh, ['api', `repos/${ghRepo}`, '--jq', '.permissions.push'], repo).trim();
  } catch (error) {
    throw new Error(`gh cannot push to ${ghRepo}: ${String(error.stderr).trim()}`);
  }
  if (canPush !== 'true') throw new Error(`gh cannot push to ${ghRepo}: no push permission`);
}

function hasRelease(gh, repo, ghRepo, tag) {
  try {
    run(gh, ['release', 'view', tag, '-R', ghRepo, '--json', 'tagName'], repo);
    return true;
  } catch (error) {
    if (/release not found/.test(String(error.stderr))) return false;
    throw error;
  }
}

/**
 * Every check runs before the first push: the release repository, each release's notes, each local tag that already
 * exists, and gh's push permission. A pushed tag is permanent, so a run that stops leaves nothing it would not push again.
 */
export function push(repo, records, { remote = 'origin', gh = 'gh', log = () => {}, allowLocalRemote = false } = {}) {
  const ghRepo = releaseRepository(repo, remote, { allowLocalRemote });
  const table = packageTable(repo, 'HEAD');
  const plan = tagPlan(records, remoteTags(repo, remote));
  const notes = new Map(
    records
      .filter((record) => record.reproducible)
      .map(({ name, version, tag, commit }) => {
        const pkg = table.find((p) => p.name === name);
        if (pkg === undefined) throw new Error(`${name} is not a package at HEAD, so ${tag} has no CHANGELOG to release`);
        return [tag, releaseNotes(repo, pkg, version, commit)];
      }),
  );
  for (const { tag, commit } of plan.create) {
    if (git(repo, 'tag', '--list', tag).trim() === '') continue;
    if (git(repo, 'cat-file', '-t', `refs/tags/${tag}`).trim() !== 'tag') throw new Error(`local ${tag} is a lightweight tag, not an annotated one`);
    if (git(repo, 'rev-parse', `${tag}^{commit}`).trim() !== commit) throw new Error(`local ${tag} is not at ${commit}`);
  }
  checkCanRelease(gh, repo, ghRepo);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-notes-'));
  const release = (tag) => {
    const file = path.join(work, 'notes.md');
    fs.writeFileSync(file, `${notes.get(tag)}\n`);
    run(gh, ['release', 'create', tag, '-R', ghRepo, '--verify-tag', '--latest=false', '--title', tag, '--notes-file', file], repo);
  };
  try {
    for (const { tag, commit } of plan.create) {
      if (git(repo, 'tag', '--list', tag).trim() === '') git(repo, 'tag', '-a', tag, commit, '-m', `${tag} ${RULE} at ${commit}`);
      git(repo, 'push', '--no-follow-tags', remote, `refs/tags/${tag}`);
      release(tag);
      log(`${tag}: tagged ${commit}, pushed and released`);
    }
    for (const { tag, commit } of plan.present) {
      if (hasRelease(gh, repo, ghRepo, tag)) {
        log(`${tag}: on ${remote} at ${commit} and released already`);
        continue;
      }
      release(tag);
      log(`${tag}: on ${remote} at ${commit} already, released`);
    }
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
  return plan;
}

function main(argv) {
  const repo = path.resolve(import.meta.dirname, '../../..');
  const log = (line) => process.stderr.write(`backfill-tags: ${line}\n`);
  const mode = argv.find((arg) => ['--dry-run', '--write', '--push'].includes(arg));
  const refAt = argv.indexOf('--ref');
  const ref = refAt === -1 ? 'origin/main' : argv[refAt + 1];
  if (mode === undefined || (refAt !== -1 && (ref === undefined || mode === '--push'))) {
    process.stderr.write('usage: backfill-tags.mjs (--dry-run | --write) [--ref <rev>] | --push\n');
    return 2;
  }
  if (mode === '--push') {
    const records = JSON.parse(fs.readFileSync(path.join(repo, PROVENANCE), 'utf8'));
    push(repo, records, { log, allowLocalRemote: process.env.BACKFILL_ALLOW_LOCAL_REMOTE === '1' });
    return 0;
  }

  const start = performance.now();
  const builder = createBuilder(repo);
  const registry = createRegistry();
  try {
    const unstable = unstableFiles(repo, ref, builder);
    log(`two builds of ${ref} ${unstable.length === 0 ? 'match' : 'differ'} (${seconds(start)} s)`);
    if (unstable.length > 0) {
      log(`stop: two builds of one commit differ, so no rebuild can prove a version:\n  ${unstable.join('\n  ')}`);
      return 1;
    }
    const records = provenance(repo, ref, { registry, builder, log });
    const plan = tagPlan(records, remoteTags(repo, 'origin'));
    for (const { tag, commit } of plan.present) log(`tag ${tag}: on origin at ${commit} already, skip`);
    for (const { tag, commit } of plan.create) log(`tag ${tag} at ${commit}`);
    for (const r of records.filter((record) => !record.reproducible)) {
      log(`no tag ${r.name}@${r.version}: ${r.closest === null ? r.reason : `closest ${r.closest} differs in ${r.differing.length} files`}`);
    }
    log(`whole run ${seconds(start)} s`);
    if (mode === '--write') fs.writeFileSync(path.join(repo, PROVENANCE), serialize(records));
    else process.stdout.write(serialize(records));
    return 0;
  } finally {
    builder.dispose();
    registry.dispose();
  }
}

// A symlink in the path would make the two URLs differ and the script exit 0 without running. A process that only
// imports this module has no file in argv[1].
const entry = process.argv[1] && fs.existsSync(process.argv[1]) ? pathToFileURL(fs.realpathSync(process.argv[1])).href : undefined;
if (import.meta.url === entry) process.exitCode = main(process.argv.slice(2));
