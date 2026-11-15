/**
 * The generator fails loudly, and says which fix applies, in the places where it could instead write a wrong value or
 * nothing: a `notify` it cannot attribute, a table that lists what no longer exists, a failed write of the API
 * reference, and a process that imports it instead of running it.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { describe, it, mock } from 'node:test';
import { pathToFileURL } from 'node:url';
import { transforms } from '../md.config.mjs';
import { plan, renderApi, run } from '../scripts/docs-gen.mjs';
import { methodSenders } from '../scripts/sources.mjs';

const root = path.join(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function withSources(files, body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-gen-src-'));
  try {
    for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
    return body(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('the sender scanner', () => {
  it('names the exported function that reaches a private helper through another private helper', () => {
    const senders = withSources(
      {
        'a.ts': `declare function notify(m: string, p: object): void;
function sendNow(url: string): void { notify('link.open', { url }); }
function send(url: string): void { sendNow(url); }
export function openUrl(url: string): void { send(url); }
`,
      },
      (dir) => methodSenders('a.ts', dir),
    );

    assert.deepEqual(senders.get('link.open'), ['openUrl()']);
  });

  it('names an exported arrow function', () => {
    const senders = withSources(
      { 'a.ts': `declare function notify(m: string, p: object): void;\nexport const ready = (): void => { notify('app.ready', {}); };\n` },
      (dir) => methodSenders('a.ts', dir),
    );

    assert.deepEqual(senders.get('app.ready'), ['ready()']);
  });

  it('does not credit a function whose own local shadows the helper', () => {
    const senders = withSources(
      {
        'a.ts': `declare function notify(m: string, p: object): void;
function send(url: string): void { notify('link.open', { url }); }
export function openUrl(url: string): void { send(url); }
export function countLink(url: string): number { const send = (v: string): number => v.length; return send(url); }
`,
      },
      (dir) => methodSenders('a.ts', dir),
    );

    assert.deepEqual(senders.get('link.open'), ['openUrl()']);
  });

  it('names a method of a typed object by its type', () => {
    const senders = withSources(
      {
        'a.ts': `declare function notify(m: string, p: object): void;
interface Client { start(): void }
export function boot(): Client { return { start() { notify('game.start', {}); } }; }
`,
      },
      (dir) => methodSenders('a.ts', dir),
    );

    assert.deepEqual(senders.get('game.start'), ['Client.start()']);
  });

  it('names a method of an object typed by a type alias, not by the compiler-internal name', () => {
    const senders = withSources(
      {
        'a.ts': `declare function notify(m: string, p: object): void;
type Client = { start(): void };
export function boot(): Client { return { start() { notify('game.start', {}); } }; }
`,
      },
      (dir) => methodSenders('a.ts', dir),
    );

    assert.deepEqual(senders.get('game.start'), ['Client.start()']);
  });

  it('fails for a method of an unannotated object', () => {
    withSources(
      { 'a.ts': `declare function notify(m: string, p: object): void;\nexport function boot() { return { start() { notify('game.start', {}); } }; }\n` },
      (dir) => {
        assert.throws(() => methodSenders('a.ts', dir), /notify\('game\.start', \.\.\.\) in a\.ts sits in a function docs-gen cannot name/);
      },
    );
  });

  it('fails for a method of an object typed inline, which has no name to print', () => {
    withSources(
      { 'a.ts': `declare function notify(m: string, p: object): void;\nexport function boot(): { start(): void } { return { start() { notify('game.start', {}); } }; }\n` },
      (dir) => {
        assert.throws(() => methodSenders('a.ts', dir), /notify\('game\.start', \.\.\.\) in a\.ts sits in a function docs-gen cannot name/);
      },
    );
  });

  it('prints the exported name of a function exported under another name', () => {
    const senders = withSources(
      {
        'a.ts': `declare function notify(m: string, p: object): void;
function openUrlImpl(url: string): void { notify('link.open', { url }); }
export { openUrlImpl as openUrl };
`,
      },
      (dir) => methodSenders('a.ts', dir),
    );

    assert.deepEqual(senders.get('link.open'), ['openUrl()']);
  });

  it('fails for an unnamed notify even when another call site names the same method', () => {
    withSources(
      {
        'a.ts': `declare function notify(m: string, p: object): void;
function orphan(): void { notify('app.ready', {}); }
export function ready(): void { notify('app.ready', {}); }
`,
      },
      (dir) => {
        assert.throws(() => methodSenders('a.ts', dir), /notify\('app\.ready', \.\.\.\) in a\.ts sits in a function docs-gen cannot name/);
      },
    );
  });

  it('fails, naming the method, when a notify sits where no function can be named', () => {
    withSources(
      { 'a.ts': `declare function notify(m: string, p: object): void;\nfunction orphan(): void { notify('map.openPlace', {}); }\nexport function unrelated(): void {}\n` },
      (dir) => {
        assert.throws(() => methodSenders('a.ts', dir), /notify\('map\.openPlace', \.\.\.\) in a\.ts sits in a function docs-gen cannot name/);
      },
    );
  });
});

describe('the architecture table check', () => {
  it('says which rows are missing and which are obsolete', async () => {
    const edited = (file) => {
      const text = read(file);
      if (file !== 'docs/explanation/architecture.md') return text;
      return text
        .replace(/^\| `@skkuverse\/ui` \|.*\n/m, '')
        .replace(/^(\| `@skkuverse\/tokens` \|.*\n)/m, '$1| `@skkuverse/no-such-package` | gone | gone |\n');
    };

    const { unfixable } = await plan({ read: edited, api: false });

    assert.ok(unfixable.some((line) => line.includes('the piece table has no row for @skkuverse/ui')), unfixable.join('\n'));
    assert.ok(unfixable.some((line) => line.includes('has a row for @skkuverse/no-such-package, which is no package or entry point')), unfixable.join('\n'));
  });
});

describe('the docs index', () => {
  it('lists the API reference whether or not the folder exists yet', () => {
    const exists = fs.existsSync;
    const missing = path.join('reference', 'api', 'README.md');
    const stub = mock.method(fs, 'existsSync', (file) => (String(file).endsWith(missing) ? false : exists(file)));
    try {
      assert.match(transforms['docs-index']({ folder: 'reference' }), /\[api\/README\.md\]\(reference\/api\/README\.md\)/);
    } finally {
      stub.mock.restore();
    }
  });
});

describe('the API reference render', () => {
  it('fails when TypeDoc cannot write a page, so a partial tree is never taken for the whole', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-gen-out-'));
    const write = fs.writeFileSync;
    // TypeDoc's markdown plugin logs a page it cannot write and carries on, which is the failure to simulate.
    const failing = mock.method(fs, 'writeFileSync', (file, ...rest) => {
      if (String(file).endsWith('.md')) throw new Error('no space left on device');
      return write(file, ...rest);
    });
    syncBuiltinESMExports();
    try {
      await assert.rejects(renderApi(dir), /could not write the API reference/);
    } finally {
      failing.mock.restore();
      syncBuiltinESMExports();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('the API reference plan', () => {
  it('fails when TypeDoc writes no README.md, which the docs index links to', async () => {
    const write = fs.writeFileSync;
    const stub = mock.method(fs, 'writeFileSync', (file, ...rest) => (/docs-gen-[^/\\]+[/\\]README\.md$/.test(String(file)) ? undefined : write(file, ...rest)));
    syncBuiltinESMExports();
    try {
      await assert.rejects(plan(), /wrote no README\.md/);
    } finally {
      stub.mock.restore();
      syncBuiltinESMExports();
    }
  });
});

describe('the command', () => {
  it('exits 1 on --check when a generated part differs', async () => {
    const edited = (file) => read(file).replace('| `haptic.impact` | `{ style: ', '| `haptic.impact` | `{ look: ');
    const errors = mock.method(console, 'error', () => {});
    try {
      assert.equal(await run(['--check'], { read: edited, api: false }), 1);
      assert.match(String(errors.mock.calls[0].arguments[0]), /Docs are out of date\. Run `pnpm docs:gen`/);
      assert.equal(await run(['--check'], { api: false }), 0);
    } finally {
      errors.mock.restore();
    }
  });

  it('is not the entry when imported by a process whose argv[1] is no file', () => {
    const url = pathToFileURL(path.join(import.meta.dirname, '../scripts/docs-gen.mjs')).href;
    const script = `process.argv[1] = '/no/such/entry.mjs'; await import(${JSON.stringify(url)}); console.log('imported');`;

    const result = spawnSync('node', ['--input-type=module', '-e', script], { cwd: root, encoding: 'utf8' });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /imported/);
  });
});
