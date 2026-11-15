/**
 * The spec rules this runner judges, each with the heading of
 * `docs/reference/miniapp-spec.md` that defines it, in the shape of the CLI's
 * `RULE_SECTIONS`.
 */
export const CONTRACT_RULES = {
  N1: 'page',
  N2: 'page',
  N3: 'page',
  N4: 'backend',
} as const;

export type ContractRule = keyof typeof CONTRACT_RULES;

export interface Finding {
  rule: ContractRule;
  level: 'error' | 'warn';
  message: string;
}

/** The spec, as a path from the root of this repository. */
const SPEC_FILE = 'docs/reference/miniapp-spec.md';

/** One finding as `--json` prints it: the fields of `miniapp-cli check --json`. */
export interface JsonFinding {
  id: string;
  kind: 'app';
  rule: ContractRule;
  level: Finding['level'];
  message: string;
  spec: string;
}

export function toJson(id: string, { rule, level, message }: Finding): JsonFinding {
  return { id, kind: 'app', rule, level, message, spec: `${SPEC_FILE}#${CONTRACT_RULES[rule]}` };
}
