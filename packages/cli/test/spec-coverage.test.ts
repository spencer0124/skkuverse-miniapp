/**
 * Holds the spec, the checker and the tests to one set of rules. The spec
 * (`docs/reference/miniapp-spec.md`) says which rules `check` enforces, the
 * checker raises them, and a test asserts each. When one side gains or loses a
 * rule without the others, this file fails and names the rule.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import ts from 'typescript';

const CLI_DIR = resolve(import.meta.dirname, '..');
const SPEC_FILE = resolve(CLI_DIR, '..', '..', 'docs', 'reference', 'miniapp-spec.md');

interface SpecRule {
  id: string;
  kind: 'checked' | 'review';
}

const RULES_HEADER = '| Rule | Kind | For | Requirement |';
const RULE_ROW = /^\| (?<id>[A-Z]\d+) \| (?<kind>checked|review) \| (?:app|game|both) \|/;

/** Every row of every `| Rule | Kind | For | Requirement |` table. A row that does not read as a rule is an error, never skipped. */
function parseSpec(markdown: string): SpecRule[] {
  const rules: SpecRule[] = [];
  let inTable = false;
  let fenced = false;
  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    if (line === RULES_HEADER) {
      inTable = true;
      continue;
    }
    if (!line.startsWith('|')) inTable = false;
    if (!inTable || line.startsWith('| ---')) continue;
    const row = RULE_ROW.exec(line);
    if (row === null) throw new Error(`a rules table row does not match ${RULE_ROW}: ${line}`);
    const { id, kind } = row.groups as unknown as SpecRule;
    if (rules.some((rule) => rule.id === id)) throw new Error(`the spec defines ${id} twice`);
    rules.push({ id, kind });
  }
  return rules;
}

/** Every string literal in the source, apart from the ones that only name a type. */
function stringLiterals(source: string): Set<string> {
  const found = new Set<string>();
  const visit = (node: ts.Node): void => {
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !ts.isLiteralTypeNode(node.parent)) {
      found.add(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true));
  return found;
}

/** The members of the `RuleId` union in the checker's source. */
function definedRules(checkSource: string): Set<string> {
  const found = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === 'RuleId') {
      const collect = (type: ts.Node): void => {
        if (ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) found.add(type.literal.text);
        ts.forEachChild(type, collect);
      };
      collect(node.type);
    }
    ts.forEachChild(node, visit);
  };
  visit(ts.createSourceFile('check.ts', checkSource, ts.ScriptTarget.Latest, true));
  return found;
}

function sourcesIn(dir: string, keep: (name: string) => boolean): Record<string, string> {
  return Object.fromEntries(
    readdirSync(dir)
      .filter(keep)
      .map((name) => [name, readFileSync(join(dir, name), 'utf8')]),
  );
}

const sorted = (set: Iterable<string>) => [...set].sort();

const spec = parseSpec(readFileSync(SPEC_FILE, 'utf8'));
const checked = spec.filter((rule) => rule.kind === 'checked').map((rule) => rule.id);
const defined = definedRules(readFileSync(join(CLI_DIR, 'src', 'check.ts'), 'utf8'));
const raised = new Set(
  Object.values(sourcesIn(join(CLI_DIR, 'src'), (name) => name.endsWith('.ts'))).flatMap((source) => [...stringLiterals(source)]),
);
const asserted = new Set(
  Object.values(sourcesIn(join(CLI_DIR, 'test'), (name) => name.endsWith('.test.ts') && name !== 'spec-coverage.test.ts')).flatMap(
    (source) => [...stringLiterals(source)],
  ),
);

describe('spec coverage', () => {
  it('the rules the spec marks checked are the rules the checker defines', () => {
    assert.deepEqual(sorted(defined), sorted(checked));
  });

  describe(`each of the ${checked.length} checked rules`, () => {
    for (const id of checked) {
      it(`${id} is raised by the checker and asserted by a test`, () => {
        assert.ok(raised.has(id), `${id}: no source file under packages/cli/src raises it`);
        assert.ok(asserted.has(id), `${id}: no test under packages/cli/test names it in an assertion`);
      });
    }
  });
});
