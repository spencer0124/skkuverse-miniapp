import { RULE_SECTIONS, type Finding, type RuleId } from './check.ts';
import type { PackageReport } from './repo.ts';

/** The spec, as a path from the root of this repository. */
const SPEC_FILE = 'docs/reference/miniapp-spec.md';

/** Prints one miniapp's findings. True when nothing is an error. */
export function report(id: string, findings: Finding[]): boolean {
  const errors = findings.filter((f) => f.level === 'error');
  for (const f of findings) {
    console.log(`${f.level === 'error' ? '✗' : '!'} ${id} ${f.rule} ${f.message}`);
  }
  if (errors.length === 0) console.log(`✓ ${id}`);
  return errors.length === 0;
}

/** One finding as `check --json` prints it. */
export interface JsonFinding {
  /** The package the finding is about. */
  id: string;
  /** Whether it is the miniapp under apps/ or the game under games/, which can share an id (G1). */
  kind: PackageReport['kind'];
  rule: RuleId;
  level: Finding['level'];
  message: string;
  /** The spec heading that defines the rule: the spec's path in this repository, then an anchor. */
  spec: string;
}

export function toJson({ id, kind, findings }: PackageReport): JsonFinding[] {
  return findings.map(({ rule, level, message }) => ({ id, kind, rule, level, message, spec: `${SPEC_FILE}#${RULE_SECTIONS[rule]}` }));
}

/**
 * Prints the findings of every package as one JSON array and nothing else, a
 * finding to a line. True when nothing is an error.
 */
export function reportJson(reports: PackageReport[]): boolean {
  const found = reports.flatMap(toJson);
  console.log(found.length === 0 ? '[]' : `[\n${found.map((f) => `  ${JSON.stringify(f)}`).join(',\n')}\n]`);
  return reports.every(({ findings }) => findings.every((f) => f.level !== 'error'));
}
