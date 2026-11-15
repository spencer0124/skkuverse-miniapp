/**
 * Only a host with no `protocol` entry is `n/a`. A host whose entry exists but fails to load is a broken install or a
 * real bug, so the cell must crash loudly instead of reading as a version that was never built for hosting.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { COMPAT_ROOT, runCell } from '../src/cell.mjs';

const HOST = '0.4.2';

describe('loading a host protocol entry', () => {
  let scratch;
  const install = (name, edit) => {
    const dir = path.join(scratch, name);
    const modules = path.join(dir, 'node_modules');
    fs.mkdirSync(modules, { recursive: true });
    const real = (n) => fs.realpathSync(path.join(COMPAT_ROOT, 'node_modules', n));
    fs.symlinkSync(real('happy-dom'), path.join(modules, 'happy-dom'));
    fs.symlinkSync(real('sdk-workspace'), path.join(modules, 'sdk-workspace'));
    const host = path.join(modules, `sdk-${HOST}`);
    fs.cpSync(real(`sdk-${HOST}`), host, { recursive: true });
    edit(path.join(host, 'dist', 'protocol'));
    return dir;
  };

  before(() => {
    scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'compat-hostload-'));
  });
  after(() => fs.rmSync(scratch, { recursive: true, force: true }));

  it('crashes when the entry exists but throws on import', async () => {
    const dir = install('throws', (protocol) => fs.writeFileSync(path.join(protocol, 'index.js'), 'throw new Error("boom from host entry");\n'));
    const result = await runCell('mini', 'workspace', HOST, 'esm', dir);
    assert.match(result.crash ?? '', /boom from host entry/);
  });

  it('is n/a when the host has no protocol entry', async () => {
    const dir = install('missing', (protocol) => fs.rmSync(protocol, { recursive: true, force: true }));
    const result = await runCell('mini', 'workspace', HOST, 'esm', dir);
    assert.equal(result.crash, undefined);
    assert.equal(result.scenarios[0].status, 'n/a');
    assert.match(result.scenarios[0].detail, /no protocol entry/);
  });
});
