/**
 * Reads the facts the docs state out of the code that owns them, without running that code. A type alias such as
 * `ErrorCode` has no runtime value, so the TypeScript compiler API reads it.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export const root = path.join(import.meta.dirname, '../../..');

const programs = new Map();

function program(file) {
  const abs = path.join(root, file);
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
