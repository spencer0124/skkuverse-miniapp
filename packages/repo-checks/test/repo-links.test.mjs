/**
 * Every link to a skkuverse repository on GitHub names the owner that
 * repo-links.json holds and a repository on its `public` list. Moving the
 * repositories to another owner is one edit to that file, and the failure
 * prints the command that rewrites each link to match.
 *
 * The scan reads each text file `git ls-files` lists and finds the https form
 * of a repository link, the `git@` clone form, the `raw.githubusercontent.com`
 * and `api.github.com/repos` forms and the `github.io` Pages form,
 * where the repository name starts with `skkuverse`. A link to a repository
 * outside `public` fails under any owner, because a public repository must
 * not send its readers to a private one. The package.json `repository.url`
 * and `homepage` fields, the README badges and the issue template are plain
 * text in tracked files, so the same scan covers them.
 *
 * Every case builds its URLs around a variable owner. A literal URL that the
 * scan rejects would sit in this tracked file and fail the scan on its own
 * cases.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

const root = path.join(import.meta.dirname, '../../..');

const OWNER_NAME = '[A-Za-z0-9-]+';
const REPO_NAME = 'skkuverse[A-Za-z0-9_.-]*';
const GITHUB_HOSTS = 'github[.]com[:/]|raw[.]githubusercontent[.]com/|api[.]github[.]com/repos/';
export const GITHUB_SOURCE = `(${GITHUB_HOSTS})(${OWNER_NAME})/(${REPO_NAME})`;
export const PAGES_SOURCE = `(${OWNER_NAME})[.]github[.]io/(${REPO_NAME})`;
/**
 * Valid as a `git grep -E -i` pattern, so `git grep -h -o -i -E "$pattern" | wc -l` counts what the scan counts.
 * It holds no backslash, because a printed backslash doubles on its way through pnpm and a pasted `\\.` matches nothing.
 */
export const GREP_PATTERN = `${GITHUB_SOURCE}|${PAGES_SOURCE}`;

const OWNER_SHAPE = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
const PUBLIC_SHAPE = /^skkuverse[A-Za-z0-9_-]*$/;

export function parseRepoLinks(text) {
  const data = JSON.parse(text);
  if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error('repo-links.json must hold an object');
  const keys = Object.keys(data).sort().join(',');
  if (keys !== 'owner,public') throw new Error(`repo-links.json keys must be owner and public, found ${keys || 'none'}`);
  if (typeof data.owner !== 'string' || !OWNER_SHAPE.test(data.owner)) throw new Error('owner must be a GitHub account name, not a path');
  if (!Array.isArray(data.public) || data.public.length === 0) throw new Error('public must list at least one repository');
  for (const name of data.public) {
    if (typeof name !== 'string' || !PUBLIC_SHAPE.test(name)) throw new Error(`public holds ${JSON.stringify(name)}, which is not a skkuverse repository name`);
  }
  return { owner: data.owner, public: data.public };
}

const repoName = (token) => token.replace(/\.+$/, '').replace(/\.git$/i, '').toLowerCase();

export function linkHits(text) {
  // Most files hold no link, so two tests of the whole text spare splitting them into lines.
  if (!/skkuverse/i.test(text) || !/github(?:usercontent)?\.(?:com|io)/i.test(text)) return [];
  return text.split('\n').flatMap((lineText, i) =>
    [
      [GITHUB_SOURCE, 2],
      [PAGES_SOURCE, 1],
    ].flatMap(([source, ownerGroup]) =>
      [...lineText.matchAll(new RegExp(source, 'gi'))].map((m) => ({
        line: i + 1,
        url: m[0].replace(/\.+$/, ''),
        owner: m[ownerGroup],
        repo: repoName(m[ownerGroup + 1]),
      })),
    ),
  );
}

/**
 * No backslash: a copy from a terminal or a CI log can double each one, and a copied `\\.` matches nothing.
 * A name ends where `repoName` ends the token: at an optional `.git` and sentence dots, never at a dot that leads into more name.
 */
export function rewriteCommand(links, oldOwners) {
  const old = oldOwners.length === 1 ? oldOwners[0] : `(?:${oldOwners.join('|')})`;
  const names = `(${links.public.join('|')})(?=(?:[.]git)?[.]*(?![A-Za-z0-9_.-]))`;
  const https = `s#(${GITHUB_HOSTS})${old}/${names}#\${1}${links.owner}/\${2}#gi`;
  const pages = `s#(?<![A-Za-z0-9-])${old}[.]github[.]io/${names}#${links.owner}.github.io/\${1}#gi`;
  return `git ls-files -z | xargs -0 perl -pi -e '${https}; ${pages}'`;
}

export const REWRITE = 'Rewrite each link to a public repository with: ';
export const REMOVE = 'Remove each link to a repository outside public, or add the repository to public when it is public.';

export function linkReport(files, links) {
  const owner = links.owner.toLowerCase();
  const publicNames = new Set(links.public.map((name) => name.toLowerCase()));
  const lines = [];
  const staleOwners = new Set();
  let outsidePublic = false;
  for (const { file, text } of files) {
    for (const hit of linkHits(text)) {
      const ownerHolds = hit.owner.toLowerCase() === owner;
      const repoIsPublic = publicNames.has(hit.repo);
      if (ownerHolds && repoIsPublic) continue;
      const reasons = [ownerHolds ? '' : `owner is not ${links.owner}`, repoIsPublic ? '' : `${hit.repo} is not in public`];
      lines.push(`${file}:${hit.line}: ${hit.url} (${reasons.filter(Boolean).join(', ')})`);
      if (repoIsPublic) staleOwners.add(hit.owner);
      else outsidePublic = true;
    }
  }
  if (staleOwners.size > 0) lines.push(REWRITE + rewriteCommand(links, [...staleOwners]));
  if (outsidePublic) lines.push(REMOVE);
  return lines;
}

function readUnlessDeleted(file) {
  try {
    return fs.readFileSync(file);
  } catch (err) {
    if (err.code === 'ENOENT') return undefined;
    throw err;
  }
}

function trackedTextFiles() {
  const listed = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return listed
    .split('\0')
    .filter((file) => file !== '')
    .flatMap((file) => {
      const bytes = readUnlessDeleted(path.join(root, file));
      return bytes === undefined || bytes.includes(0) ? [] : [{ file, text: bytes.toString('utf8') }];
    });
}

const LINKS = { owner: 'acme', public: ['skkuverse-server', 'skkuverse-app'] };
const OWNER = LINKS.owner;
const OTHER = 'someone-else';

const reportFor = (text) => linkReport([{ file: 'a.md', text }], LINKS);

describe('repo-links.json', () => {
  const rejected = [
    ['no owner', { public: ['skkuverse-app'] }],
    ['an owner that is a path', { owner: 'acme/skkuverse-app', public: ['skkuverse-app'] }],
    ['no public repository', { owner: OWNER, public: [] }],
    ['a public name outside the skkuverse family', { owner: OWNER, public: ['example'] }],
    ['an unknown key', { owner: OWNER, public: ['skkuverse-app'], private: ['skkuverse'] }],
  ];
  for (const [name, config] of rejected) {
    it(`rejects ${name}`, () => {
      assert.throws(() => parseRepoLinks(JSON.stringify(config)));
    });
  }

  it('accepts an owner and a list of public repositories', () => {
    assert.deepEqual(parseRepoLinks(JSON.stringify(LINKS)), LINKS);
  });
});

describe('a link to a skkuverse repository', () => {
  const passing = [
    ['an https link to a public repository at the owner', `https://github.com/${OWNER}/skkuverse-server/blob/main/README.md`],
    ['a clone URL with .git', `git@github.com:${OWNER}/skkuverse-app.git`],
    ['a Pages link', `https://${OWNER}.github.io/skkuverse-app/`],
    ['a Pages link to a repository outside the skkuverse family', `https://${OTHER}.github.io/other-repo/`],
    ['a link that ends a sentence', `Read https://github.com/${OWNER}/skkuverse-server.`],
    ['the owner and repository in other letter case', `https://github.com/${OWNER.toUpperCase()}/Skkuverse-Server`],
    ['a repository outside the skkuverse family', `https://github.com/${OTHER}/example`],
    ['a raw file link at the owner', `https://raw.githubusercontent.com/${OWNER}/skkuverse-app/main/README.md`],
    ['an API link at the owner', `https://api.github.com/repos/${OWNER}/skkuverse-app/releases`],
  ];
  for (const [name, text] of passing) {
    it(`passes ${name}`, () => {
      assert.deepEqual(reportFor(text), []);
    });
  }

  const failing = [
    ['a wrong owner', `see https://github.com/${OTHER}/skkuverse-server`, `github.com/${OTHER}/skkuverse-server`, `owner is not ${OWNER}`],
    [
      'a wrong owner in other letter case',
      `see https://github.com/${OTHER.toUpperCase()}/SKKUVERSE-SERVER`,
      `github.com/${OTHER.toUpperCase()}/SKKUVERSE-SERVER`,
      `owner is not ${OWNER}`,
    ],
    ['a wrong owner in a clone URL', `git@github.com:${OTHER}/skkuverse-app.git`, `github.com:${OTHER}/skkuverse-app.git`, `owner is not ${OWNER}`],
    ['a wrong owner in a Pages link', `https://${OTHER}.github.io/skkuverse-app/`, `${OTHER}.github.io/skkuverse-app`, `owner is not ${OWNER}`],
    ['a private repository', `https://github.com/${OWNER}/skkuverse`, `github.com/${OWNER}/skkuverse`, 'skkuverse is not in public'],
    [
      'a private repository at the end of a sentence',
      `Read https://github.com/${OWNER}/skkuverse.`,
      `github.com/${OWNER}/skkuverse`,
      'skkuverse is not in public',
    ],
    ['a private repository in a Pages link', `https://${OWNER}.github.io/skkuverse-web/`, `${OWNER}.github.io/skkuverse-web`, 'skkuverse-web is not in public'],
    [
      'a repository whose name starts with a public name',
      `https://github.com/${OWNER}/skkuverse-server-extra`,
      `github.com/${OWNER}/skkuverse-server-extra`,
      'skkuverse-server-extra is not in public',
    ],
    [
      'a repository whose name extends a public name with a dot',
      `https://github.com/${OWNER}/skkuverse-app.evil`,
      `github.com/${OWNER}/skkuverse-app.evil`,
      'skkuverse-app.evil is not in public',
    ],
    [
      'a wrong owner in a raw file link',
      `https://raw.githubusercontent.com/${OTHER}/skkuverse-app/main/README.md`,
      `raw.githubusercontent.com/${OTHER}/skkuverse-app`,
      `owner is not ${OWNER}`,
    ],
    [
      'a wrong owner in an API link',
      `https://api.github.com/repos/${OTHER}/skkuverse-app/releases`,
      `api.github.com/repos/${OTHER}/skkuverse-app`,
      `owner is not ${OWNER}`,
    ],
    [
      'a private repository in a raw file link',
      `https://raw.githubusercontent.com/${OWNER}/skkuverse-web/main/x`,
      `raw.githubusercontent.com/${OWNER}/skkuverse-web`,
      'skkuverse-web is not in public',
    ],
    [
      'a private repository in an API link',
      `https://api.github.com/repos/${OWNER}/skkuverse-web`,
      `api.github.com/repos/${OWNER}/skkuverse-web`,
      'skkuverse-web is not in public',
    ],
    [
      'a wrong owner and a private repository',
      `https://github.com/${OTHER}/skkuverse-web`,
      `github.com/${OTHER}/skkuverse-web`,
      `owner is not ${OWNER}, skkuverse-web is not in public`,
    ],
  ];
  for (const [name, text, url, reason] of failing) {
    it(`fails ${name}`, () => {
      assert.equal(reportFor(text)[0], `a.md:1: ${url} (${reason})`);
    });
  }

  it('fails a package.json repository.url and homepage at a wrong owner, naming each line', () => {
    const manifest = JSON.stringify(
      {
        name: 'example',
        repository: { type: 'git', url: `git+https://github.com/${OTHER}/skkuverse-app.git` },
        homepage: `https://github.com/${OTHER}/skkuverse-app#readme`,
      },
      null,
      2,
    );

    const hits = linkReport([{ file: 'packages/x/package.json', text: manifest }], LINKS).filter((line) => /^\S+:\d+: /.test(line));

    assert.deepEqual(
      hits.map((line) => line.split(' ')[0]),
      ['packages/x/package.json:5:', 'packages/x/package.json:7:'],
    );
  });

  it('names the line of each link, across files', () => {
    const files = [
      { file: 'docs/a.md', text: `fine\nsee https://github.com/${OWNER}/skkuverse-app\nand https://github.com/${OTHER}/skkuverse-app` },
      { file: 'b.yml', text: `url: https://${OTHER}.github.io/skkuverse-server/` },
    ];

    const hits = linkReport(files, LINKS).filter((line) => /^\S+:\d+: /.test(line));

    assert.deepEqual(
      hits.map((line) => line.split(' ')[0]),
      ['docs/a.md:3:', 'b.yml:1:'],
    );
  });

  it('counts two links on one line as two', () => {
    const text = `[![CI](https://github.com/${OTHER}/skkuverse-app/badge.svg)](https://github.com/${OTHER}/skkuverse-app/actions)`;

    assert.equal(linkHits(text).length, 2);
  });

  it('asks for a rewrite when a public repository sits at a wrong owner, and for a removal when a private one does', () => {
    const stale = reportFor(`https://github.com/${OTHER}/skkuverse-app`);
    const privateRepo = reportFor(`https://github.com/${OWNER}/skkuverse`);

    assert.equal(stale.at(-1), REWRITE + rewriteCommand(LINKS, [OTHER]));
    assert.ok(!stale.includes(REMOVE));
    assert.equal(privateRepo.at(-1), REMOVE);
    assert.ok(!privateRepo.some((line) => line.startsWith(REWRITE)));
  });
});

describe('the printed rewrite command', () => {
  it('moves every link to a public repository to the configured owner, leaves every other line alone, and leaves nothing to rewrite', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-links-'));
    const before = {
      'a.md': [
        `[readme](https://github.com/${OTHER}/skkuverse-server/blob/main/README.md) and https://${OTHER}.github.io/skkuverse-app/`,
        `Read https://github.com/${OTHER}/skkuverse-server.`,
        `curl https://raw.githubusercontent.com/${OTHER}/skkuverse-app/main/x.json https://api.github.com/repos/${OTHER}/skkuverse-server/tags`,
        `curl https://raw.githubusercontent.com/${OTHER}/skkuverse-web/main/x https://api.github.com/repos/${OTHER}/skkuverse-web`,
        `the umbrella is https://github.com/${OTHER}/skkuverse`,
        `the fork is https://github.com/${OTHER}/skkuverse-app.evil`,
        'an unrelated line',
      ].join('\n'),
      'b.sh': [
        `git clone git@github.com:${OTHER}/skkuverse-app.git`,
        `git clone https://github.com/${OTHER}/skkuverse-server-extra`,
        `git clone https://${OTHER}.github.io/skkuverse-app.evil`,
        '',
      ].join('\n'),
    };
    const printed = linkReport(Object.entries(before).map(([file, text]) => ({ file, text })), LINKS).find((line) => line.startsWith(REWRITE));

    try {
      for (const [file, text] of Object.entries(before)) fs.writeFileSync(path.join(dir, file), text);

      execFileSync('sh', ['-c', `git init -q && git add -- ${Object.keys(before).join(' ')} && ${printed.slice(REWRITE.length)}`], { cwd: dir });
      const after = Object.fromEntries(Object.keys(before).map((file) => [file, fs.readFileSync(path.join(dir, file), 'utf8')]));

      assert.deepEqual(after, {
        'a.md': [
          `[readme](https://github.com/${OWNER}/skkuverse-server/blob/main/README.md) and https://${OWNER}.github.io/skkuverse-app/`,
          `Read https://github.com/${OWNER}/skkuverse-server.`,
          `curl https://raw.githubusercontent.com/${OWNER}/skkuverse-app/main/x.json https://api.github.com/repos/${OWNER}/skkuverse-server/tags`,
          `curl https://raw.githubusercontent.com/${OTHER}/skkuverse-web/main/x https://api.github.com/repos/${OTHER}/skkuverse-web`,
          `the umbrella is https://github.com/${OTHER}/skkuverse`,
          `the fork is https://github.com/${OTHER}/skkuverse-app.evil`,
          'an unrelated line',
        ].join('\n'),
        'b.sh': [
          `git clone git@github.com:${OWNER}/skkuverse-app.git`,
          `git clone https://github.com/${OTHER}/skkuverse-server-extra`,
          `git clone https://${OTHER}.github.io/skkuverse-app.evil`,
          '',
        ].join('\n'),
      });
      const remaining = linkReport(Object.entries(after).map(([file, text]) => ({ file, text })), LINKS);
      assert.ok(remaining.every((line) => !line.startsWith(REWRITE)));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('the tracked tree', () => {
  const links = parseRepoLinks(fs.readFileSync(path.join(root, 'repo-links.json'), 'utf8'));
  const files = trackedTextFiles();
  const hitsIn = (file) => linkHits(files.find((f) => f.file === file)?.text ?? '');

  it('links to skkuverse repositories only at the configured owner and only to public ones', (t) => {
    const report = linkReport(files, links);
    const urls = files.reduce((sum, { text }) => sum + linkHits(text).length, 0);
    t.diagnostic(`checked ${urls} URLs in ${files.length} files`);
    t.diagnostic(`pattern ${GREP_PATTERN}`);

    assert.ok(files.length > 0);
    assert.ok(report.length === 0, `\n${report.join('\n')}`);
  });

  it('reads the README badges, the issue template and every package.json repository field', () => {
    const manifests = files.filter(({ file }) => /(^|\/)package\.json$/.test(file)).filter(({ text }) => JSON.parse(text).repository?.url);

    assert.equal(hitsIn('README.md').filter((hit) => hit.line === 3).length, 2);
    assert.equal(hitsIn('.github/ISSUE_TEMPLATE/config.yml').length, 1);
    assert.ok(manifests.length > 0);
    for (const { file, text } of manifests) {
      assert.ok(linkHits(text).length >= 1, `${file} names its repository, and the scan reads that line`);
    }
  });

  it('prints a pattern without a backslash, and the printed line pasted into git grep counts the same URLs', () => {
    const scanned = files.reduce((sum, { text }) => sum + linkHits(text).length, 0);

    assert.ok(!GREP_PATTERN.includes('\\'), 'a backslash doubles when the line passes through pnpm');
    const pasted = execFileSync('sh', ['-c', `git grep -I -h -o -i -E '${GREP_PATTERN}' | wc -l`], { cwd: root, encoding: 'utf8' });
    assert.equal(Number(pasted.trim()), scanned);
  });

  it('counts the same URLs as the exported git grep pattern', () => {
    const scanned = files.reduce((sum, { text }) => sum + linkHits(text).length, 0);

    const grepped = execFileSync('git', ['grep', '-I', '-h', '-o', '-i', '-E', GREP_PATTERN], { cwd: root, encoding: 'utf8' })
      .split('\n')
      .filter((line) => line !== '').length;

    assert.equal(grepped, scanned);
  });
});
