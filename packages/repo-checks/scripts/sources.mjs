/**
 * Reads the facts the docs state out of the code that owns them, without running that code. A type alias such as
 * `ErrorCode` has no runtime value, so the TypeScript compiler API reads it.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export const root = path.join(import.meta.dirname, '../../..');

const programs = new Map();

function program(file, base = root) {
  const abs = path.join(base, file);
  if (!programs.has(abs)) {
    const created = ts.createProgram([abs], {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      allowImportingTsExtensions: true,
      noEmit: true,
      skipLibCheck: true,
      strict: true,
    });
    programs.set(abs, created);
  }
  const created = programs.get(abs);
  return { checker: created.getTypeChecker(), source: created.getSourceFile(abs) };
}

function find(file, name, kinds) {
  const { checker, source } = program(file);
  let found;
  source.forEachChild((node) => {
    if (kinds.includes(node.kind) && node.name?.text === name) found = node;
    if (node.kind === ts.SyntaxKind.VariableStatement) {
      for (const declaration of node.declarationList.declarations) {
        if (kinds.includes(ts.SyntaxKind.VariableDeclaration) && declaration.name.text === name) found = declaration;
      }
    }
  });
  if (found === undefined) throw new Error(`${file} declares no ${name}. A doc reads it, so rename it there too.`);
  return { node: found, checker };
}

/** The string literals of a type alias that is a union of them, in declaration order. */
export function literalUnion(file, name) {
  const { node, checker } = find(file, name, [ts.SyntaxKind.TypeAliasDeclaration]);
  const type = checker.getTypeAtLocation(node);
  const members = type.isUnion() ? type.types : [type];
  const literals = members.map((member) => (member.isStringLiteral() ? member.value : undefined));
  if (literals.some((value) => value === undefined)) throw new Error(`${file}: ${name} is not a union of string literals.`);
  return literals;
}

/** The strings of `export const NAME = [...]`. */
export function stringArray(file, name) {
  const { node } = find(file, name, [ts.SyntaxKind.VariableDeclaration]);
  const init = node.initializer;
  if (init === undefined || !ts.isArrayLiteralExpression(init)) throw new Error(`${file}: ${name} is not an array literal.`);
  return init.elements.map((element) => {
    if (!ts.isStringLiteralLike(element)) throw new Error(`${file}: ${name} holds an element that is not a string literal.`);
    return element.text;
  });
}

/** The keys and string values of `export const NAME = { KEY: 'value', ... } as const`. */
export function stringRecord(file, name) {
  const { node } = find(file, name, [ts.SyntaxKind.VariableDeclaration]);
  let init = node.initializer;
  while (init !== undefined && (ts.isAsExpression(init) || ts.isParenthesizedExpression(init))) init = init.expression;
  if (init === undefined || !ts.isObjectLiteralExpression(init)) throw new Error(`${file}: ${name} is not an object literal.`);
  return init.properties.map((property) => {
    if (!ts.isPropertyAssignment(property) || !ts.isStringLiteralLike(property.initializer)) {
      throw new Error(`${file}: ${name} holds an entry that is not a key and a string.`);
    }
    return [property.name.getText(), property.initializer.text];
  });
}

/** A numeric constant: `const NAME = 180_000`, or an object property such as `testTimeout: 120_000`. */
export function numberConstant(file, name) {
  const { source } = program(file);
  let value;
  const visit = (node) => {
    const named =
      (ts.isVariableDeclaration(node) && node.name.getText() === name) ||
      (ts.isPropertyAssignment(node) && node.name.getText() === name);
    if (named && node.initializer !== undefined && ts.isNumericLiteral(node.initializer)) value = Number(node.initializer.text.replaceAll('_', ''));
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (value === undefined) throw new Error(`${file} declares no numeric ${name}.`);
  return value;
}

function summary(node) {
  const doc = node.jsDoc?.at(-1);
  if (doc === undefined) return '';
  const text = typeof doc.comment === 'string' ? doc.comment : (doc.comment ?? []).map((part) => part.text).join('');
  return text.replace(/\s+/g, ' ').trim();
}

/** The first sentence of a doc comment, with no trailing full stop. */
function firstSentence(text) {
  const match = /^(.*?[.!?])(?:\s|$)/.exec(text);
  return (match ? match[1] : text).replace(/\.$/, '');
}

function describeParams(type, checker, node) {
  const props = type.getProperties();
  if (props.length === 0) return 'none';
  const parts = props.map((prop) => {
    const optional = (prop.flags & ts.SymbolFlags.Optional) !== 0 ? '?' : '';
    const propType = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(prop, node));
    const literals = propType.isUnion() ? propType.types : [propType];
    if (literals.every((member) => member.isStringLiteral())) {
      return `${prop.name}${optional}: ${literals.map((member) => `'${member.value}'`).join(' | ')}`;
    }
    return `${prop.name}${optional}`;
  });
  return `{ ${parts.join(', ')} }`;
}

/** Each member of an interface of `name: params` entries: its name, params text and doc summary. */
export function interfaceMembers(file, name) {
  const { node, checker } = find(file, name, [ts.SyntaxKind.InterfaceDeclaration]);
  return node.members.map((member) => ({
    name: member.name.text ?? member.name.getText().replace(/^['"]|['"]$/g, ''),
    params: describeParams(checker.getTypeAtLocation(member.type), checker, member),
    type: member.type.getText(),
    doc: firstSentence(summary(member)),
  }));
}

/** The property names of an interface, in order. */
export function interfaceKeys(file, name) {
  const { node } = find(file, name, [ts.SyntaxKind.InterfaceDeclaration]);
  return node.members.map((member) => member.name.getText());
}

/** The bullet list in a type's doc comment: `- \`name\`: description`. */
export function docBullets(file, name) {
  const { node } = find(file, name, [ts.SyntaxKind.TypeAliasDeclaration, ts.SyntaxKind.InterfaceDeclaration]);
  const doc = node.jsDoc?.at(-1);
  const raw = doc === undefined ? '' : typeof doc.comment === 'string' ? doc.comment : (doc.comment ?? []).map((p) => p.text).join('');
  return raw
    .split('\n')
    .map((line) => /^- `([^`]+)`: (.*)$/.exec(line.trim()))
    .filter((match) => match !== null)
    .map((match) => [match[1], match[2]]);
}

export function readText(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

export function readJson(file) {
  return JSON.parse(readText(file));
}

/** Every workspace package, by directory name, with its manifest. */
export function packages() {
  return fs
    .readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, 'packages', entry.name, 'package.json')))
    .map((entry) => ({ dir: `packages/${entry.name}`, manifest: readJson(`packages/${entry.name}/package.json`) }))
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}

/** The packages npm gets: every one that is not private. */
export const published = () => packages().filter(({ manifest }) => manifest.private !== true);

function parsed(file) {
  return ts.createSourceFile(file, readText(file), ts.ScriptTarget.ES2022, true);
}

function sourceFiles(spec, base) {
  if (!spec.endsWith('/')) return [spec];
  return fs
    .readdirSync(path.join(base, spec))
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .sort()
    .map((name) => `${spec}${name}`);
}

const memberName = (node) => (node.name !== undefined && (ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name)) ? node.name.text : undefined);

const isFunctionValue = (node) => node !== undefined && (ts.isArrowFunction(node) || ts.isFunctionExpression(node));

/** The top-level functions of a file: `function f` and `const f = () => ...`, with whether the file exports each and under which name. */
function topLevelFunctions(source, checker) {
  const exportedNames = new Map();
  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier === undefined && statement.exportClause !== undefined && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) exportedNames.set((element.propertyName ?? element.name).text, element.name.text);
    }
  }
  const hasExport = (node) => ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true;
  const found = new Map();
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
      found.set(statement, { name: exportedNames.get(statement.name.text) ?? statement.name.text, symbol: checker.getSymbolAtLocation(statement.name), exported: hasExport(statement) || exportedNames.has(statement.name.text) });
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !isFunctionValue(declaration.initializer)) continue;
        found.set(declaration, { name: exportedNames.get(declaration.name.text) ?? declaration.name.text, symbol: checker.getSymbolAtLocation(declaration.name), exported: hasExport(statement) || exportedNames.has(declaration.name.text) });
      }
    }
  }
  return found;
}

/** The top-level functions each top-level function calls, resolved by symbol so a local of the same name is not mistaken for one. */
function callGraph(tops, checker) {
  const bySymbol = new Map([...tops].map(([node, top]) => [top.symbol, node]));
  const edges = new Map();
  for (const node of tops.keys()) {
    const callees = new Set();
    const visit = (child) => {
      if (ts.isCallExpression(child) && ts.isIdentifier(child.expression)) {
        const target = bySymbol.get(checker.getSymbolAtLocation(child.expression));
        if (target !== undefined) callees.add(target);
      }
      ts.forEachChild(child, visit);
    };
    visit(node);
    edges.set(node, callees);
  }
  return edges;
}

/** Where a call sits: an object method of a typed object, or the top-level function around it. `undefined` when docs-gen has no name for it. */
function enclosingFunction(node, tops, checker) {
  for (let up = node.parent; up !== undefined; up = up.parent) {
    const isMethod = ts.isMethodDeclaration(up) && ts.isObjectLiteralExpression(up.parent);
    const isProperty = ts.isPropertyAssignment(up) && ts.isObjectLiteralExpression(up.parent) && isFunctionValue(up.initializer);
    if (isMethod || isProperty) {
      const type = checker.getContextualType(up.parent);
      const owner = type?.aliasSymbol?.name ?? type?.getSymbol()?.name;
      return owner === undefined || owner.startsWith('__') ? undefined : { member: `${owner}.${memberName(up)}()` };
    }
    if (tops.has(up)) return { top: up };
  }
  return undefined;
}

/**
 * The page-side functions that send each wire method: every `notify('<method>', ...)` call in the files, named by the
 * exported function it sits in, by the exported functions that reach it through private helpers, or `Type.method()` for
 * an object method. A `notify` in a place docs-gen cannot name is an error. `spec` is a file, or a
 * folder ending in a slash for every `.ts` file in it.
 */
export function methodSenders(spec, base = root) {
  const found = new Map();
  for (const file of sourceFiles(spec, base)) {
    const { source, checker } = program(file, base);
    const tops = topLevelFunctions(source, checker);
    const edges = callGraph(tops, checker);
    const reaches = (from, target) => {
      const seen = new Set();
      const walk = (node) => {
        if (node === target) return true;
        if (seen.has(node)) return false;
        seen.add(node);
        return [...edges.get(node)].some((callee) => !tops.get(callee).exported && walk(callee));
      };
      return walk(from);
    };
    const visit = (node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'notify' && node.arguments[0] !== undefined && ts.isStringLiteralLike(node.arguments[0])) {
        const where = enclosingFunction(node, tops, checker);
        const names = [];
        if (where?.member !== undefined) names.push(where.member);
        if (where?.top !== undefined) {
          for (const [candidate, top] of tops) if (top.exported && reaches(candidate, where.top)) names.push(`${top.name}()`);
        }
        const method = node.arguments[0].text;
        if (names.length === 0) {
          throw new Error(`notify('${method}', ...) in ${file} sits in a function docs-gen cannot name. Move the call into an exported function, a private function an exported one calls, or a method of a typed object.`);
        }
        found.set(method, [...new Set([...(found.get(method) ?? []), ...names])]);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return found;
}

/** The handler each host event reaches: a `case '<event>':` or an `if (... === '<event>')` that calls `handlers.<name>`. */
export function eventHandlers(file) {
  const found = new Map();
  const calls = (node) => {
    const names = [];
    const visit = (child) => {
      if (ts.isPropertyAccessExpression(child) && ts.isIdentifier(child.expression) && child.expression.text === 'handlers' && child.name.text.startsWith('on')) names.push(child.name.text);
      ts.forEachChild(child, visit);
    };
    visit(node);
    return names;
  };
  const add = (event, node) => found.set(event, [...new Set([...(found.get(event) ?? []), ...calls(node)])]);
  const visit = (node) => {
    if (ts.isCaseClause(node) && ts.isStringLiteralLike(node.expression)) add(node.expression.text, node);
    if (ts.isIfStatement(node) && ts.isBinaryExpression(node.expression) && node.expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken && ts.isStringLiteralLike(node.expression.right)) add(node.expression.right.text, node.thenStatement);
    ts.forEachChild(node, visit);
  };
  visit(parsed(file));
  return found;
}
