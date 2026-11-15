/**
 * A doc never states a value the code owns by hand. `pnpm docs:gen` writes each such value, and the table of API
 * pages, from the code, the workflows and the manifests that own them, and this test fails when any file on disk
 * differs from what the generator would write now. That covers a stale committed value, a value edited by hand and a
 * value whose source changed, and it needs no git state, so a change that is only in the working tree fails too.
 *
 * The packages must be built first, because some parts read their output. `repo-checks#test` in turbo.json builds
 * the workspace packages this package depends on.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { enginesPhrase, files, transforms } from '../md.config.mjs';
import { check, plan, report, STALE, UNFIXABLE } from '../scripts/docs-gen.mjs';
import { fill, partsOf, unbalanced } from '../scripts/engine.mjs';
import { methodSenders } from '../scripts/sources.mjs';

const root = path.join(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

describe('the generated docs', () => {
  it('match what pnpm docs:gen writes now', async () => {
    const message = await check();

    assert.equal(message, null, message ?? '');
  });

  it('are the same after a second run', () => {
    for (const file of files) {
      const once = fill(read(file), file, transforms).text;
      assert.equal(fill(once, file, transforms).text, once, `${file} changes on a second run`);
    }
  });

  it('give every listed file a part, and pair every comment', () => {
    for (const file of files) {
      assert.ok(partsOf(read(file)).length > 0, `${file} holds no docs-gen part`);
      assert.equal(unbalanced(read(file)), false, `${file} has a docs-gen comment with no partner`);
    }
  });

  it('fail with the message, naming the file, when a generated row is edited by hand', async () => {
    const edited = (file) => read(file).replace('| `haptic.impact` | `{ style: ', '| `haptic.impact` | `{ look: ');
    assert.notEqual(edited('docs/reference/protocol.md'), read('docs/reference/protocol.md'), 'the row this case edits is gone');

    const { stale, unfixable } = await plan({ read: edited, api: false });

    assert.deepEqual(stale, ['docs/reference/protocol.md: a generated part differs from the code']);
    assert.match(report(stale, unfixable), new RegExp(STALE.replaceAll('`', '\\`')));
  });

  it('say to run the generator only for what it can write, and to edit the doc for the rest', () => {
    const onlyUnfixable = report([], ['a.md: a table is wrong']);
    assert.match(onlyUnfixable, new RegExp(UNFIXABLE));
    assert.doesNotMatch(onlyUnfixable, /pnpm docs:gen/);

    const onlyStale = report(['b.md: a generated part differs from the code'], []);
    assert.match(onlyStale, new RegExp(STALE.replaceAll('`', '\\`')));
    assert.doesNotMatch(onlyStale, new RegExp(UNFIXABLE));
  });

  it('run, and fail on an argument it does not know, from a path with a space and a symlink in it', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs gen '));
    try {
      const link = path.join(dir, 'a link', 'docs-gen.mjs');
      fs.mkdirSync(path.dirname(link));
      fs.symlinkSync(path.join(import.meta.dirname, '../scripts/docs-gen.mjs'), link);

      const run = spawnSync('node', [link, '--no-such-option'], { cwd: root, encoding: 'utf8' });

      assert.equal(run.error, undefined);
      assert.equal(run.status, 1, `exited ${run.status} without running: ${run.stdout}${run.stderr}`);
      assert.match(run.stderr, /unknown argument --no-such-option/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('say a nonzero patch of a Node range', () => {
    assert.equal(enginesPhrase('>=22.13.1'), 'Node 22.13.1 or later');
    assert.equal(enginesPhrase('>=22.13.0'), 'Node 22.13 or later');
    assert.equal(enginesPhrase('^20.19.2 || >=22.13.0'), 'Node 20.19.2 or later in the 20 line, or Node 22.13 or later');
  });

  it('name the SDK function that sends each method and the handler that receives each event', () => {
    assert.deepEqual(methodSenders('packages/miniapp/src/sdk/').get('haptic.impact'), ['haptic()']);
    assert.deepEqual(methodSenders('packages/miniapp/src/game/boot.ts').get('game.ready'), ['bootGame()']);
    assert.match(read('docs/reference/protocol.md'), /\| `game\.init` \| .* \| `onInit` \|/);
  });

  it('fail when a part is named that no transform writes', () => {
    assert.throws(() => fill('<!-- docs-gen:begin no-such-part -->x<!-- docs-gen:end no-such-part -->', 'x.md', transforms), /no docs-gen transform named "no-such-part"/);
  });
});
