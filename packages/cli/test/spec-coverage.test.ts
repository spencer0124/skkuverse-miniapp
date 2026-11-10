/**
 * Holds the spec, the checker and the tests to one set of rules. The spec
 * (`docs/reference/miniapp-spec.md`) says which rules `check` enforces and
 * under which heading each is defined. The checker raises them, `RULE_SECTIONS`
 * links each to its heading, and a test asserts each. When one side gains,
 * loses or moves a rule without the others, this file fails and names the rule.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import ts from 'typescript';
import { RULE_SECTIONS } from '../src/check.ts';

const CLI_DIR = resolve(import.meta.dirname, '..');
const SPEC_FILE = resolve(CLI_DIR, '..', '..', 'docs', 'reference', 'miniapp-spec.md');

interface SpecRule {
  id: string;
  kind: 'checked' | 'review';
  /** The anchor of the heading the rule's table sits under. */
  anchor: string;
}

const RULES_HEADER = '| Rule | Kind | For | Requirement |';
const RULE_ROW = /^\| (?<id>[A-Z]\d+) \| (?<kind>checked|review) \| (?:app|game|both) \|/;

/** GitHub's anchor for a heading: lowercase, anything but letters, digits, `_`, `-` and spaces dropped, spaces to hyphens. */
function anchorOf(heading: string): string {
  return heading.trim().toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replaceAll(' ', '-');
}

/**
 * Every row of every `| Rule | Kind | For | Requirement |` table, with the
 * anchor of the heading above it, and the anchor of every heading. A row that
 * does not read as a rule is an error, never skipped.
 */
function parseSpec(markdown: string): { rules: SpecRule[]; anchors: string[] } {
  const rules: SpecRule[] = [];
  const anchors: string[] = [];
  let anchor = '';
  let inTable = false;
  let fenced = false;
  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const heading = /^#{1,6} (.+)$/.exec(line);
    if (heading !== null) {
      anchor = anchorOf(heading[1]!);
      anchors.push(anchor);
    }
    if (line === RULES_HEADER) {
      inTable = true;
      continue;
    }
    if (!line.startsWith('|')) inTable = false;
    if (!inTable || line.startsWith('| ---')) continue;
    const row = RULE_ROW.exec(line);
    if (row === null) throw new Error(`a rules table row does not match ${RULE_ROW}: ${line}`);
    const { id, kind } = row.groups as { id: string; kind: SpecRule['kind'] };
    if (rules.some((rule) => rule.id === id)) throw new Error(`the spec defines ${id} twice`);
    rules.push({ id, kind, anchor });
  }
  return { rules, anchors };
}

/** Every string literal in the source, apart from the ones that only name a type. Comments hold none. */
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

function literalsIn(dir: string, keep: (name: string) => boolean): Set<string> {
  const found = new Set<string>();
  for (const name of readdirSync(dir).filter(keep)) {
    for (const literal of stringLiterals(readFileSync(join(dir, name), 'utf8'))) found.add(literal);
  }
  return found;
}

const defined = Object.keys(RULE_SECTIONS);

/** The rules on one side of the spec and the checker and not the other. */
function disagreements(spec: string) {
  const markedChecked = parseSpec(spec).rules.filter((rule) => rule.kind === 'checked').map((rule) => rule.id);
  return {
    markedCheckedButNotDefined: markedChecked.filter((id) => !defined.includes(id)).sort(),
    definedButNotMarkedChecked: defined.filter((id) => !markedChecked.includes(id)).sort(),
  };
}

const specText = readFileSync(SPEC_FILE, 'utf8');
const { rules: specRules, anchors } = parseSpec(specText);
const checked = specRules.filter((rule) => rule.kind === 'checked');
const raised = literalsIn(join(CLI_DIR, 'src'), (name) => name.endsWith('.ts'));
const asserted = literalsIn(join(CLI_DIR, 'test'), (name) => name.endsWith('.test.ts') && name !== 'spec-coverage.test.ts');

describe('spec coverage', () => {
  it('the rules the spec marks checked are the rules the checker defines', () => {
    assert.deepEqual(disagreements(specText), { markedCheckedButNotDefined: [], definedButNotMarkedChecked: [] });
  });

  it('no two headings of the spec share an anchor', () => {
    assert.deepEqual(anchors.filter((anchor, at) => anchors.indexOf(anchor) !== at), []);
  });

  describe(`each of the ${checked.length} checked rules`, () => {
    for (const { id, anchor } of checked) {
      it(`${id} is raised by the checker, asserted by a test, and linked to its heading`, () => {
        assert.ok(raised.has(id), `${id}: no source file under packages/cli/src raises it`);
        assert.ok(asserted.has(id), `${id}: no test under packages/cli/test names it in an assertion`);
        assert.equal(RULE_SECTIONS[id as keyof typeof RULE_SECTIONS], anchor, `${id}: RULE_SECTIONS does not name the heading the spec defines it under`);
      });
    }
  });

  describe('the checks above catch', () => {
    it('a rule row the spec lost', () => {
      const without = specText.split('\n').filter((line) => !line.startsWith('| O4 |')).join('\n');
      assert.deepEqual(disagreements(without), { markedCheckedButNotDefined: [], definedButNotMarkedChecked: ['O4'] });
    });

    it('a review rule the spec marked checked', () => {
      const promoted = specText.replace('| N1 | review |', '| N1 | checked |');
      assert.deepEqual(disagreements(promoted), { markedCheckedButNotDefined: ['N1'], definedButNotMarkedChecked: [] });
    });

    it('a rule that moved to another heading', () => {
      const moved = specText.replace('## Backend', '## Servers');
      const rule = parseSpec(moved).rules.find((r) => r.id === 'B1');
      assert.notEqual(rule?.anchor, RULE_SECTIONS.B1);
    });

    it('an assertion that was deleted, or that only a comment or a type mentions', () => {
      const source = [
        "import assert from 'node:assert/strict';",
        "// 'O3' is not asserted here",
        "type Wanted = 'O2';",
        "assert.deepEqual(rules(target), ['O1']);",
      ].join('\n');
      assert.deepEqual([...stringLiterals(source)].sort(), ['O1', 'node:assert/strict']);
    });
  });
});
