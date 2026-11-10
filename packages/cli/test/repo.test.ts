import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { loadConfig } from '../src/config.ts';
import { scaffold, TEMPLATES_DIR } from '../src/new.ts';
import { checkRepo } from '../src/repo.ts';

const scratch = mkdtempSync(join(tmpdir(), 'miniapp-cli-repo-test-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

function write(dir: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
}

/** A repository root with the given deploy config. */
function repo(config: unknown, files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(scratch, 'root-'));
  write(root, { 'deploy.config.json': JSON.stringify(config), ...files });
  return root;
}

/**
 * What `pnpm install` and `vite build` leave in a scaffolded game: the SDK the
 * catalog installs, and the page with its module script and stylesheet
 * emitted as hashed files under assets/.
 */
function installAndBuild(dir: string): void {
  const html = readFileSync(join(dir, 'index.html'), 'utf8')
    .replace('<script type="module" src="/src/main.ts"></script>', '')
    .replace('</head>', '  <script type="module" crossorigin src="/assets/index-B2x9QfLm.js"></script>\n    <link rel="stylesheet" crossorigin href="/assets/index-Cq1pZ0aA.css">\n  </head>');
  write(dir, {
    'node_modules/@skkuverse/miniapp/package.json': JSON.stringify({ version: '0.4.0' }),
    'dist/index.html': html,
    'dist/assets/index-B2x9QfLm.js': '',
    'dist/assets/index-Cq1pZ0aA.css': '',
  });
}

describe('new', () => {
  it('scaffolds a miniapp without --kind, as before', () => {
    const root = repo({ apps: {} });
    const dir = scaffold(root, 'club');
    assert.equal(dir, join(root, 'apps', 'club'));
    assert.match(readFileSync(join(dir, 'src', 'main.tsx'), 'utf8'), /<MiniappRoot id="club"/);
  });

  it('scaffolds a game from templates/game, with the id filled in', () => {
    const root = repo({ apps: {}, games: {} });
    const dir = scaffold(root, 'ginkgo-catch', 'game');
    assert.equal(dir, join(root, 'games', 'ginkgo-catch'));
    assert.deepEqual(readdirSync(dir).sort(), ['README.md', 'index.html', 'package.json', 'src', 'tsconfig.json', 'vite.config.ts']);
    for (const file of ['package.json', 'index.html', 'README.md', 'src/main.ts']) {
      const text = readFileSync(join(dir, file), 'utf8');
      assert.ok(!text.includes('__ID__'), file);
      assert.ok(text.includes('ginkgo-catch'), file);
    }
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    assert.equal(pkg.dependencies['@skkuverse/miniapp'], 'catalog:');
    assert.equal(pkg.dependencies.react, undefined);
  });

  it('refuses an id the other kind uses (G1)', () => {
    const root = repo({ apps: {} }, { 'apps/timetable/package.json': '{}', 'games/apple/package.json': '{}' });
    assert.throws(() => scaffold(root, 'timetable', 'game'), /apps\/timetable already uses the id \(G1\)/);
    assert.throws(() => scaffold(root, 'apple'), /games\/apple already uses the id \(G1\)/);
    assert.throws(() => scaffold(root, 'apple', 'game'), /games\/apple already exists/);
  });

  it('a scaffolded game passes check once installed and built', () => {
    const root = repo({ apps: {}, games: { 'ginkgo-catch': { project: 'game-ginkgo-catch' } } });
    const dir = scaffold(root, 'ginkgo-catch', 'game');
    installAndBuild(dir);
    const [report] = checkRepo(root);
    assert.equal(report?.id, 'ginkgo-catch');
    assert.deepEqual(report.findings, []);
  });
});

describe('checkRepo', () => {
  it('checks games next to miniapps, and fails a shared id naming both folders (G1)', () => {
    const root = repo({ apps: { timetable: { project: 'miniapp-timetable' } }, games: { timetable: { project: 'game-timetable' } } });
    scaffold(root, 'timetable');
    cpSync(join(TEMPLATES_DIR, 'game'), join(root, 'games', 'timetable'), { recursive: true });
    installAndBuild(join(root, 'games', 'timetable'));
    const reports = checkRepo(root);
    assert.deepEqual(reports.map((r) => r.id), ['timetable', 'timetable']);
    const g1 = reports[1]!.findings.filter((f) => f.rule === 'G1');
    assert.equal(g1.length, 2);
    assert.match(g1[0]!.message, /games\/timetable and apps\/timetable share the id/);
    assert.ok(!reports[0]!.findings.some((f) => f.rule.startsWith('G')));
  });

  it('a named id is checked in whichever folder holds it', () => {
    const root = repo({ apps: {}, games: { apple: { project: 'game-apple' } } });
    scaffold(root, 'apple', 'game');
    installAndBuild(join(root, 'games', 'apple'));
    assert.deepEqual(checkRepo(root, { ids: ['apple'] }).map((r) => r.id), ['apple']);
    assert.throws(() => checkRepo(root, { ids: ['nope'] }), /apps\/nope or games\/nope does not exist/);
    assert.deepEqual(checkRepo(root, { kind: 'app' }), []);
  });

  it('R4: a game needs a "games" entry, and every entry needs its folder', () => {
    const root = repo({ apps: { ghost: { project: 'miniapp-ghost' } }, games: { phantom: { project: 'game-phantom' } } });
    scaffold(root, 'apple', 'game');
    installAndBuild(join(root, 'games', 'apple'));
    const byId = Object.fromEntries(checkRepo(root).map((r) => [r.id, r.findings.filter((f) => f.level === 'error').map((f) => `${f.rule} ${f.message}`)]));
    assert.deepEqual(byId, {
      apple: ['R4 not in deploy.config.json "games"'],
      ghost: ['R4 deploy.config.json lists it but apps/ghost does not exist'],
      phantom: ['R4 deploy.config.json lists it but games/phantom does not exist'],
    });
  });

  it('reads a deploy config without "games" as no games', () => {
    const root = repo({ apps: {} });
    assert.deepEqual(loadConfig(root).games, {});
  });
});
