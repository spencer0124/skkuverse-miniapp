/**
 * Holds the spec, the checker and the tests to one set of rules. The spec
 * (`docs/reference/miniapp-spec.md`) says which rules `check` enforces and
 * under which heading each is defined. The checker raises them, `RULE_SECTIONS`
 * links each to its heading, and a test asserts each. When one side gains,
 * loses or moves a rule without the others, this file fails and names the rule.
 *
 * The checks read names, not behavior. A rule is raised when its ID is a string
 * literal in `src`, and asserted when its ID is a literal in a positive
 * `assert` call in `test`. Whether the assertion can fail is for the case
 * itself, and the spec's For column is parsed and compared with nothing.
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

const RULES_COLUMNS = ['Rule', 'Kind', 'For', 'Requirement'];
const RULES_HEADER = `| ${RULES_COLUMNS.join(' | ')} |`;
const RULE_ROW = /^\|\s*(?<id>[A-Z]\d+)\s*\|\s*(?<kind>checked|review)\s*\|\s*(?:app|game|both)\s*\|/;
const cellsOf = (line: string) => line.replace(/^\||\|\s*$/g, '').split('|').map((cell) => cell.trim());

/** GitHub's anchor for a heading: lowercase, anything but letters, digits, `_`, `-` and spaces dropped, spaces to hyphens. */
function anchorOf(heading: string): string {
  return heading.trim().toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replaceAll(' ', '-');
}

/**
 * Every row of every `| Rule | Kind | For | Requirement |` table, whether or
 * not a formatter aligned its columns, with the anchor of the heading above it,
 * and the anchor of every heading. A table headed Rule with other columns, and
 * a row that does not read as a rule, are errors, never skipped.
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
    if (line.startsWith('|') && cellsOf(line)[0] === 'Rule') {
      if (cellsOf(line).join(' | ') !== RULES_COLUMNS.join(' | ')) throw new Error(`a table headed Rule has columns other than ${RULES_HEADER}: ${line}`);
      inTable = true;
      continue;
    }
    if (!line.startsWith('|')) inTable = false;
    if (!inTable || /^\|[\s:|-]+$/.test(line)) continue;
    const row = RULE_ROW.exec(line);
    if (row === null) throw new Error(`a rules table row does not match ${RULE_ROW}: ${line}`);
    const { id, kind } = row.groups as { id: string; kind: SpecRule['kind'] };
    if (rules.some((rule) => rule.id === id)) throw new Error(`the spec defines ${id} twice`);
    rules.push({ id, kind, anchor });
  }
  return { rules, anchors };
}

/** The method of an `assert` call, '' for `assert(...)` itself, or undefined when the callee is not `assert`. */
function assertMethod(callee: ts.Expression): string | undefined {
  if (ts.isIdentifier(callee) && callee.text === 'assert') return '';
  if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.expression.text === 'assert') return callee.name.text;
  return undefined;
}

/** `it.skip(...)`, `describe.todo(...)` and the like, whose body the runner does not run. */
function isSkipped(callee: ts.Expression): boolean {
  return (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    ['it', 'test', 'describe', 'suite'].includes(callee.expression.text) &&
    ['skip', 'todo'].includes(callee.name.text)
  );
}

/**
 * Every string literal in the source, apart from the ones that only name a
 * type. Comments hold none. With `inAssertion`, only those inside a call of
 * `assert` or one of its methods, and not under a `!` or inside `notEqual`,
 * `doesNotMatch` and the like, because a test that a rule is absent does not
 * show that it fires, and not inside a skipped or todo case.
 */
function stringLiterals(source: string, inAssertion = false): Set<string> {
  const found = new Set<string>();
  const visit = (node: ts.Node, asserting: boolean, negated: boolean): void => {
    if (inAssertion && ts.isCallExpression(node) && isSkipped(node.expression)) return;
    const method = ts.isCallExpression(node) ? assertMethod(node.expression) : undefined;
    const within = asserting || method !== undefined;
    const not =
      negated ||
      (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) ||
      (method !== undefined && /^(?:not|doesNot)/.test(method));
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !ts.isLiteralTypeNode(node.parent) && (!inAssertion || (within && !not))) {
      found.add(node.text);
    }
    ts.forEachChild(node, (child) => visit(child, within, not));
  };
  visit(ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true), false, false);
  return found;
}

function literalsIn(dir: string, keep: (name: string) => boolean, inAssertion = false): Set<string> {
  const found = new Set<string>();
  for (const name of readdirSync(dir).filter(keep)) {
    for (const literal of stringLiterals(readFileSync(join(dir, name), 'utf8'), inAssertion)) found.add(literal);
  }
  return found;
}

const defined = Object.keys(RULE_SECTIONS);

/** The rules the spec marks checked and the checker does not define, and the reverse. */
function disagreements(spec: string, definedRules: readonly string[]) {
  const markedChecked = parseSpec(spec).rules.filter((rule) => rule.kind === 'checked').map((rule) => rule.id);
  return {
    markedCheckedButNotDefined: markedChecked.filter((id) => !definedRules.includes(id)).sort(),
    definedButNotMarkedChecked: definedRules.filter((id) => !markedChecked.includes(id)).sort(),
  };
}

const specText = readFileSync(SPEC_FILE, 'utf8');
const { rules: specRules, anchors } = parseSpec(specText);
const checked = specRules.filter((rule) => rule.kind === 'checked');
const raised = literalsIn(join(CLI_DIR, 'src'), (name) => name.endsWith('.ts'));
const asserted = literalsIn(join(CLI_DIR, 'test'), (name) => name.endsWith('.test.ts') && name !== 'spec-coverage.test.ts', true);

describe('spec coverage', () => {
  it('the rules the spec marks checked are the rules the checker defines', () => {
    assert.deepEqual(disagreements(specText, defined), { markedCheckedButNotDefined: [], definedButNotMarkedChecked: [] });
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

  describe('the checks above catch, in a small spec of their own', () => {
    const table = (...rows: string[]) => ['', RULES_HEADER, '| --- | --- | --- | --- |', ...rows, ''].join('\n');
    const small = ['## Identity', table('| R1 | checked | both | The id matches |', '| N1 | review | app | A page leaves only through the SDK |'), '## Backend', table('| B1 | checked | app | First-party only |')].join('\n');
    const healthy = { markedCheckedButNotDefined: [], definedButNotMarkedChecked: [] };

    it('a spec that agrees with the checker', () => {
      assert.deepEqual(disagreements(small, ['R1', 'B1']), healthy);
    });

    it('a rule row the spec lost', () => {
      const without = small.replace('| B1 | checked | app | First-party only |\n', '');
      assert.deepEqual(disagreements(without, ['R1', 'B1']), { ...healthy, definedButNotMarkedChecked: ['B1'] });
    });

    it('a review rule the spec marked checked', () => {
      const promoted = small.replace('| N1 | review |', '| N1 | checked |');
      assert.deepEqual(disagreements(promoted, ['R1', 'B1']), { ...healthy, markedCheckedButNotDefined: ['N1'] });
    });

    it('a rule that moved to another heading', () => {
      const anchorOfB1 = (spec: string) => parseSpec(spec).rules.find((rule) => rule.id === 'B1')?.anchor;
      assert.equal(anchorOfB1(small), 'backend');
      assert.equal(anchorOfB1(small.replace('## Backend', '## Servers')), 'servers');
    });

    it('a rule in a table that a formatter aligned', () => {
      const aligned = [
        '## Storage',
        '',
        '| Rule | Kind    | For  | Requirement                                   |',
        '| ---- | ------- | ---- | --------------------------------------------- |',
        '| T1   | checked | both | A package keeps no more than 5 MiB in storage |',
        '',
      ].join('\n');
      assert.deepEqual(parseSpec(aligned).rules, [{ id: 'T1', kind: 'checked', anchor: 'storage' }]);
    });

    it('a rules table whose columns are not the four the test reads', () => {
      const renamed = small.replace('| Rule | Kind | For | Requirement |', '| Rule | Kind | Applies | Requirement |');
      assert.throws(() => parseSpec(renamed), /Rule \| Kind \| Applies/);
    });

    it('a row that is not a rule, and a rule defined twice', () => {
      assert.throws(() => parseSpec(small.replace('| B1 | checked | app |', '| B1 | checked | apps |')), /B1/);
      assert.throws(() => parseSpec(small + table('| R1 | checked | both | Again |')), /R1 twice/);
    });

    it('an assertion that was deleted, or that only a comment, a type, a bare list or a negation mentions', () => {
      const source = [
        "import assert from 'node:assert/strict';",
        "// 'O3' is not asserted here",
        "type Wanted = 'O2';",
        "const documented = ['G4'];",
        "assert.ok(!rules(target).includes('G3'));",
        "assert.notEqual(rules(target).length, 'G5');",
        "assert.deepEqual(rules(target), ['O1']);",
      ].join('\n');
      assert.deepEqual([...stringLiterals(source)].sort(), ['G3', 'G4', 'G5', 'O1', 'node:assert/strict']);
      assert.deepEqual([...stringLiterals(source, true)], ['O1']);
    });

    it('an assertion in a case that is skipped or marked todo', () => {
      const source = [
        "it.skip('G1: x', () => { assert.deepEqual(rules(a), ['G1']); });",
        "describe.todo('G2: x', () => { assert.deepEqual(rules(a), ['G2']); });",
        "it('G3: x', () => { assert.deepEqual(rules(a), ['G3']); });",
      ].join('\n');
      assert.deepEqual([...stringLiterals(source, true)], ['G3']);
    });
  });
});
