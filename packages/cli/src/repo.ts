/**
 * `check` over the repository: every package of each kind under its folder,
 * the id namespace across the two folders (G1), and the deploy entries
 * against the folders (R4).
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { checkApp, checkIdNamespace, type Finding } from './check.ts';
import { entriesOf, entryOf, FOLDER, KINDS, loadConfig, type Kind } from './config.ts';

export interface PackageReport {
  id: string;
  /** Which folder the package is in, since an app and a game can share an id (G1). */
  kind: Kind;
  findings: Finding[];
}

export interface RepoCheckOptions {
  /** Only these ids, in whichever folders they exist. Every package when left out. */
  ids?: readonly string[];
  /** Only this kind. Both when left out. */
  kind?: Kind;
}

export function checkRepo(root: string, { ids, kind }: RepoCheckOptions = {}): PackageReport[] {
  const config = loadConfig(root);
  const kinds = kind === undefined ? KINDS : [kind];
  const out: PackageReport[] = [];
  const selected = (id: string) => ids === undefined || ids.includes(id);

  const targets: { id: string; kind: Kind }[] = [];
  if (ids === undefined) {
    for (const k of kinds) for (const id of listPackages(root, k)) targets.push({ id, kind: k });
  } else {
    for (const id of ids) {
      const found = kinds.filter((k) => existsSync(join(root, FOLDER[k], id)));
      if (found.length === 0) throw new Error(kinds.map((k) => `${FOLDER[k]}/${id}`).join(' or ') + ' does not exist');
      for (const k of found) targets.push({ id, kind: k });
    }
  }

  for (const { id, kind: k } of targets) {
    const dir = join(root, FOLDER[k], id);
    const entry = entryOf(config, k, id);
    const findings = checkApp({ id, dir, kind: k, config: entry ?? null });
    if (k === 'game') findings.push(...checkIdNamespace(root, id, dir, config));
    if (!entry) {
      findings.push({ rule: 'R4', level: 'error', message: k === 'app' ? 'not in deploy.config.json' : 'not in deploy.config.json "games"' });
    }
    out.push({ id, kind: k, findings });
  }

  for (const k of kinds) {
    for (const id of Object.keys(entriesOf(config, k)).filter(selected)) {
      if (!existsSync(join(root, FOLDER[k], id))) {
        out.push({ id, kind: k, findings: [{ rule: 'R4', level: 'error', message: `deploy.config.json lists it but ${FOLDER[k]}/${id} does not exist` }] });
      }
    }
  }
  return out;
}

/** The package folders of one kind, sorted. A kind with no folder yet has none. */
export function listPackages(root: string, kind: Kind): string[] {
  const folder = join(root, FOLDER[kind]);
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}
