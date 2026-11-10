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
  rule: RuleId;
  level: Finding['level'];
  message: string;
  /** The spec heading that defines the rule: the spec's path in this repository, then an anchor. */
  spec: string;
}

export function toJson(id: string, findings: Finding[]): JsonFinding[] {
  return findings.map(({ rule, level, message }) => ({ id, rule, level, message, spec: `${SPEC_FILE}#${RULE_SECTIONS[rule]}` }));
}

/** Prints the findings of every package as one JSON array and nothing else. True when nothing is an error. */
export function reportJson(reports: PackageReport[]): boolean {
  console.log(JSON.stringify(reports.flatMap(({ id, findings }) => toJson(id, findings)), null, 2));
  return reports.every(({ findings }) => findings.every((f) => f.level !== 'error'));
}
