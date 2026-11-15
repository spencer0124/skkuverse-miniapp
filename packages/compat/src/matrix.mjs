/**
 * The compatibility matrix: every page SDK version against every host bootstrap version.
 *
 *     node src/matrix.mjs            print the generated files without writing them
 *     node src/matrix.mjs --write    write compat.json and docs/reference/compatibility.md
 *     node src/matrix.mjs --check    exit 1 when either file differs from what the code produces now
 *
 * Rows are the page SDK: every published version and `workspace`, the package in this repository. Columns are the
 * host bootstrap of each published version. Each cell runs in its own process (`src/cell.mjs`), so a run of the
 * whole matrix is a few seconds and needs no phone, no app and no network once `pnpm install` has fetched the aliases.
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os, { availableParallelism } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import semver from 'semver';
import { COMPAT_ROOT, verdict } from './cell.mjs';
import { renderPage } from './render.mjs';
import { PACKAGE } from './versions.mjs';

export const WORKSPACE = 'workspace';
const REPO_ROOT = path.join(COMPAT_ROOT, '../..');
export const COMPAT_FILE = path.join(COMPAT_ROOT, 'compat.json');
export const PAGE_FILE = path.join(REPO_ROOT, 'docs/reference/compatibility.md');
const CHANGELOG = path.join(REPO_ROOT, 'packages/miniapp/CHANGELOG.md');
const PROVENANCE = path.join(REPO_ROOT, 'packages/repo-checks/release-provenance.json');
const REPO = 'skkuverse-miniapp';

/**
 * The scenarios of one feature of the SDK. A cell's verdict is the worst of its scenarios, and `compat.json` lists
 * one feature per row of this table.
 */
export const FEATURES = {
  detect: { scenarios: ['detect'], describe: 'The page sees the capabilities the host grants.' },
  haptic: { scenarios: ['haptic'], describe: 'haptic() reaches the host as haptic.impact.' },
  link: { scenarios: ['link'], describe: 'openUrl() reaches the host as link.open.' },
  map: { scenarios: ['map'], describe: 'openMapPlace() reaches the host as map.openPlace.' },
  miniapp: { scenarios: ['miniapp'], describe: 'openMiniapp() reaches the host as miniapp.open.' },
  share: { scenarios: ['share'], describe: 'share() reaches the host as share.open, or falls back to Web Share.' },
  ready: { scenarios: ['ready'], describe: 'ready() reaches the host as app.ready.' },
  track: { scenarios: ['track'], describe: 'track() reaches the host as analytics.track.' },
  shell: { scenarios: ['shell'], describe: 'setShell() reaches the host as shell.set.' },
  request: { scenarios: ['request'], describe: 'request() round-trips an unsupported answer as a MiniappError.' },
  viewport: { scenarios: ['viewport'], describe: 'The viewport, its change event and the CSS variables follow the host.' },
  game: { scenarios: ['game-handshake', 'game-ready-init', 'game-outbound', 'game-inbound'], describe: 'bootGame() handshakes with a game host and exchanges its messages.' },
  'game-late-host': { scenarios: ['game-late-host'], describe: 'bootGame() still handshakes when the host appears after the page gave up waiting.' },
};

const HOST_ONLY = ['host-install', 'host-reinject', 'host-origin-gate', 'host-subframe-gate', 'host-receive'];

export function installedVersions(install) {
  const names = fs.readdirSync(path.join(install, 'node_modules')).filter((n) => n.startsWith('sdk-') && n !== `sdk-${WORKSPACE}`);
  return names.map((n) => n.slice(4)).sort(semver.compare);
}

const hasGame = (page) => page === WORKSPACE || semver.gte(page, '0.4.0');

/** Every cell to run, as `[mode, page, host, build]`. */
export function plan(published) {
  const pages = [...published, WORKSPACE];
  const jobs = [];
  for (const build of ['esm', 'global']) for (const page of pages) for (const host of published) jobs.push(['mini', page, host, build]);
  for (const page of pages.filter(hasGame)) {
    for (const host of published) {
      jobs.push(['game', page, host, 'esm']);
      jobs.push(['late', page, host, 'esm']);
    }
  }
  for (const host of published) jobs.push(['honly', host, host, 'esm']);
  return jobs;
}

const cellScript = path.join(import.meta.dirname, 'cell.mjs');

function runCellProcess(install, [mode, page, host, build]) {
  return new Promise((resolve) => {
    const child = execFile(
      process.execPath,
      ['--no-warnings', cellScript, mode, page, host, build],
      { env: { ...process.env, COMPAT_INSTALL: install }, timeout: 60000, maxBuffer: 4 << 20 },
      (err, stdout, stderr) => {
        try {
          resolve(JSON.parse(stdout.trim().split('\n').pop()));
        } catch {
          resolve({ mode, page, host, build, crash: `no JSON: ${String(err?.message ?? stderr).slice(0, 200)}` });
        }
      },
    );
    // WHY: turbo runs this package's tests beside timing-sensitive browser tests, which fail when the cells take every core.
    try {
      os.setPriority(child.pid, 19);
    } catch {
      // The cell still runs at the normal priority, only slower for its neighbours.
    }
  });
}

/** Runs every cell of the matrix for the versions installed under `install`, results in plan order. */
export async function runMatrix(install) {
  const jobs = plan(installedVersions(install));
  const results = new Array(jobs.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.max(2, Math.floor(availableParallelism() / 2)) }, async () => {
      while (next < jobs.length) {
        const i = next++;
        results[i] = await runCellProcess(install, jobs[i]);
      }
    }),
  );
  return results.map(({ ms: _ms, ...rest }) => rest);
}

const nonOk = (s) => s.status !== 'ok' && s.status !== 'n/a';
const pick = (s) => ({ id: s.id, status: s.status, detail: s.detail, ...(s.observed === undefined ? {} : { observed: s.observed }) });

function readLinks() {
  const links = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'repo-links.json'), 'utf8'));
  if (!links.public.includes(REPO)) throw new Error(`repo-links.json does not list ${REPO} as public`);
  return `https://github.com/${links.owner}/${REPO}`;
}

function versionLinks(published, base) {
  const provenance = JSON.parse(fs.readFileSync(PROVENANCE, 'utf8')).filter((e) => e.name === PACKAGE);
  const out = {};
  for (const version of published) {
    const entry = provenance.find((e) => e.version === version);
    if (entry === undefined) throw new Error(`release-provenance.json has no entry for ${PACKAGE}@${version}, so the matrix cannot link its release tag`);
    out[version] = entry.reproducible
      ? { tag: entry.tag, commit: entry.commit, release: `${base}/releases/tag/${encodeURIComponent(entry.tag)}` }
      : { tag: null, reason: 'no reproducible commit' };
  }
  out[WORKSPACE] = { tag: null, reason: 'unpublished' };
  return out;
}

/** The hash of what each host version injects, for three inputs, so a version that changes the script shows. */
async function bootstrapHashes(install, published) {
  const viewport = { safeArea: { top: 47, bottom: 34, left: 0, right: 0 }, contentSafeArea: { top: 56, bottom: 0, left: 0, right: 0 }, chrome: 'glass' };
  const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 10);
  const out = {};
  for (const version of published) {
    const entry = path.join(install, 'node_modules', `sdk-${version}`, 'dist', 'protocol', 'index.js');
    const proto = await import(pathToFileURL(entry).href);
    if (typeof proto.hostBootstrapScript !== 'function') {
      out[version] = null;
      continue;
    }
    const capabilities = ['a.b', 'c.d'];
    out[version] = {
      noOrigin: hash(proto.hostBootstrapScript({ capabilities, viewport })),
      withOrigin: hash(proto.hostBootstrapScript({ capabilities, viewport, origin: 'https://wave-run.game.example' })),
      deliver: hash(proto.hostDeliverScript('https://wave-run.game.example', { event: 'game.init', data: { gameProtocol: 1, hi: 0, sound: true } })),
    };
  }
  return out;
}

/**
 * What a feature does for one page across the host versions, in the shape of a browser-compat-data support statement.
 * `version_added` is the first host of the latest run of hosts where it works. When a newer measured host does not
 * work, `version_removed` names the first such host, so an earlier range survives a later regression.
 */
export function support(statuses, hosts) {
  const measured = hosts.filter((h) => statuses[h].status !== 'n/a');
  if (measured.length === 0) return { version_added: false, notes: statuses[hosts[0]].detail, partial_implementation: false };
  const lastOk = measured.findLastIndex((h) => statuses[h].status === 'ok');
  let firstOk = lastOk;
  while (firstOk > 0 && statuses[measured[firstOk - 1]].status === 'ok') firstOk--;
  const groups = new Map();
  for (const h of measured) {
    const { status, detail } = statuses[h];
    if (status === 'ok') continue;
    const key = `${status}: ${detail}`;
    groups.set(key, [...(groups.get(key) ?? []), h]);
  }
  const notes = [...groups].map(([key, list]) => `${key} (host ${list.join(', ')})`);
  const entry = {
    version_added: lastOk < 0 ? false : measured[firstOk],
    notes: notes.length === 0 ? 'ok on every measured host' : notes.join('; '),
    partial_implementation: measured.some((h) => statuses[h].status === 'fallback'),
  };
  if (lastOk >= 0 && lastOk < measured.length - 1) entry.version_removed = measured[lastOk + 1];
  return entry;
}

/** The matrix as data, shaped like MDN browser-compat-data. `results` comes from `runMatrix`. */
export async function buildCompat(results, install) {
  const published = installedVersions(install);
  const pages = [...published, WORKSPACE];
  const crashes = results.filter((r) => r.crash !== undefined);
  if (crashes.length > 0) throw new Error(`${crashes.length} cell(s) crashed, for example ${JSON.stringify(crashes[0])}`);
  const get = (mode, page, host, build) => results.find((r) => r.mode === mode && r.page === page && r.host === host && r.build === build);
  const scenariosOf = (page, host, build, modes) => modes.flatMap((mode) => get(mode, page, host, build)?.scenarios ?? []);

  const cells = {};
  for (const build of ['esm', 'global']) {
    cells[build] = {};
    for (const page of pages) {
      cells[build][page] = {};
      for (const host of published) {
        const scenarios = ['mini', 'game'].flatMap((mode) => (get(mode, page, host, build)?.scenarios ?? []).map((s) => ({ ...s, mode })));
        const bad = scenarios.filter(nonOk).map((s) => ({ ...pick(s), mode: s.mode }));
        cells[build][page][host] = bad.length === 0 ? { verdict: verdict(scenarios) } : { verdict: verdict(scenarios), scenarios: bad };
      }
    }
  }

  const features = {};
  for (const [name, { scenarios: ids, describe }] of Object.entries(FEATURES)) {
    const entry = {};
    for (const page of pages) {
      const statuses = {};
      for (const host of published) {
        const mine = scenariosOf(page, host, 'esm', ['mini', 'game', 'late']).filter((s) => ids.includes(s.id));
        const measured = mine.filter((s) => s.status !== 'n/a');
        const worst = measured.length === 0 ? 'n/a' : verdict(measured).split(':')[0];
        const status = { ok: 'ok', fb: 'fallback', gap: 'gap', FAIL: 'broken', 'n/a': 'n/a' }[worst];
        const detail = (measured.length === 0 ? mine : measured.filter((s) => s.status === status)).map((s) => s.detail).join('; ') || 'not measured';
        statuses[host] = { status, detail };
      }
      entry[page] = support(statuses, published);
    }
    features[name] = { __compat: { description: describe, support: entry } };
  }

  const late = {};
  for (const page of pages.filter(hasGame)) {
    late[page] = Object.fromEntries(
      published.map((host) => {
        const { status, detail } = get('late', page, host, 'esm').scenarios[0];
        return [host, { status, detail }];
      }),
    );
  }

  const hashes = await bootstrapHashes(install, published);
  const hosts = {};
  for (const host of published) {
    const alone = get('honly', host, host, 'esm').scenarios;
    hosts[host] = {
      bootstrap: alone[0]?.id === 'host' ? null : Object.fromEntries(HOST_ONLY.map((id) => [id, alone.find((s) => s.id === id)?.status ?? 'n/a'])),
      script: hashes[host],
    };
  }

  const base = readLinks();
  return {
    meta: {
      package: PACKAGE,
      note: 'Generated by packages/compat. Rows are the page SDK version, columns the host bootstrap version. features.<name>.__compat.support.<page> says from which host version the feature works for that page.',
      pages,
      hosts: published,
      verdicts: { ok: 'every scenario passed', fb: 'the host does not grant it and the page degraded gracefully', gap: 'the host predates the feature', FAIL: 'the host dropped what the page sent, or the page sent nothing though granted', 'n/a': 'not computable' },
      unmeasured: Object.fromEntries(published.filter((h) => hosts[h].bootstrap === null).map((h) => [h, 'this version publishes no hostBootstrapScript, so no host can be built from it'])),
    },
    versions: versionLinks(published, base),
    cells,
    late,
    hosts,
    features,
  };
}

/** The files the generator owns, as text. */
export async function generate(install = COMPAT_ROOT) {
  const results = await runMatrix(install);
  const compat = await buildCompat(results, install);
  return { compat, json: `${JSON.stringify(compat, null, 2)}\n`, page: renderPage(compat, fs.readFileSync(CHANGELOG, 'utf8')) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const started = performance.now();
  const { json, page } = await generate(process.env.COMPAT_INSTALL ?? COMPAT_ROOT);
  const mode = process.argv[2];
  if (mode === '--write') {
    fs.writeFileSync(COMPAT_FILE, json);
    fs.writeFileSync(PAGE_FILE, page);
    console.log(`wrote ${path.relative(REPO_ROOT, COMPAT_FILE)} and ${path.relative(REPO_ROOT, PAGE_FILE)} in ${Math.round(performance.now() - started)} ms`);
  } else if (mode === '--check') {
    const stale = [
      [COMPAT_FILE, json],
      [PAGE_FILE, page],
    ].filter(([file, text]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text);
    if (stale.length > 0) {
      console.error(`Out of date: ${stale.map(([file]) => path.relative(REPO_ROOT, file)).join(', ')}. Run \`pnpm --filter compat generate\` and commit the result.`);
      process.exit(1);
    }
    console.log(`compat.json and the compatibility page match the code (${Math.round(performance.now() - started)} ms)`);
  } else if (mode === undefined) {
    process.stdout.write(json);
  } else {
    console.error('usage: node src/matrix.mjs [--write | --check]');
    process.exit(2);
  }
}
