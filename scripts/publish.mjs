#!/usr/bin/env node
// Publish every package whose version is not on npm yet, in dependency order.
//
// Changesets would run `pnpm publish`, but npm trusted publishing is an npm CLI
// feature: the CLI trades the workflow's OIDC token for a one-time publish
// credential. So each package is packed by pnpm, which rewrites `workspace:`
// ranges to real versions, and the tarball is published by npm. Provenance is
// attached automatically under trusted publishing.
//
// The "New tag:" lines are what changesets/action reads to know what shipped.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const packagesDir = join(root, 'packages');

const packages = readdirSync(packagesDir)
  .map((dir) => ({ dir: join(packagesDir, dir), json: JSON.parse(readFileSync(join(packagesDir, dir, 'package.json'), 'utf8')) }))
  .filter((p) => !p.json.private);

const names = new Set(packages.map((p) => p.json.name));
const internalDeps = (p) =>
  Object.keys({ ...p.json.dependencies, ...p.json.peerDependencies }).filter((n) => names.has(n) && n !== p.json.name);

const ordered = [];
const visiting = new Set();
function visit(p) {
  if (ordered.includes(p)) return;
  if (visiting.has(p)) throw new Error(`dependency cycle at ${p.json.name}`);
  visiting.add(p);
  for (const dep of internalDeps(p)) visit(packages.find((q) => q.json.name === dep));
  visiting.delete(p);
  ordered.push(p);
}
packages.forEach(visit);

function isPublished(name, version) {
  try {
    return execFileSync('npm', ['view', `${name}@${version}`, 'version'], { encoding: 'utf8' }).trim() === version;
  } catch {
    return false;
  }
}

const out = mkdtempSync(join(tmpdir(), 'skkuverse-publish-'));
let failed = false;
for (const { dir, json } of ordered) {
  const { name, version } = json;
  if (isPublished(name, version)) {
    console.log(`skip ${name}@${version}: already on npm`);
    continue;
  }
  try {
    execFileSync('pnpm', ['pack', '--pack-destination', out], { cwd: dir, stdio: 'inherit' });
    const tarball = join(out, `${name.replace('@', '').replace('/', '-')}-${version}.tgz`);
    // verbose: when trusted publishing is refused, npm says why only at this level.
    execFileSync('npm', ['publish', tarball, '--access', 'public', '--loglevel', 'verbose'], { stdio: 'inherit' });
    console.log(`New tag: ${name}@${version}`);
  } catch (error) {
    console.error(`failed to publish ${name}@${version}`);
    failed = true;
    break;
  }
}
process.exit(failed ? 1 : 0);
