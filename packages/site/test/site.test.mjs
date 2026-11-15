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
import MarkdownIt from 'markdown-it';

const siteDir = path.join(import.meta.dirname, '..');
const repoRoot = path.join(siteDir, '../..');
const dist = path.join(siteDir, '.vitepress/dist');
const ORIGIN = 'http://localhost:4173';
const BASE = '/skkuverse-miniapp/';
const { owner } = JSON.parse(fs.readFileSync(path.join(repoRoot, 'repo-links.json'), 'utf8'));
const REPO_URL = `https://github.com/${owner}/skkuverse-miniapp`;

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

/**
 * What a Markdown document links to and which code blocks it holds, read with markdown-it, which renders the site's
 * HTML. The rewrite reads the same text with micromark, so a construct one parser mishandles is still seen by the other.
 */
const md = new MarkdownIt({ html: true });
function parse(text) {
  const links = [];
  const code = [];
  const env = {};
  const htmlLinks = (value, line) => {
    for (const m of value.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) links.push({ href: m[1], line });
  };
  for (const block of md.parse(text, env)) {
    const line = block.map ? block.map[0] + 1 : undefined;
    if (block.type === 'fence' || block.type === 'code_block') code.push(`${block.info}\n${block.content}`);
    else if (block.type === 'html_block') htmlLinks(block.content, line);
    for (const token of block.children ?? []) {
      if (token.type === 'link_open') links.push({ href: token.attrGet('href'), line });
      else if (token.type === 'image') links.push({ href: token.attrGet('src'), line });
      else if (token.type === 'html_inline') htmlLinks(token.content, line);
    }
  }
  for (const { href } of Object.values(env.references ?? {})) links.push({ href, line: undefined });
  return { links, code };
}

const sourceOfCopy = (copy) => {
  const pkg = /^packages\/([^/]+)\.md$/.exec(copy);
  return pkg ? `packages/${pkg[1]}/README.md` : copy;
};

/** The sections of llms-full.txt, each with the URL of the page it was built from. */
function sectionsOf(text) {
  const parts = text.split(/^---\nurl: (?:>-\n\s+)?(\S+)\n---\n/m);
  const sections = [];
  for (let i = 1; i < parts.length; i += 2) sections.push({ url: parts[i], body: parts[i + 1] });
  return sections;
}

const existsAtHead = (rel) => {
  try {
    execFileSync('git', ['cat-file', '-e', `HEAD:${rel}`], { cwd: repoRoot, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

function markdownCopies(dir) {
  const found = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'assets') walk(full);
      } else if (entry.name.endsWith('.md')) {
        found.push(path.relative(dir, full).split(path.sep).join('/'));
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

  it('titles the home page with the repository name alone', () => {
    const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    assert.equal(/<title>([^<]*)<\/title>/.exec(html)?.[1], 'skkuverse-miniapp');
  });

  it('opens every link to an example outside the router, which would show its 404 page', () => {
    const tags = builtHtml(dist).flatMap((page) =>
      [...fs.readFileSync(path.join(dist, page), 'utf8').matchAll(new RegExp(`<a\\b[^>]*\\bhref="[^"]*${BASE}examples/[^>]*>`, 'g'))].map(([tag]) => ({ page, tag })),
    );
    assert.ok(tags.some(({ page }) => page === 'index.html'), 'the home page links the demo');
    assert.deepEqual(tags.filter(({ tag }) => !/\btarget="_blank"/.test(tag)), []);
  });

  it('has llms-full.txt', () => {
    assert.ok(fs.statSync(path.join(dist, 'llms-full.txt')).size > 0);
  });

  it('resolves every link in the Markdown copies and llms-full.txt, and keeps their code blocks as written', () => {
    const full = `${ORIGIN}${BASE}`;
    const githubPrefix = `${REPO_URL}/`;
    const problems = [];
    const sourceOf = (rel) => parse(fs.readFileSync(path.join(repoRoot, rel), 'utf8'));
    const publishedRels = new Set(sources.filter((s) => s !== 'README.md'));
    const isRelative = (href) => href && !href.startsWith('#') && !href.startsWith('/') && !/^[a-z][a-z0-9+.-]*:/i.test(href);
    const checkDocument = (where, source, text, inBundle) => {
      const original = sourceOf(source);
      const output = parse(text);
      if (JSON.stringify(output.code) !== JSON.stringify(original.code)) problems.push(`${where}: code blocks differ from ${source}`);
      // The rewrite edits destinations in place, so the n-th link of the output is the n-th link of the source.
      if (output.links.length !== original.links.length) {
        problems.push(`${where}: ${output.links.length} links, but ${source} has ${original.links.length}`);
        return;
      }
      const from = path.posix.dirname(where);
      output.links.forEach(({ href, line }, i) => {
        const at = `${where}:${line}`;
        const authored = original.links[i].href;
        if (isRelative(authored)) {
          const [authoredTarget] = authored.split(/[#?]/);
          const rel = path.posix.normalize(path.posix.join(path.posix.dirname(source), decodeURI(authoredTarget)));
          const page = publishedRels.has(rel) ? rel : publishedRels.has(`${rel.replace(/\/$/, '')}/README.md`) ? `${rel.replace(/\/$/, '')}/README.md` : undefined;
          if (page && href.startsWith(githubPrefix)) problems.push(`${at}: ${authored} is a published page (${page}) but came out as ${href}`);
        }
        if (href.startsWith('#') || /^(mailto|tel):/i.test(href)) return;
        const [target] = href.split(/[#?]/);
        if (/^https?:/i.test(href)) {
          if (target.startsWith(full)) {
            if (!fs.existsSync(path.join(dist, decodeURI(target.slice(full.length))))) problems.push(`${at}: ${href} is not in the build`);
          } else if (/^https:\/\/github\.com\//i.test(href) && authored !== href) {
            const rel = target.startsWith(githubPrefix) ? /^(?:blob|tree)\/main\/(.+?)\/?$/.exec(target.slice(githubPrefix.length))?.[1] : undefined;
            if (rel === undefined) problems.push(`${at}: ${href} is not ${REPO_URL}/(blob|tree)/main/<path>`);
            else if (!existsAtHead(decodeURI(rel))) problems.push(`${at}: ${href} names ${decodeURI(rel)}, which is not in the repository at HEAD`);
          }
        } else if (href.startsWith('/')) {
          if (!target.startsWith(BASE)) problems.push(`${at}: ${href} is site-absolute but leaves the base ${BASE}`);
          else if (!fs.existsSync(path.join(dist, decodeURI(target.slice(BASE.length))))) problems.push(`${at}: ${href} is not in the build`);
        } else if (inBundle) {
          problems.push(`${at}: ${href} is relative inside a single-file bundle`);
        } else {
          const resolved = path.posix.normalize(path.posix.join(from, decodeURI(target)));
          if (!fs.existsSync(path.join(dist, resolved))) problems.push(`${at}: ${href} resolves to ${resolved}, which is not in the build`);
        }
      });
    };
    for (const copy of markdownCopies(dist)) {
      checkDocument(copy, sourceOfCopy(copy), fs.readFileSync(path.join(dist, copy), 'utf8'), false);
    }
    const bundle = fs.readFileSync(path.join(dist, 'llms-full.txt'), 'utf8');
    const sections = sectionsOf(bundle);
    assert.ok(sections.length > 0, 'llms-full.txt has sections');
    for (const { url, body } of sections) {
      assert.ok(url.startsWith(full), `llms-full.txt section ${url} is under ${full}`);
      checkDocument(`llms-full.txt[${url.slice(full.length)}]`, sourceOfCopy(url.slice(full.length)), body, true);
    }
    assert.deepEqual(problems, [], `${problems.length} problem(s)`);
  });
});
