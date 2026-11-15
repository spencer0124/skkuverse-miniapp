/**
 * Every TypeScript example in the docs compiles against the built packages, so a doc that drifts from the API
 * fails here, and an agent that copies an example gets code that typechecks.
 *
 * typescript-docs-verifier compiles each `ts`, `tsx` and `typescript` fence on its own, and swaps an import of the
 * package it runs in for that package's `exports` entry. It reads the package it runs in from the working
 * directory, and that package needs an `exports` field and a tsconfig. packages/miniapp has both and holds
 * @skkuverse/ui and @skkuverse/tokens as dependencies, so one run there covers every document that imports them.
 * packages/ui gets its own run, because its README imports its own entry. packages/cli and packages/game-contract
 * have no `exports`, so the verifier cannot run there, and the coverage case holds every document no run covers,
 * those two packages' and the generated changelogs and changesets among them, to no such fence. A third case finds
 * openers the verifier skips, such as `ts{2}` or `~~~ts`, with a scan written separately from the verifier's own.
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

// What the verifier compiles: three backticks, one of its three language names, nothing else on the line.
const COMPILED_OPENER = /^[ \t]*```(?:typescript|tsx?)\r?$/i;
// Anything that reads as a TypeScript fence to a human or to GitHub, however it is spelled. Written on its own, so a
// spelling the verifier skips is still found here.
const ANY_TS_OPENER = /^[ \t]*(?:`{3,}|~{3,})[ \t]*(?:typescript|tsx?|mts|cts)\b/i;

// Which documents each run compiles. A path ending in `/` is a directory prefix.
const RUNS = [
  { cwd: 'packages/miniapp', covers: ['docs/', 'README.md', 'packages/miniapp/README.md', 'packages/tokens/README.md'] },
  { cwd: 'packages/ui', covers: ['packages/ui/README.md'] },
];

const isCovered = (file, covers) => covers.some((entry) => (entry.endsWith('/') ? file.startsWith(entry) : file === entry));

function trackedMarkdown() {
  const out = execFileSync('git', ['ls-files', '-z', '--', '*.md'], { cwd: root, encoding: 'utf8' });
  return out
    .split('\0')
    .filter((file) => file !== '')
    .filter((file) => fs.existsSync(path.join(root, file)));
}

function scan(text) {
  const compiled = [];
  const other = [];
  text.split('\n').forEach((line, i) => {
    if (COMPILED_OPENER.test(line)) compiled.push(i + 1);
    else if (ANY_TS_OPENER.test(line)) other.push(i + 1);
  });
  return { compiled, other };
}

const documents = trackedMarkdown().map((file) => {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  return { file, text, ...scan(text) };
});

const runFiles = ({ covers }) => documents.filter(({ file }) => isCovered(file, covers)).map(({ file }) => file);

async function verify(cwd, files) {
  const previous = process.cwd();
  process.chdir(path.join(root, cwd));
  try {
    return await compileSnippets({ markdownFiles: files.map((file) => path.relative(path.join(root, cwd), path.join(root, file))) });
  } catch (error) {
    throw locateImport(error, files);
  } finally {
    process.chdir(previous);
  }
}

// The verifier throws one error for the whole run when an import path is not in `exports`, and says nothing about
// where it is. Name the line.
function locateImport(error, files) {
  const specifier = /Unable to resolve export for path "([^"]+)"/.exec(error?.message ?? '')?.[1];
  if (specifier === undefined) return error;
  const places = [];
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    text.split('\n').forEach((line, i) => {
      if (line.includes(`'${specifier}'`) || line.includes(`"${specifier}"`)) places.push(`${file}:${i + 1}`);
    });
  }
  return new Error(`${error.message}\nimported at ${places.join(', ') || 'a line this scan could not find'}`);
}

function describeFailures(cwd, results) {
  return results
    .filter((result) => result.error)
    .map((result) => {
      const file = path.relative(root, path.resolve(root, cwd, result.file));
      const fence = documents.find((doc) => doc.file === file)?.compiled[result.index - 1];
      const lines = result.linesWithErrors.map((line) => (fence === undefined ? line : fence + line));
      return `${file}:${lines.join(',') || fence} (block ${result.index})\n${result.error.message}`;
    });
}

describe('every TypeScript fence in the docs compiles', () => {
  for (const run of RUNS) {
    const files = runFiles(run);
    it(`${run.cwd} compiles ${files.length} documents`, async () => {
      const expected = documents
        .filter((doc) => files.includes(doc.file))
        .reduce((sum, doc) => sum + doc.compiled.length, 0);
      const results = await verify(run.cwd, files);
      assert.equal(results.length, expected, 'the verifier found a different number of fences than the scan did');
      assert.deepEqual(describeFailures(run.cwd, results), []);
    });
  }

  it('no fence opts out of the check', () => {
    const skipped = documents.filter(({ text }) => text.includes(IGNORE_MARKER)).map(({ file }) => file);
    assert.deepEqual(skipped, [], `${IGNORE_MARKER} hides a fence from the check`);
  });

  it('every TypeScript fence is spelled the way the verifier compiles it', () => {
    const skipped = documents
      .filter(({ other }) => other.length > 0)
      .map(({ file, other }) => `${file}:${other.join(',')}`);
    assert.deepEqual(skipped, [], 'the verifier skips these openers; write exactly three backticks and ts, tsx or typescript');
  });

  it('every TypeScript fence sits in a document a run compiles', () => {
    const uncovered = documents
      .filter(({ file, compiled }) => compiled.length > 0 && !RUNS.some(({ covers }) => isCovered(file, covers)))
      .map(({ file, compiled }) => `${file}:${compiled.join(',')}`);
    assert.deepEqual(
      uncovered,
      [],
      'no run compiles these documents (packages/cli and packages/game-contract have no `exports`, and changelogs and changesets are generated); use another fence language or move the example into a covered document',
    );
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

  it('names the line of an import path the package does not export', async () => {
    const markdown = ['# x', '', '```ts', "import { MiniappRoot } from '@skkuverse/miniapp/reactt';", '', 'export const used = MiniappRoot;', '```', ''].join('\n');
    await assert.rejects(run(markdown), /Unable to resolve export for path "@skkuverse\/miniapp\/reactt"\nimported at .*example\.md:4/);
  });
});
