import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { entryOf, findRoot, loadConfig } from '../src/config.ts';

const scratch = mkdtempSync(join(tmpdir(), 'miniapp-cli-config-test-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

/** A folder that holds a deploy.config.json, with `inner` nested below it. */
function repo(inner: string): { root: string; start: string } {
  const root = mkdtempSync(join(scratch, 'root-'));
  writeFileSync(join(root, 'deploy.config.json'), '{"apps":{}}');
  const start = join(root, inner);
  mkdirSync(start, { recursive: true });
  return { root, start };
}

describe('findRoot', () => {
  it('returns the folder that holds deploy.config.json, from that folder or from one below it', () => {
    const { root, start } = repo(join('apps', 'club', 'src'));
    assert.equal(findRoot(root), root);
    assert.equal(findRoot(start), root);
  });

  it('returns the nearest folder when two nest', () => {
    const outer = repo('games');
    const inner = join(outer.start, 'sub');
    mkdirSync(inner);
    writeFileSync(join(inner, 'deploy.config.json'), '{"apps":{}}');
    assert.equal(findRoot(inner), inner);
    assert.equal(findRoot(outer.start), outer.root);
  });

  it('throws, naming the start folder and --root, when nothing above holds one', () => {
    const empty = mkdtempSync(join(scratch, 'empty-'));
    assert.throws(
      () => findRoot(empty),
      (error: unknown) => error instanceof Error && error.message.includes(empty) && error.message.includes('--root'),
    );
  });
});

describe('loadConfig', () => {
  const load = (config: unknown) => {
    const root = mkdtempSync(join(scratch, 'config-'));
    writeFileSync(join(root, 'deploy.config.json'), JSON.stringify(config));
    return loadConfig(root);
  };

  it('finds only the entries the file lists, none that every object inherits', () => {
    const config = load({ apps: { constructor: { project: 'miniapp-constructor' } } });
    assert.equal(entryOf(config, 'app', 'constructor')?.project, 'miniapp-constructor');
    assert.equal(entryOf(config, 'game', 'constructor'), undefined);
    assert.equal(entryOf(config, 'app', 'toString'), undefined);
  });

  it("accepts a Pages project named for its section, the id aside", () => {
    const config = load({ apps: { 'eskara-2026': { project: 'miniapp-eskara' } }, games: { apple: { project: 'game-apple' } } });
    assert.equal(config.apps['eskara-2026']?.project, 'miniapp-eskara');
  });

  it("refuses a Pages project outside its section's prefix, or one two entries deploy to", () => {
    assert.throws(() => load({ apps: { foo: { project: 'game-bar' } } }), /apps\.foo deploys to "game-bar"; a miniapp's Pages project starts with "miniapp-"/);
    assert.throws(() => load({ apps: {}, games: { foo: { project: 'miniapp-foo' } } }), /games\.foo deploys to "miniapp-foo"; a game's Pages project starts with "game-"/);
    assert.throws(() => load({ apps: { foo: {} } }), /apps\.foo has no "project"/);
    assert.throws(
      () => load({ apps: { a: { project: 'miniapp-a' }, b: { project: 'miniapp-a' } } }),
      /apps\.b deploys to "miniapp-a", which apps\.a deploys to/,
    );
  });
});
