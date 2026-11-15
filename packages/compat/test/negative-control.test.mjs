/**
 * An `ok` cell proves nothing unless the matrix can fail. This test breaks one host's parser, so that it rejects
 * `app.ready` unless the message carries a token, and asserts that exactly that host's `ready` cells change and
 * nothing else does. The patched host is a copy of the installed package, so node_modules stays as pnpm left it.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { COMPAT_ROOT } from '../src/cell.mjs';
import { runMatrix } from '../src/matrix.mjs';

const PATCHED = '0.4.2';
const KEPT = ['0.2.0', '0.3.0', '0.4.0', PATCHED];
const ANCHOR = 'const valid = PARAMS[method](params);';
const FAULT = 'if (method === "app.ready" && params.token === undefined) return null;';

function installWith(dir, patched) {
  const modules = path.join(dir, 'node_modules');
  fs.mkdirSync(modules, { recursive: true });
  const real = (name) => fs.realpathSync(path.join(COMPAT_ROOT, 'node_modules', name));
  fs.symlinkSync(real('happy-dom'), path.join(modules, 'happy-dom'));
  fs.symlinkSync(real('sdk-workspace'), path.join(modules, 'sdk-workspace'));
  for (const version of KEPT) {
    const target = path.join(modules, `sdk-${version}`);
    if (version !== PATCHED || !patched) {
      fs.symlinkSync(real(`sdk-${version}`), target);
      continue;
    }
    fs.cpSync(real(`sdk-${version}`), target, { recursive: true });
    const dist = path.join(target, 'dist');
    const files = fs.readdirSync(dist).filter((f) => f.endsWith('.js'));
    const holders = files.filter((f) => fs.readFileSync(path.join(dist, f), 'utf8').includes(ANCHOR));
    assert.equal(holders.length, 1, `the parser line moved in ${version}: ${holders.length} files hold "${ANCHOR}", so this control would break nothing`);
    const file = path.join(dist, holders[0]);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(ANCHOR, `${FAULT}\n  ${ANCHOR}`));
  }
  return dir;
}

describe('the negative control', () => {
  let scratch;
  let clean;
  let broken;
  before(async () => {
    scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'compat-negative-'));
    clean = await runMatrix(installWith(path.join(scratch, 'clean'), false));
    broken = await runMatrix(installWith(path.join(scratch, 'broken'), true));
  });
  after(() => fs.rmSync(scratch, { recursive: true, force: true }));

  const key = (r) => `${r.mode} ${r.page} ${r.host} ${r.build}`;

  it('runs the same cells on both installs', () => {
    assert.deepEqual(broken.map(key), clean.map(key));
    assert.equal(broken.filter((r) => r.crash !== undefined).length, 0);
  });

  it('fails the ready scenario in the patched host column, for every page that sends app.ready', () => {
    const ready = broken.filter((r) => r.mode === 'mini' && r.host === PATCHED);
    assert.ok(ready.length >= 2 * (KEPT.length + 1), 'the patched column should hold a mini cell per page and build');
    for (const r of ready) {
      const before = clean.find((c) => key(c) === key(r)).scenarios.find((s) => s.id === 'ready');
      const after = r.scenarios.find((s) => s.id === 'ready');
      assert.equal(before.status, 'ok', `${key(r)} ready was not ok before the fault`);
      assert.equal(after.status, 'broken', `${key(r)} ready still passes with the fault, so an ok cell here proves nothing`);
    }
  });

  it('changes that column only, and only its ready scenario', () => {
    const changed = broken.filter((r) => JSON.stringify(r.scenarios) !== JSON.stringify(clean.find((c) => key(c) === key(r)).scenarios));
    assert.ok(changed.length > 0, 'the fault changed no cell');
    for (const r of changed) {
      assert.equal(r.host, PATCHED, `${key(r)} changed, but only host ${PATCHED} was patched: ${JSON.stringify(r.scenarios)} against ${JSON.stringify(clean.find((c) => key(c) === key(r)).scenarios)}`);
      assert.equal(r.mode, 'mini', `${key(r)} changed, but only a mini-app page sends app.ready`);
      const before = clean.find((c) => key(c) === key(r)).scenarios;
      const moved = r.scenarios.filter((s, i) => JSON.stringify(s) !== JSON.stringify(before[i])).map((s) => s.id);
      assert.deepEqual(moved, ['ready'], `${key(r)} changed scenarios other than ready`);
    }
  });
});
