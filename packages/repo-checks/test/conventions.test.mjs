/**
 * The repository passes its own docs conventions: every document under docs/ carries frontmatter, no Korean
 * sits outside a line that opts in, and docs/ holds only Diataxis folders. The check is
 * vendor/lint_conventions.py, run from this clone alone with nothing read from outside it.
 *
 * The vendored file is a byte-for-byte copy of the public skkuverse-server file
 * `.github/contract-tools/exported/lint_conventions.py` at commit c397e2317e7cdde244163cba82900c839e06f700
 * (sha256 d4a90b8ea4169d369ec96747f81f4c782fccc2248ebf63f618df53e091f14ab3). It carries no header of its own, so
 * `shasum -a 256` of the two files still compares. This repository owns the copy and edits it here.
 *
 * Each negative case builds its own tree in a temporary folder and runs the checker on that, so a failing case
 * never touches this repository.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

const root = path.join(import.meta.dirname, '../../..');
const checker = path.join(import.meta.dirname, '../vendor/lint_conventions.py');

const VALID_DOC = [
  '---',
  'title: A Valid Document',
  'type: how-to',
  'status: draft',
  'owner: someone@example.com',
  'last-updated: 2026-01-01',
  'audience: public',
  '---',
  '',
  '# A valid document',
  '',
].join('\n');

function lint(dir) {
  const run = spawnSync('python3', ['-I', checker, '--root', dir], { encoding: 'utf8' });
  assert.equal(run.error, undefined, `python3 did not run: ${run.error}`);
  return { status: run.status, output: run.stdout + run.stderr };
}

function lintTree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'conventions-'));
  try {
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), content);
    }
    return lint(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('the docs conventions', () => {
  it('hold for this repository, read from this clone alone', () => {
    const { status, output } = lint(root);

    assert.equal(status, 0, output);
    assert.match(output, /all conventions satisfied/);
  });

  it('accept a valid document, so the failing cases below fail for their own reason', () => {
    const { status, output } = lintTree({ 'docs/how-to/valid.md': VALID_DOC });

    assert.equal(status, 0, output);
  });

  it('fail a document under docs/how-to/ with no frontmatter, and name the rule and the file', () => {
    const { status, output } = lintTree({ 'docs/how-to/bare.md': '# No frontmatter here\n' });

    assert.equal(status, 1, output);
    assert.match(output, /FAIL {2}frontmatter/);
    assert.match(output, /docs\/how-to\/bare\.md: no frontmatter/);
  });

  it('fail a document whose frontmatter lacks a required key', () => {
    const { status, output } = lintTree({ 'docs/how-to/partial.md': VALID_DOC.replace('audience: public\n', '') });

    assert.equal(status, 1, output);
    assert.match(output, /docs\/how-to\/partial\.md: missing \['audience'\]/);
  });

  it('fail a Korean line without the opt-in marker, and name the line', () => {
    const korean = String.fromCodePoint(0xd55c, 0xae00);
    const { status, output } = lintTree({ 'docs/how-to/korean.md': `${VALID_DOC}A line with ${korean} in it.\n` });

    assert.equal(status, 1, output);
    assert.match(output, /FAIL {2}language/);
    assert.match(output, /docs\/how-to\/korean\.md: Korean on line\(s\) 11/);
  });

  it('accept a Korean line that carries the opt-in marker', () => {
    const korean = String.fromCodePoint(0xd55c, 0xae00);
    const marked = `${VALID_DOC}A line with ${korean} in it. <!-- conventions:allow-korean: product copy -->\n`;
    const { status, output } = lintTree({ 'docs/how-to/korean.md': marked });

    assert.equal(status, 0, output);
  });

  it('fail a docs/ folder that is not a Diataxis folder', () => {
    const { status, output } = lintTree({ 'docs/notes/valid.md': VALID_DOC });

    assert.equal(status, 1, output);
    assert.match(output, /FAIL {2}structure/);
    assert.match(output, /docs\/notes\/: not a Diataxis folder/);
  });
});
