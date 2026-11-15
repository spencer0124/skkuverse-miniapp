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

const SPEC_FILE = 'docs/reference/miniapp-spec.md';

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
