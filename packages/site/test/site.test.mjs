/**
 * The built site holds exactly one HTML page for each Markdown file the repository publishes,
 * and llms.txt links the .md copy of every page except the root README, which is the index.
 * The expected list comes from git, so a Markdown file added or removed changes the
 * expectation without an edit here, and a page that silently drops out of the site fails.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { before, describe, it } from 'node:test';

const siteDir = path.join(import.meta.dirname, '..');
const repoRoot = path.join(siteDir, '../..');
const dist = path.join(siteDir, '.vitepress/dist');
const ORIGIN = 'http://localhost:4173';
const BASE = '/skkuverse-miniapp/';

function publishedSources(root) {
  const out = execFileSync(
    'git',
    ['ls-files', '-z', ':(glob)docs/**/*.md', ':(glob)packages/*/README.md', 'README.md', ':!docs/_template.md'],
    { cwd: root, encoding: 'utf8' },
  );
  return out.split('\0').filter(Boolean).sort();
}

function htmlPathOf(source) {
  if (source === 'README.md') return 'index.html';
  const pkg = /^packages\/([^/]+)\/README\.md$/.exec(source);
  if (pkg) return `packages/${pkg[1]}/index.html`;
  return source.replace(/\.md$/, '.html');
}

function llmsPathOf(source) {
  const pkg = /^packages\/([^/]+)\/README\.md$/.exec(source);
  return pkg ? `packages/${pkg[1]}.md` : source;
}

function builtHtml(dir) {
  const found = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'assets') walk(full);
      } else if (entry.name.endsWith('.html') && entry.name !== '404.html') {
        found.push(path.relative(dist, full).split(path.sep).join('/'));
      }
    }
  };
  walk(dir);
  return found.sort();
}

describe('built site', () => {
  const sources = publishedSources(repoRoot);

  before(() => {
    fs.rmSync(dist, { recursive: true, force: true });
    execFileSync(process.execPath, [path.join(siteDir, 'node_modules/vitepress/bin/vitepress.js'), 'build'], {
      cwd: siteDir,
      env: { ...process.env, SITE_ORIGIN: ORIGIN },
      stdio: 'inherit',
    });
  });

  it('lists the pages it is meant to publish', () => {
    assert.ok(sources.includes('README.md') && sources.includes('docs/README.md'), `git listed ${sources.length} files without the two READMEs`);
    assert.ok(sources.every((s) => !s.includes('_template')), 'the template is not a page');
  });

  it('has one HTML page per published file and none besides', () => {
    const expected = sources.map(htmlPathOf).sort();
    const actual = builtHtml(dist);
    const missing = sources.filter((s) => !actual.includes(htmlPathOf(s)));
    const extra = actual.filter((h) => !expected.includes(h));
    assert.deepEqual({ missing, extra }, { missing: [], extra: [] }, 'missing names the source file, extra names the built page');
  });

  it('has llms.txt with an H1 that links every page but the index', () => {
    const text = fs.readFileSync(path.join(dist, 'llms.txt'), 'utf8');
    assert.match(text, /^# \S/m, 'llms.txt has an H1');
    const linked = [...text.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).sort();
    const expected = sources
      .filter((s) => s !== 'README.md')
      .map((s) => `${ORIGIN}${BASE}${llmsPathOf(s)}`)
      .sort();
    assert.deepEqual(linked, expected);
    for (const url of linked) {
      assert.ok(fs.existsSync(path.join(dist, url.slice(`${ORIGIN}${BASE}`.length))), `${url} has a .md copy in the build`);
    }
  });

  it('has llms-full.txt', () => {
    assert.ok(fs.statSync(path.join(dist, 'llms-full.txt')).size > 0);
  });
});
