/** The link rewrite on small fixtures: the edge cases a real checkout of this repository does not happen to hold. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { rewriteMarkdownOutputs } from '../.vitepress/links.mts';

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
});
