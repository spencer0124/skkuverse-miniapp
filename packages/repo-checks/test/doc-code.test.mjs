/**
 * Every TypeScript example in the docs compiles against the built packages, so a doc that drifts from the API
 * fails here, and an agent that copies an example gets code that typechecks.
 *
 * typescript-docs-verifier compiles each `ts`, `tsx` and `typescript` fence on its own, and swaps an import of the
 * package it runs in for that package's `exports` entry. It reads the package it runs in from the working
 * directory, and that package needs an `exports` field and a tsconfig. packages/miniapp has both and holds
 * @skkuverse/ui and @skkuverse/tokens as dependencies, so one run there covers every document that imports them.
 * packages/ui gets its own run, because its README imports its own entry. packages/cli and packages/game-contract
 * have no `exports`, so the verifier cannot run there, and the last case holds their documents to no such fence
 * instead.
 *
 * A snippet must be complete. `import.meta.env` is declared by Vite, which no workspace package here depends on,
 * so a snippet does not use it.
 *
 * The packages must be built first. `repo-checks#test` in turbo.json builds the workspace packages this package
 * depends on.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { compileSnippets } from 'typescript-docs-verifier';

const root = path.join(import.meta.dirname, '../../..');

const IGNORE_MARKER = 'ts-docs-verifier:ignore';
const FENCE = /```(?:typescript|tsx?)\r?\n/gi;

const GENERATED = /(^|\/)CHANGELOG\.md$|^\.changeset\//;
const UNVERIFIABLE_PACKAGES = ['packages/cli/', 'packages/game-contract/'];
const OWN_RUN = 'packages/ui/';

function trackedMarkdown() {
  const out = execFileSync('git', ['ls-files', '-z', '--', '*.md'], { cwd: root, encoding: 'utf8' });
  return out
    .split('\0')
    .filter((file) => file !== '' && !GENERATED.test(file))
    .filter((file) => fs.existsSync(path.join(root, file)));
}

function fenceLines(text) {
  const lines = [];
  for (const match of text.matchAll(FENCE)) lines.push(text.slice(0, match.index).split('\n').length);
  return lines;
}

const documents = trackedMarkdown().map((file) => {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  return { file, text, fences: fenceLines(text) };
});

const underAny = (file, prefixes) => prefixes.some((prefix) => file.startsWith(prefix));

const RUNS = [
  {
    cwd: 'packages/miniapp',
    files: documents.filter(({ file }) => !underAny(file, [OWN_RUN, ...UNVERIFIABLE_PACKAGES])).map(({ file }) => file),
  },
  {
    cwd: OWN_RUN.replace(/\/$/, ''),
    files: documents.filter(({ file }) => file.startsWith(OWN_RUN)).map(({ file }) => file),
  },
];

async function verify(cwd, files) {
  const previous = process.cwd();
  process.chdir(path.join(root, cwd));
  try {
    return await compileSnippets({ markdownFiles: files.map((file) => path.relative(path.join(root, cwd), path.join(root, file))) });
  } finally {
    process.chdir(previous);
  }
}

function describeFailures(cwd, results) {
  return results
    .filter((result) => result.error)
    .map((result) => {
      const file = path.relative(root, path.resolve(root, cwd, result.file));
      const fence = documents.find((doc) => doc.file === file)?.fences[result.index - 1];
      const lines = result.linesWithErrors.map((line) => (fence === undefined ? line : fence + line));
      return `${file}:${lines.join(',') || fence} (block ${result.index})\n${result.error.message}`;
    });
}

describe('every TypeScript fence in the docs compiles', () => {
  for (const { cwd, files } of RUNS) {
    it(`${cwd} compiles ${files.length} documents`, async () => {
      const expected = documents
        .filter((doc) => files.includes(doc.file))
        .reduce((sum, doc) => sum + doc.fences.length, 0);
      const results = await verify(cwd, files);
      assert.equal(results.length, expected, 'the verifier found a different number of fences than the scan did');
      assert.deepEqual(describeFailures(cwd, results), []);
    });
  }

  it('no fence opts out of the check', () => {
    const skipped = documents.filter(({ text }) => text.includes(IGNORE_MARKER)).map(({ file }) => file);
    assert.deepEqual(skipped, [], `${IGNORE_MARKER} hides a fence from the check`);
  });

  it('packages the verifier cannot run in hold no TypeScript fence', () => {
    const offenders = documents
      .filter(({ file, fences }) => underAny(file, UNVERIFIABLE_PACKAGES) && fences.length > 0)
      .map(({ file, fences }) => `${file}:${fences.join(',')}`);
    assert.deepEqual(offenders, [], 'these fences are never compiled, so move them into a document a run covers');
  });

  it('every fence sits in a document some run covers', () => {
    const covered = new Set(RUNS.flatMap(({ files }) => files));
    const unseen = documents
      .filter(({ file, fences }) => fences.length > 0 && !covered.has(file) && !underAny(file, UNVERIFIABLE_PACKAGES))
      .map(({ file }) => file);
    assert.deepEqual(unseen, []);
  });
});

describe('the verifier fails on a snippet that does not compile', () => {
  const block = (call) => ['```ts', "import { haptic } from '@skkuverse/miniapp';", '', `${call};`, '```', ''].join('\n');

  async function run(markdown) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-code-'));
    try {
      const file = path.join(dir, 'example.md');
      fs.writeFileSync(file, markdown);
      return await verify('packages/miniapp', [path.relative(root, file)]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  it('accepts a call to an exported function', async () => {
    const [result] = await run(block("haptic('light')"));
    assert.equal(result.error, undefined);
  });

  it('rejects a call to a function the package does not export', async () => {
    const [result] = await run(block("hapticc('light')"));
    assert.match(result.error?.message ?? '', /hapticc/);
    assert.deepEqual(result.linesWithErrors, [3]);
  });
});
