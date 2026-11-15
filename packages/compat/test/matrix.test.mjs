/**
 * The compatibility matrix is a generated, tested table. This file regenerates it from the installed packages and
 * fails when the committed files differ, when a protocol method has no scenario, and when a cell that the CHANGELOG
 * does not explain turns up. The versions filter that drift.yml runs is covered here too.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import { COVERED_METHODS } from '../src/cell.mjs';
import { COMPAT_FILE, generate, PAGE_FILE, support } from '../src/matrix.mjs';
import { changelogEntry } from '../src/render.mjs';
import { aliasedVersions, missingAliases, releaseVersions } from '../src/versions.mjs';

const root = path.join(import.meta.dirname, '../../..');
const manifest = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../package.json'), 'utf8'));
const changelog = fs.readFileSync(path.join(root, 'packages/miniapp/CHANGELOG.md'), 'utf8');
const REGENERATE = 'Run `pnpm --filter compat generate` and commit the result.';

describe('the generated matrix', () => {
  let generated;
  before(async () => {
    generated = await generate();
  });

  it('matches compat.json on disk', () => {
    assert.equal(fs.readFileSync(COMPAT_FILE, 'utf8'), generated.json, `compat.json is out of date. ${REGENERATE}`);
  });

  it('matches docs/reference/compatibility.md on disk', () => {
    assert.equal(fs.readFileSync(PAGE_FILE, 'utf8'), generated.page, `docs/reference/compatibility.md is out of date. ${REGENERATE}`);
  });

  it('covers every published version and the workspace, with no crashed cell', () => {
    const { pages, hosts } = generated.compat.meta;
    assert.deepEqual(hosts, aliasedVersions(manifest));
    assert.deepEqual(pages, [...hosts, 'workspace']);
    for (const build of ['esm', 'global']) {
      for (const page of pages) assert.deepEqual(Object.keys(generated.compat.cells[build][page]), hosts, `${build} row ${page}`);
    }
  });

  it('links each published version to its release tag, or says why it cannot', () => {
    for (const [version, link] of Object.entries(generated.compat.versions)) {
      if (version === 'workspace') continue;
      if (link.tag === null) assert.equal(link.reason, 'no reproducible commit', version);
      else {
        assert.equal(link.tag, `@skkuverse/miniapp@${version}`);
        assert.match(link.release, /^https:\/\/github\.com\/[^/]+\/skkuverse-miniapp\/releases\/tag\/%40skkuverse%2Fminiapp%40/, version);
        assert.ok(generated.page.includes(`[${version}]: ${link.release}`), `${version} header link is missing from the page`);
      }
    }
  });

  it('links every non-ok cell to an anchor that survives the docs site', () => {
    const ids = [...generated.page.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]);
    assert.ok(ids.length > 0, 'the page has no anchors');
    for (const id of ids) assert.match(id, /^[a-z0-9-]+$/, `${id} holds a character the docs site rewrites in a link fragment, so the link would break there`);
    const cellLinks = [...generated.page.matchAll(/\]\(#((?:esm|global|late)-[^)]+)\)/g)].map((m) => m[1]);
    assert.ok(cellLinks.length > 0, 'the page links no cell');
    for (const link of cellLinks) assert.ok(ids.includes(link), `a table cell links #${link}, which no anchor defines`);
    for (const id of ids) assert.ok(cellLinks.includes(id), `anchor ${id} is linked from no cell`);
  });

  it('gives every feature entry the three browser-compat-data fields', () => {
    for (const [name, { __compat: compat }] of Object.entries(generated.compat.features)) {
      for (const page of generated.compat.meta.pages) {
        const entry = compat.support[page];
        assert.ok(entry, `${name} has no entry for page ${page}`);
        assert.ok(entry.version_added === false || typeof entry.version_added === 'string', `${name}/${page} version_added`);
        assert.equal(typeof entry.notes, 'string', `${name}/${page} notes`);
        assert.equal(typeof entry.partial_implementation, 'boolean', `${name}/${page} partial_implementation`);
      }
    }
  });

  it('names a CHANGELOG entry for every non-ok cell of a published page', () => {
    const { cells, meta } = generated.compat;
    for (const build of ['esm', 'global']) {
      for (const page of meta.pages.filter((p) => p !== 'workspace')) {
        for (const [host, cell] of Object.entries(cells[build][page])) {
          for (const scenario of cell.scenarios ?? []) {
            assert.ok(changelogEntry(changelog, page, scenario), `${build} page ${page} on host ${host}: ${scenario.id} (${scenario.status}) is named by no CHANGELOG entry, so a break shipped unannounced`);
          }
        }
      }
    }
  });
});

describe('the scenario list', () => {
  it('has a scenario for every notification method of the workspace protocol', async () => {
    const protocol = await import('sdk-workspace/protocol');
    const missing = [...protocol.NOTIFY_METHODS, ...protocol.GAME_NOTIFY_METHODS].filter((method) => !COVERED_METHODS.includes(method));
    assert.deepEqual(missing, [], `${missing.join(', ')} has no scenario. Add a line to METHOD_SCENARIOS (or GAME_OUTBOUND) in packages/compat/src/cell.mjs, as docs/how-to/add-a-bridge-method.md says.`);
  });

  it('names no method the workspace protocol lacks', async () => {
    const protocol = await import('sdk-workspace/protocol');
    const known = [...protocol.NOTIFY_METHODS, ...protocol.GAME_NOTIFY_METHODS];
    assert.deepEqual(
      COVERED_METHODS.filter((method) => !known.includes(method)),
      [],
      'a scenario in packages/compat/src/cell.mjs sends a method the protocol no longer has',
    );
  });
});

describe('the release versions filter', () => {
  it('keeps releases and drops every prerelease, oldest first', () => {
    assert.deepEqual(releaseVersions(['0.4.2', '0.4.3-dev.12+abc1234', '0.1.0', '1.0.0-rc.1', '0.4.3-dev.1']), ['0.1.0', '0.4.2']);
  });

  it('reads the single-version form npm prints', () => {
    assert.deepEqual(releaseVersions('0.1.0'), ['0.1.0']);
  });

  it('rejects an entry that is no version', () => {
    assert.throws(() => releaseVersions(['0.4.2', 'latest']), /not a semver version: "latest"/);
    assert.throws(() => releaseVersions({}), /JSON array/);
  });

  it('finds the release with no alias, and ignores a snapshot', () => {
    assert.deepEqual(missingAliases(['0.4.2', '0.4.3'], manifest), ['0.4.3']);
    assert.deepEqual(missingAliases(['0.4.2', '0.4.3-dev.1'], manifest), []);
  });

  it('refuses an alias that points at another version', () => {
    assert.throws(() => aliasedVersions({ devDependencies: { 'sdk-0.4.2': 'npm:@skkuverse/miniapp@0.4.1' } }), /must be "npm:@skkuverse\/miniapp@0.4.2"/);
  });

  it('has an alias for every release the provenance file records', () => {
    const recorded = JSON.parse(fs.readFileSync(path.join(root, 'packages/repo-checks/release-provenance.json'), 'utf8'))
      .filter((e) => e.name === '@skkuverse/miniapp')
      .map((e) => e.version);
    assert.deepEqual(missingAliases(recorded, manifest), []);
  });
});

describe('the support statement', () => {
  const hosts = ['0.1.0', '0.2.0', '0.3.0', '0.4.0'];
  const at = (...statuses) => Object.fromEntries(hosts.map((h, i) => [h, { status: statuses[i], detail: `${statuses[i]} on ${h}` }]));

  it('starts at the first host of the run that works', () => {
    assert.deepEqual(support(at('n/a', 'gap', 'ok', 'ok'), hosts), { version_added: '0.3.0', notes: 'gap: gap on 0.2.0 (host 0.2.0)', partial_implementation: false });
  });

  it('marks a fallback before the first working host as partial', () => {
    const entry = support(at('n/a', 'fallback', 'ok', 'ok'), hosts);
    assert.equal(entry.version_added, '0.3.0');
    assert.equal(entry.partial_implementation, true);
  });

  it('keeps the earlier range when the newest host regresses', () => {
    const entry = support(at('n/a', 'ok', 'ok', 'broken'), hosts);
    assert.equal(entry.version_added, '0.2.0');
    assert.equal(entry.version_removed, '0.4.0');
    assert.match(entry.notes, /broken: broken on 0\.4\.0 \(host 0\.4\.0\)/);
  });

  it('says it never works when no host does, and reads a page with no measured host', () => {
    assert.equal(support(at('n/a', 'broken', 'broken', 'broken'), hosts).version_added, false);
    assert.deepEqual(support(at('n/a', 'n/a', 'n/a', 'n/a'), hosts), { version_added: false, notes: 'n/a on 0.1.0', partial_implementation: false });
  });
});
