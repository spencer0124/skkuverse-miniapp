/** The link rewrite on small fixtures: the edge cases a real checkout of this repository does not happen to hold. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { resolvePages } from 'vitepress';
import { isPublishedPage, mapLinks, rewriteMarkdownOutputs, srcExclude } from '../.vitepress/links.mts';

const REPO_URL = 'https://github.com/o/r';

function build(source, files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-links-'));
  const repoRoot = path.join(dir, 'repo');
  const outDir = path.join(dir, 'out');
  for (const [name, text] of Object.entries({ 'docs/a.md': source, 'docs/b.md': '# b\n', 'docs/my notes.txt': 'x\n', ...files })) {
    fs.mkdirSync(path.dirname(path.join(repoRoot, name)), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, name), text);
  }
  fs.mkdirSync(path.join(outDir, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'docs/a.md'), source);
  rewriteMarkdownOutputs({ repoRoot, repoUrl: REPO_URL, siteUrl: 'https://s.test/base/', outDir });
  const copy = fs.readFileSync(path.join(outDir, 'docs/a.md'), 'utf8');
  fs.rmSync(dir, { recursive: true, force: true });
  return copy;
}

describe('link rewrite', () => {
  it('rewrites the links of a CRLF source', () => {
    const copy = build('# a\r\n\r\nSee [b](./b.md) and [notes](./my%20notes.txt).\r\n');
    assert.equal(copy, `# a\n\nSee [b](b.md) and [notes](${REPO_URL}/blob/main/docs/my%20notes.txt).\n`);
  });

  it('keeps a path that needs percent-encoding a link', () => {
    assert.match(build('[n](./my%20notes.txt)\n'), /\(https:\/\/github\.com\/o\/r\/blob\/main\/docs\/my%20notes\.txt\)/);
  });

  it('skips a repeated reference label as CommonMark does, and rewrites the first', () => {
    const copy = build('[x][l]\n\n[l]: ./b.md\n[L]: ./b.md "again"\n');
    assert.equal(copy, '[x][l]\n\n[l]: b.md\n[L]: ./b.md "again"\n');
  });

  it('rewrites a reference definition whose destination continues on the next line of a blockquote', () => {
    assert.equal(build('> [r]:\n>   ./b.md\n\n[x][r]\n'), '> [r]:\n>   b.md\n\n[x][r]\n');
  });

  it('rewrites a link in a table cell that holds an escaped pipe', () => {
    const table = (to) => `| h | i |\n|---|---|\n| a \\| [b](${to}) | \`c\\|d\` [b](${to}) |\n`;
    assert.equal(build(table('./b.md')), table('b.md'));
  });

  it('reads a destination as CommonMark does, escapes and entities included', () => {
    assert.equal(build('[b](./b\\.md) [c](./b&#46;md)\n'), '[b](b.md) [c](b.md)\n');
  });

  it('writes a target that would end a destination percent-encoded', () => {
    assert.equal(build('[n](./my%20page.md)\n', { 'docs/my page.md': '# n\n' }), '[n](my%20page.md)\n');
  });

  it('fails on a relative link it cannot send anywhere, instead of leaving it relative', () => {
    assert.throws(() => build('[gone](./gone.md)\n'), /docs\/a\.md: cannot rewrite the link \.\/gone\.md, which names no file/);
  });

  it('names a link that leaves the repository as such', () => {
    assert.throws(() => build('[r](../../README.md)\n'), /docs\/a\.md: cannot rewrite the link \.\.\/\.\.\/README\.md, which points outside this repository/);
  });

  it('cuts destinations at the right place after a byte order mark, and keeps the mark', () => {
    const seen = [];
    assert.equal(mapLinks('﻿[a](./b.md)\n', (href) => (seen.push(href), 'c.md')), '﻿[a](c.md)\n');
    assert.deepEqual(seen, ['./b.md']);
    assert.equal(build('﻿[a](./b.md)\n'), '﻿[a](b.md)\n');
  });

  it('reads a percent sign that starts no escape as itself', () => {
    assert.equal(build('[q](<./100%.md>)\n', { 'docs/100%.md': '# q\n' }), '[q](<100%25.md>)\n');
  });

  it('decodes an escaped # in a path, and escapes it again in the target', () => {
    const files = { 'docs/a#b.md': '# h\n', 'docs/a#b.txt': 'x\n' };
    assert.equal(build('[h](./a%23b.md) [t](./a%23b.txt)\n', files), `[h](a%23b.md) [t](${REPO_URL}/blob/main/docs/a%23b.txt)\n`);
  });

  it('leaves a query-only link alone, as it does a fragment', () => {
    assert.equal(build('[q](?x=1) [f](#x)\n'), '[q](?x=1) [f](#x)\n');
  });

  it('sends a link to the repository root to the repository page', () => {
    assert.equal(build('[up](..) [up2](../#readme)\n'), `[up](${REPO_URL}) [up2](${REPO_URL}#readme)\n`);
  });
});

describe('published set', () => {
  it('publishes exactly the files isPublishedPage names', async () => {
    const files = [
      'README.md',
      'AGENTS.md',
      'docs/a.md',
      'docs/how-to/b.md',
      'docs/_template.md',
      'packages/notes.md',
      'packages/x/README.md',
      'packages/x/CHANGELOG.md',
      'packages/x/templates/y/README.md',
      'packages/x/node_modules/z/README.md',
      'plugin/skills/s.md',
    ];
    const srcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-pages-'));
    for (const file of files) {
      fs.mkdirSync(path.dirname(path.join(srcDir, file)), { recursive: true });
      fs.writeFileSync(path.join(srcDir, file), '# x\n');
    }
    const siteConfig = { srcDir, userConfig: { srcExclude }, logger: console };
    await resolvePages(siteConfig, true);
    fs.rmSync(srcDir, { recursive: true, force: true });
    assert.deepEqual(siteConfig.pages, files.filter(isPublishedPage).sort());
  });
});
