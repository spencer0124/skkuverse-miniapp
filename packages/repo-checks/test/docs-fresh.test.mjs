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
import path from 'node:path';
import { describe, it } from 'node:test';
import { files, transforms } from '../md.config.mjs';
import { plan, report, STALE } from '../scripts/docs-gen.mjs';
import { fill, partsOf, unbalanced } from '../scripts/engine.mjs';

const root = path.join(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

describe('the generated docs', () => {
  it('match what pnpm docs:gen writes now', () => {
    const run = spawnSync('node', [path.join(import.meta.dirname, '../scripts/docs-gen.mjs'), '--check'], { cwd: root, encoding: 'utf8' });

    assert.equal(run.error, undefined, `node did not run: ${run.error}`);
    assert.equal(run.status, 0, `${run.stderr}\nRun \`pnpm docs:gen\` and commit the result.`);
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

  it('fail when a part is named that no transform writes', () => {
    assert.throws(() => fill('<!-- docs-gen:begin no-such-part -->x<!-- docs-gen:end no-such-part -->', 'x.md', transforms), /no docs-gen transform named "no-such-part"/);
  });
});
