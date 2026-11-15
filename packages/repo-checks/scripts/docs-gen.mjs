/**
 * `pnpm docs:gen` writes every generated part of the docs, and the API reference under docs/reference/api.
 * `pnpm docs:gen --check` writes nothing and exits 1 when any of it differs from what is on disk, which is what
 * test/docs-fresh.test.mjs runs. The packages must be built first, because some parts read their output.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Application, ReflectionKind } from 'typedoc';
import { MarkdownPageEvent } from 'typedoc-plugin-markdown';
import { files, transforms, verifiers } from '../md.config.mjs';
import { fill, unbalanced } from './engine.mjs';
import { root } from './sources.mjs';

export const STALE = 'Docs are out of date. Run `pnpm docs:gen` and commit the result.';
export const UNFIXABLE = 'The generator cannot fix these. Edit the doc.';

const API_DIR = 'docs/reference/api';

/** The public name of each entry point, in the order the reference lists them. */
const MODULES = {
  'miniapp/src': '@skkuverse/miniapp',
  'miniapp/src/protocol': '@skkuverse/miniapp/protocol',
  'miniapp/src/game': '@skkuverse/miniapp/game',
  'miniapp/src/react': '@skkuverse/miniapp/react',
  'miniapp/src/react/ui': '@skkuverse/miniapp/react/ui',
  'miniapp/src/testing': '@skkuverse/miniapp/testing',
  'ui/src': '@skkuverse/ui',
  'tokens/src': '@skkuverse/tokens',
};

async function renderApi(out) {
  const app = await Application.bootstrapWithPlugins({
    options: path.join(root, 'packages/repo-checks/typedoc.json'),
    tsconfig: path.join(root, 'packages/repo-checks/tsconfig.typedoc.json'),
    out,
  });
  // The frontmatter plugin writes the static keys from typedoc.json. The docs conventions also need a title, and a page
  // is named after the entry point and the member it documents, so two members of one name stay apart.
  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    let top = page.model;
    while (top.parent !== undefined && top.parent.parent !== undefined) top = top.parent;
    const entry = top === page.model ? '' : `${top.name} `;
    const kind = page.model.kind === ReflectionKind.Module || page.model.kind === ReflectionKind.Project ? '' : ` (${ReflectionKind.singularString(page.model.kind).toLowerCase()})`;
    const title = page.model.kind === ReflectionKind.Project ? 'API reference' : `${entry}${page.model.name}${kind}`.trim();
    page.frontmatter = { title, ...page.frontmatter };
  });
  const project = await app.convert();
  if (project === undefined) throw new Error('TypeDoc could not convert the entry points');
  for (const module of project.children ?? []) {
    const name = MODULES[module.name];
    if (name === undefined) throw new Error(`TypeDoc named an entry point "${module.name}" that docs-gen has no public name for`);
    module.name = name;
  }
  project.children?.sort((a, b) => Object.values(MODULES).indexOf(a.name) - Object.values(MODULES).indexOf(b.name));
  app.validate(project);
  if (app.logger.hasErrors() || app.logger.hasWarnings()) throw new Error('TypeDoc reported a problem, listed above');
  await app.generateOutputs(project);
}

/**
 * TypeDoc writes a `@default` value as a `ts` fence, and the doc-code test compiles every `ts` fence under docs/. A bare
 * expression such as `false` or `'primary'` is no program, so the value goes inline. A default that spans lines would
 * need a fence, and there is none to turn: fail, so the choice is made on purpose.
 */
function unfence(name, text) {
  const inline = text.replace(/^(#+ Default\n\n)```ts\n([^\n]+)\n```$/gm, (_whole, heading, value) => `${heading}\`${value}\``);
  if (/^```/m.test(inline)) throw new Error(`${API_DIR}/${name} holds a code fence that the doc-code test would compile. Teach unfence in docs-gen.mjs about it.`);
  return inline;
}

function readTree(dir) {
  const found = new Map();
  if (!fs.existsSync(dir)) return found;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else found.set(path.relative(dir, full), fs.readFileSync(full, 'utf8'));
    }
  };
  walk(dir);
  return found;
}

/** What differs between the files on disk and what the generator would write, as `path: reason` lines. */
export async function plan({ read = (file) => fs.readFileSync(path.join(root, file), 'utf8'), api = true } = {}) {
  const writes = new Map();
  const stale = [];
  const unfixable = [];

  for (const file of files) {
    const current = read(file);
    if (unbalanced(current)) throw new Error(`${file}: a docs-gen:begin and docs-gen:end comment do not pair up`);
    const { text, parts } = fill(current, file, transforms);
    if (parts.length === 0) throw new Error(`${file} is listed in md.config.mjs but holds no docs-gen part`);
    if (text !== current) {
      writes.set(file, text);
      stale.push(`${file}: a generated part differs from the code`);
    }
  }

  for (const { file, check } of verifiers) for (const problem of check()) unfixable.push(`${file}: ${problem}`);

  if (!api) return { writes, stale, unfixable };
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-gen-'));
  try {
    await renderApi(scratch);
    const fresh = new Map([...readTree(scratch)].map(([name, text]) => [name, unfence(name, text)]));
    const onDisk = readTree(path.join(root, API_DIR));
    const removed = [...onDisk.keys()].filter((name) => !fresh.has(name));
    const changed = [...fresh].filter(([name, text]) => onDisk.get(name) !== text);
    for (const [name, text] of changed) writes.set(`${API_DIR}/${name}`, text);
    for (const name of removed) writes.set(`${API_DIR}/${name}`, null);
    if (changed.length + removed.length > 0) stale.push(`${API_DIR}: ${changed.length} page(s) differ and ${removed.length} are stale`);
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
  return { writes, stale, unfixable };
}

function apply(writes) {
  for (const [file, text] of writes) {
    const full = path.join(root, file);
    if (text === null) fs.rmSync(full);
    else {
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, text);
    }
  }
}

const lines = (items) => items.map((line) => `  ${line}`).join('\n');

/** The message for a drift: the fix to run only when the generator can write one, the doc to edit for the rest. */
export function report(stale, unfixable) {
  const sections = [];
  if (stale.length > 0) sections.push(`${STALE}\n${lines(stale)}`);
  if (unfixable.length > 0) sections.push(`${UNFIXABLE}\n${lines(unfixable)}`);
  return sections.join('\n');
}

/** What `--check` prints, or `null` when every generated part and the API reference match the code. */
export async function check(options) {
  const { stale, unfixable } = await plan(options);
  return stale.length + unfixable.length > 0 ? report(stale, unfixable) : null;
}

async function main(args) {
  const unknown = args.filter((arg) => arg !== '--check');
  if (unknown.length > 0) throw new Error(`unknown argument ${unknown.join(' ')}. The only option is --check.`);
  if (args.includes('--check')) {
    const message = await check();
    if (message !== null) {
      console.error(message);
      process.exitCode = 1;
    }
    return;
  }
  const { writes, unfixable } = await plan();
  apply(writes);
  if (unfixable.length > 0) {
    console.error(report([], unfixable));
    process.exitCode = 1;
  }
}

// Compare real paths as URLs: a space, a non-ASCII letter, `#` or `%` in the path, or a symlink, would otherwise make
// the two differ and the script exit 0 without running.
const entry = process.argv[1] === undefined ? undefined : pathToFileURL(fs.realpathSync(process.argv[1])).href;
if (import.meta.url === entry) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(`docs-gen stopped: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
