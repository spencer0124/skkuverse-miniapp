/**
 * The release versions of `@skkuverse/miniapp` and the aliases this package installs for them.
 *
 * `compat-versions` in .github/workflows/drift.yml pipes `npm view @skkuverse/miniapp versions --json` into this file:
 *
 *     npm view @skkuverse/miniapp versions --json | node packages/compat/src/versions.mjs
 *
 * It exits 1 and lists each live release version that has no `sdk-<version>` alias in package.json. A prerelease such
 * as a `-dev` snapshot is not a release, so it never needs an alias.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import semver from 'semver';

export const PACKAGE = '@skkuverse/miniapp';
const ALIAS = /^sdk-(\d.*)$/;

/** The release versions in a list from `npm view versions --json`, oldest first. npm prints a bare string for one version. */
export function releaseVersions(listed) {
  const list = typeof listed === 'string' ? [listed] : listed;
  if (!Array.isArray(list)) throw new Error('npm view versions --json must print a JSON array of versions');
  const invalid = list.filter((v) => typeof v !== 'string' || semver.valid(v) === null);
  if (invalid.length > 0) throw new Error(`not a semver version: ${invalid.map((v) => JSON.stringify(v)).join(', ')}`);
  return list.filter((v) => semver.prerelease(v) === null).sort(semver.compare);
}

/** The versions package.json aliases, as `sdk-<version>` mapped to `npm:@skkuverse/miniapp@<version>`. The workspace alias is no version. */
export function aliasedVersions(manifest) {
  const found = [];
  for (const [name, spec] of Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })) {
    const match = ALIAS.exec(name);
    if (match === null) continue;
    if (spec !== `npm:${PACKAGE}@${match[1]}`) throw new Error(`${name} must be "npm:${PACKAGE}@${match[1]}", found ${JSON.stringify(spec)}`);
    found.push(match[1]);
  }
  return found.sort(semver.compare);
}

/** The release versions in `listed` that `manifest` has no alias for. */
export function missingAliases(listed, manifest) {
  const aliased = new Set(aliasedVersions(manifest));
  return releaseVersions(listed).filter((v) => !aliased.has(v));
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const flag = process.argv.indexOf('--package');
  const manifestPath = flag > 0 ? path.resolve(process.argv[flag + 1]) : path.join(import.meta.dirname, '../package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let missing;
  try {
    missing = missingAliases(JSON.parse(await readStdin()), manifest);
  } catch (e) {
    process.stderr.write(`compat-versions: ${e.message}\n`);
    process.exit(1);
  }
  if (missing.length > 0) {
    process.stderr.write(`compat-versions: ${PACKAGE} has released ${missing.join(', ')} with no alias in ${manifestPath}.\n`);
    process.stderr.write(`In order: run pnpm --filter repo-checks backfill-tags --write, add "sdk-<version>": "npm:${PACKAGE}@<version>" for each, run pnpm install, then pnpm --filter compat generate.\n`);
    process.exit(1);
  }
  process.stdout.write(`compat-versions: every release of ${PACKAGE} has an alias (${aliasedVersions(manifest).join(', ')}).\n`);
}
