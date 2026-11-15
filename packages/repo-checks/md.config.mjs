/**
 * What the docs generator fills in, and where. `files` lists the documents that hold generated parts, and
 * `transforms` maps a part's name to the function that writes it. Every function reads the code, the workflows or the
 * manifests that own the value, so a doc never restates one by hand. A new part is a new entry here and a pair of
 * comments in the document, and the drift check in test/docs-fresh.test.mjs covers it with no further edit.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  docBullets,
  interfaceKeys,
  interfaceMembers,
  literalUnion,
  numberConstant,
  packages,
  published,
  readJson,
  readText,
  root,
  stringArray,
  stringRecord,
} from './scripts/sources.mjs';

const MESSAGES = 'packages/miniapp/src/protocol/messages.ts';
const CONTRACT = 'packages/miniapp/src/testing/contract.ts';
const CLI_CHECK = 'packages/cli/src/check.ts';
const CLI_REPORT = 'packages/cli/src/report.ts';
const HARNESS = 'packages/game-contract/src/harness.ts';

export const files = [
  'README.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'docs/README.md',
  'docs/explanation/ci-and-branch-protection.md',
  'docs/reference/miniapp-spec.md',
  'docs/reference/protocol.md',
  'packages/cli/README.md',
  'packages/game-contract/README.md',
];

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

function word(n) {
  const text = WORDS[n];
  if (text === undefined) throw new Error(`no English word for ${n}; extend WORDS in md.config.mjs`);
  return text;
}

const capitalize = (text) => text[0].toUpperCase() + text.slice(1);
function cell(text) {
  // A backslash before a pipe would cancel the escape. No generated cell holds one, so stop if one ever does.
  if (text.includes('\\')) throw new Error(`a table cell holds a backslash, which docs-gen does not escape: ${text}`);
  return text.split('|').join('\\|');
}
const code = (text) => `\`${text}\``;

function sentenceList(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

function table(header, rows) {
  const line = (cells) => `| ${cells.join(' | ')} |`;
  return [line(header), line(header.map(() => '---')), ...rows.map((row) => line(row.map((text) => (text === '' ? '-' : cell(text)))))].join('\n');
}

function frontmatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (match === null) return {};
  return Object.fromEntries([...match[1].matchAll(/^([A-Za-z][\w-]*):\s*(.*)$/gm)].map((pair) => [pair[1], pair[2]]));
}

function leadQuote(text) {
  const match = /^> (.+)$/m.exec(text);
  return match === null ? '' : match[1];
}

/** The rows of a protocol method table, from the list the app grants and the interface that types each method. */
function methodRows(listName, interfaceName, withKind) {
  const members = new Map(interfaceMembers(MESSAGES, interfaceName).map((member) => [member.name, member]));
  const names = stringArray(MESSAGES, listName);
  if (names.join() !== [...members.keys()].join()) {
    throw new Error(`${MESSAGES}: ${listName} lists ${names.join(', ')} but ${interfaceName} types ${[...members.keys()].join(', ')}`);
  }
  return names.map((name) => {
    const member = members.get(name);
    return withKind(name, member);
  });
}

function stepNames() {
  return [...readText('scripts/check-ci.sh').matchAll(/^step ([a-z0-9-]+) /gm)].map((match) => match[1]);
}

function nodeFloor() {
  const match = /^\s+name: test \(node ([0-9.]+)\)$/m.exec(readText('.github/workflows/ci.yml'));
  if (match === null) throw new Error('.github/workflows/ci.yml has no job named "test (node <version>)"');
  return match[1];
}

function enginesPhrase(range) {
  const phrases = range.split('||').map((alternative) => {
    const [, op, major, minor, patch] = /^(>=|\^)(\d+)\.(\d+)\.(\d+)$/.exec(alternative.trim()) ?? [];
    if (op === undefined) throw new Error(`engines.node "${range}" has a range docs-gen does not know how to say`);
    const version = minor === '0' && patch === '0' ? major : `${major}.${minor}`;
    if (op === '>=') return `Node ${version} or later`;
    return minor === '0' && patch === '0' ? `Node ${version}` : `Node ${version} or later in the ${major} line`;
  });
  return phrases.length === 1 ? phrases[0] : `${phrases.slice(0, -1).join(', ')}, or ${phrases.at(-1)}`;
}

function tokenFiles() {
  return fs
    .readdirSync(path.join(root, 'packages/tokens/src'))
    .map((name) => name.replace(/\.ts$/, ''))
    .filter((name) => name !== 'index' && name !== 'css')
    .sort();
}

function minutes(ms) {
  if (ms % 60000 !== 0) throw new Error(`${ms} ms is not a whole number of minutes`);
  return word(ms / 60000);
}

const ROLES = { 5: 'repository admin role' };

function rulesetRules(ruleset) {
  const sentences = [];
  for (const rule of ruleset.rules) {
    const p = rule.parameters ?? {};
    switch (rule.type) {
      case 'deletion':
        sentences.push('No deletion');
        break;
      case 'non_fast_forward':
        sentences.push('No force push');
        break;
      case 'update':
        sentences.push('No update');
        break;
      case 'pull_request': {
        const methods = p.allowed_merge_methods.map((m) => `${m} commit`);
        sentences.push(`A pull request is required, merged with a ${sentenceList(methods)} only${p.required_review_thread_resolution ? ', with every review thread resolved' : ''}`);
        sentences.push(p.required_approving_review_count === 0 ? 'It needs no approving review' : `It needs ${p.required_approving_review_count} approving review(s)`);
        break;
      }
      case 'required_status_checks': {
        const checks = sentenceList(p.required_status_checks.map((c) => code(c.context)));
        sentences.push(`Required checks are ${checks}${p.strict_required_status_checks_policy ? ', and the branch must be up to date with `main`' : ''}`);
        break;
      }
      case 'code_scanning': {
        const levels = { errors: 'an error alert', high_or_higher: 'a security alert of high severity or worse' };
        const gates = p.code_scanning_tools.flatMap((tool) => {
          const alerts = levels[tool.alerts_threshold];
          const security = levels[tool.security_alerts_threshold];
          if (alerts === undefined || security === undefined) throw new Error(`ruleset ${ruleset.name}: threshold ${tool.alerts_threshold}/${tool.security_alerts_threshold} unknown to docs-gen`);
          return [`${tool.tool} results gate the merge: ${alerts}, or ${security}`];
        });
        sentences.push(...gates);
        break;
      }
      default:
        throw new Error(`ruleset ${ruleset.name} has a "${rule.type}" rule that docs-gen cannot describe. Teach rulesetRules in md.config.mjs.`);
    }
  }
  if (ruleset.bypass_actors.length === 0) sentences.push('Nobody bypasses it');
  for (const actor of ruleset.bypass_actors) {
    const role = ROLES[actor.actor_id];
    if (actor.actor_type !== 'RepositoryRole' || role === undefined) throw new Error(`ruleset ${ruleset.name} has a bypass actor docs-gen cannot name`);
    sentences.push(`The ${role} bypasses it`);
  }
  if (ruleset.enforcement !== 'active') sentences.unshift(`Enforcement is ${ruleset.enforcement}`);
  return `${sentences.join('. ')}`;
}

function rulesetScope(ruleset) {
  const refs = ruleset.conditions.ref_name.include;
  if (ruleset.target === 'tag') return `Tags matching ${sentenceList(refs.map(code))}`;
  return sentenceList(refs.map((ref) => code(ref.replace('refs/heads/', ''))));
}

function docsIndex(folder) {
  const dir = path.join(root, 'docs', folder);
  const names = fs.readdirSync(dir).filter((name) => name.endsWith('.md')).sort();
  const link = (name) => `[${name}](${folder}/${name})`;
  if (folder === 'decisions') {
    return table(
      ['Document', 'Status'],
      names.map((name) => [link(name), frontmatter(readText(`docs/${folder}/${name}`)).status]),
    );
  }
  const rows = names.map((name) => [link(name), leadQuote(readText(`docs/${folder}/${name}`))]);
  if (folder === 'reference' && fs.existsSync(path.join(dir, 'api/README.md'))) {
    rows.push([`[api/README.md](reference/api/README.md)`, 'The API of every package entry point, generated from the TypeScript source by TypeDoc']);
  }
  return table(['Document', 'Summary'], rows);
}

export const transforms = {
  'method-table': ({ kind }) => {
    const [list, owner] = kind === 'game' ? ['GAME_NOTIFY_METHODS', 'GameNotifyMethods'] : ['NOTIFY_METHODS', 'MiniappNotifyMethods'];
    return table(['Method', 'Params', 'Notes'], methodRows(list, owner, (name, member) => [code(name), member.params === 'none' ? 'none' : code(member.params), member.doc]));
  },

  'event-table': () => {
    const members = new Map(interfaceMembers(MESSAGES, 'GameHostEvents').map((member) => [member.name, member]));
    const events = stringArray(MESSAGES, 'GAME_EVENTS');
    if (events.join() !== [...members.keys()].join()) throw new Error(`${MESSAGES}: GAME_EVENTS and GameHostEvents disagree`);
    return table(['Event', 'Data', 'Notes'], events.map((name) => [code(name), members.get(name).params === 'none' ? 'none' : code(members.get(name).params), members.get(name).doc]));
  },

  'error-codes': () => sentenceList(literalUnion(MESSAGES, 'ErrorCode').map(code)),

  'request-methods': () => {
    const count = interfaceKeys(MESSAGES, 'RequestMethods').length;
    return count === 0 ? 'No request method exists yet' : `${capitalize(word(count))} request method${count === 1 ? '' : 's'} exist${count === 1 ? 's' : ''}`;
  },

  'haptic-count': ({ kind }) => word(literalUnion(MESSAGES, kind === 'game' ? 'GameHapticStyle' : 'HapticStyle').length),

  'contract-rules': () => docBullets(CONTRACT, 'ContractRule').map(([name, text]) => `- ${code(name)}: ${text}`).join('\n'),

  'package-table': (_args, { file }) => {
    const depth = file.split('/').length - 1;
    const prefix = '../'.repeat(depth);
    return table(['Package', 'What it is'], published().map(({ dir, manifest }) => [`[${code(manifest.name)}](${prefix}${dir})`, manifest.description]));
  },

  'package-names': () => sentenceList(published().map(({ manifest }) => code(manifest.name))),

  'package-count': ({ cap }) => (cap ? capitalize(word(published().length)) : word(published().length)),

  'typed-package-count': () => word(published().filter(({ manifest }) => (manifest.scripts?.lint ?? '').includes('attw')).length),

  'token-files': ({ form, cap }) => {
    const names = tokenFiles();
    if (form === 'count') return cap ? capitalize(word(names.length)) : word(names.length);
    return sentenceList(names.map(code));
  },

  'ci-steps': () => sentenceList(stepNames().map(code)),

  'node-floor': ({ form }) => (form === 'job' ? code(`test (node ${nodeFloor()})`) : nodeFloor()),

  'checks-version': () => {
    const match = /skkuverse\/\.github (v[0-9.]+) \(/.exec(readText('.github/workflows/checks.yml'));
    if (match === null) throw new Error('.github/workflows/checks.yml no longer says which skkuverse/.github version it copies');
    return match[1];
  },

  'rulesets-table': () => {
    const dir = path.join(root, '.github/rulesets');
    const rulesets = fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
    return table(['Ruleset', 'Applies to', 'Rules'], rulesets.map((ruleset) => [code(ruleset.name), rulesetScope(ruleset), rulesetRules(ruleset)]));
  },

  'docs-index': ({ folder }) => docsIndex(folder),

  'folder-state': ({ folder }) => {
    const dir = path.join(root, 'docs', folder);
    const count = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith('.md')).length : 0;
    return count === 0 ? 'None yet' : `${capitalize(word(count))} so far`;
  },

  'cli-commands': () => {
    const cli = path.join(root, 'packages/cli/dist/cli.js');
    if (!fs.existsSync(cli)) throw new Error('packages/cli/dist/cli.js is missing. Run `pnpm build` first.');
    const usage = execFileSync('node', [cli, '--help'], { encoding: 'utf8' });
    const rows = usage
      .split('\n')
      .map((line) => /^ {2}(\S.*?) {2,}(\S.*)$/.exec(line))
      .filter((match) => match !== null)
      .map((match) => [code(`miniapp-cli ${match[1]}`), `${capitalize(match[2]).replace(/\b(?:apps|games)\/(?:<id>)?/g, code)}.`]);
    if (rows.length === 0) throw new Error('`miniapp-cli --help` lists no command, so docs-gen cannot read it');
    return table(['Command', 'What it does'], rows);
  },

  'spec-rule-count': () => {
    const rows = [...readText('docs/reference/miniapp-spec.md').matchAll(/^\| ([A-Z]\d+) \| (checked|review) \|/gm)];
    const checked = rows.filter((row) => row[2] === 'checked').length;
    const reviewed = rows.length - checked;
    const enforced = Object.keys(Object.fromEntries(stringRecord(CLI_CHECK, 'RULE_SECTIONS'))).length;
    if (enforced !== checked) throw new Error(`the spec marks ${checked} rules checked, but RULE_SECTIONS in ${CLI_CHECK} holds ${enforced}`);
    return `The spec holds ${rows.length} rules: ${checked} are checked and ${reviewed} are for review.`;
  },

  engines: ({ package: dir }) => enginesPhrase(readJson(`packages/${dir}/package.json`).engines.node),

  'runner-rules': () => sentenceList(literalUnion(HARNESS, 'RunnerRule').map(code)),

  minutes: ({ name, form }) => {
    const ms = name === 'test-timeout' ? numberConstant('packages/game-contract/vitest.shared.ts', 'testTimeout') : numberConstant('packages/game-contract/src/cli.ts', 'SESSION_TIMEOUT_MS');
    return form === 'adjective' ? `${minutes(ms)}-minute` : `${minutes(ms)} minutes`;
  },
};

/**
 * Hand-written tables that name things the code owns. The generator cannot write their prose, so it fails when the
 * names they list differ from the code's.
 */
export const verifiers = [
  {
    file: 'packages/cli/README.md',
    check() {
      const text = readText('packages/cli/README.md');
      const section = text.split('| Field | Value |')[1];
      if (section === undefined) return ['the `check --json` field table is gone'];
      const listed = [...section.split('\n\n')[0].matchAll(/^\| `([a-z]+)` \|/gm)].map((match) => match[1]);
      const actual = interfaceKeys(CLI_REPORT, 'JsonFinding');
      return listed.join() === actual.join() ? [] : [`the field table lists ${listed.join(', ')} but JsonFinding has ${actual.join(', ')}`];
    },
  },
  {
    file: 'docs/explanation/architecture.md',
    check() {
      const text = readText('docs/explanation/architecture.md');
      const miniapp = readJson('packages/miniapp/package.json');
      const subpaths = Object.keys(miniapp.exports).filter((key) => key !== '.' && !key.endsWith('.json')).map((key) => `${miniapp.name}${key.slice(1)}`);
      const names = [...published().map(({ manifest }) => manifest.name), ...subpaths];
      const rows = text.split('\n');
      return names.filter((name) => !rows.some((row) => row.startsWith(`| \`${name}\` |`))).map((name) => `the piece table has no row for ${name}`);
    },
  },
  {
    file: '.github/workflows/ci.yml',
    check() {
      const floor = nodeFloor();
      const lowest = packages()
        .map(({ manifest }) => manifest.engines?.node)
        .filter((range) => range !== undefined)
        .flatMap((range) => range.split('||').map((alternative) => /(\d+\.\d+\.\d+)/.exec(alternative)?.[1]))
        .filter((version) => version !== undefined)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
      return lowest === floor ? [] : [`ci.yml tests on Node ${floor}, but the lowest Node a package's engines admits is ${lowest}`];
    },
  },
];
