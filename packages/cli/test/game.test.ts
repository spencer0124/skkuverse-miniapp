import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { checkApp, checkIdNamespace, type CheckTarget, type RuleId } from '../src/check.ts';
import { hostFor, type DeployConfig } from '../src/config.ts';

const scratch = mkdtempSync(join(tmpdir(), 'miniapp-cli-game-test-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

const GOOD_HTML = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <script type="module" crossorigin src="/assets/index-AbCd1234.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-EfGh5678.css">
  </head>
  <body><canvas id="game"></canvas></body>
</html>`;
const BOOTS = `import { bootGame } from '@skkuverse/miniapp/game';\nbootGame({});\n`;

function write(dir: string, files: Record<string, string | null>): void {
  for (const [path, content] of Object.entries(files)) {
    if (content === null) continue;
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
}

/** A game that passes every rule, with `files` overriding or (null) deleting paths. */
function fixture(id: string, files: Record<string, string | null> = {}): string {
  const dir = join(mkdtempSync(join(scratch, 'game-')), id);
  write(dir, {
    'package.json': JSON.stringify({
      scripts: { dev: 'vite', build: 'vite build', typecheck: 'tsc --noEmit' },
      dependencies: { '@skkuverse/miniapp': '^0.4.0' },
      devDependencies: { vite: '^6', typescript: '^5' },
    }),
    'index.html': GOOD_HTML,
    'src/main.ts': BOOTS,
    'node_modules/@skkuverse/miniapp/package.json': JSON.stringify({ version: '0.4.0' }),
    'dist/index.html': GOOD_HTML,
    'dist/assets/index-AbCd1234.js': '',
    'dist/assets/index-EfGh5678.css': '',
    ...files,
  });
  return dir;
}

const game = (id: string, files?: Record<string, string | null>, config: CheckTarget['config'] = { project: `game-${id}` }) =>
  ({ id, dir: fixture(id, files), kind: 'game', config }) satisfies CheckTarget;

function rules(target: CheckTarget, level: 'error' | 'warn' = 'error'): RuleId[] {
  return checkApp(target)
    .filter((f) => f.level === level)
    .map((f) => f.rule);
}

describe('checkApp for a game', () => {
  it('passes a conforming game', () => {
    assert.deepEqual(checkApp(game('good')), []);
  });

  it('skips the miniapp rules: no MiniappRoot, manifest, src/main.tsx or React', () => {
    // A miniapp with this tree fails S1, S2, R2 (no main.tsx is S1), O1 and M1.
    assert.deepEqual(rules(game('a')), []);
    const asApp = { ...game('a'), kind: 'app' } as const;
    assert.ok(rules(asApp).includes('S1'));
    assert.ok(rules(asApp).includes('S2'));
    assert.ok(rules(asApp).includes('O1'));
  });

  it('keeps the shared rules: R1, S3, S4, O1–O4, H1', () => {
    assert.ok(rules(game('Bad_Id')).includes('R1'));
    const noTypecheck = JSON.stringify({ scripts: { dev: 'vite', build: 'vite build' } });
    assert.deepEqual(rules(game('a', { 'package.json': noTypecheck })), ['S3']);
    assert.deepEqual(rules(game('a', { 'package.json': null })), ['S3']);
    assert.deepEqual(rules(game('a', { 'node_modules/@skkuverse/miniapp/package.json': JSON.stringify({ version: '0.2.1' }) })), ['S4']);
    assert.deepEqual(rules(game('a', { 'dist/index.html': null })), ['O1']);
    assert.deepEqual(rules(game('a', { 'dist/_redirects': '' })), ['O2']);
    assert.deepEqual(rules(game('a', { 'dist/assets/hit.wav': '' })), ['O3']);
    const inline = GOOD_HTML.replace('</head>', '<script>start()</script></head>');
    assert.deepEqual(rules(game('a', { 'dist/index.html': inline })), ['H1']);
  });

  it('R4: a game host exception is named on the game domain', () => {
    const findings = checkApp(game('a', {}, { project: 'game-a', host: 'a.example', hostReason: 'legacy' }));
    assert.deepEqual(findings.map((f) => [f.rule, f.level]), [['R4', 'warn']]);
    assert.equal(hostFor('a', { project: 'game-a' }, 'game'), 'a.game.skkuverse.com');
    assert.equal(hostFor('a', { project: 'miniapp-a' }), 'a.mini.skkuverse.com');
  });

  it('G2: posting to the bridge itself fails', () => {
    const page = `${BOOTS}window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'game.over' }));\n`;
    const findings = checkApp(game('a', { 'src/main.ts': page }));
    assert.deepEqual(findings.map((f) => f.rule), ['G2']);
    assert.match(findings[0]!.message, /^src\/main\.ts:3 /);
  });

  it('G2: reading, defining or replacing the host globals fails, in any source file', () => {
    const cases = [
      'window.skkuverse = { notify() {} };',
      'const host = globalThis.skkuverse;',
      "Object.defineProperty(window, 'skkuverse', { value: {} });",
      "const host = window['skkuverse'];",
      'window.__host?.send({});',
    ];
    for (const line of cases) {
      assert.deepEqual(rules(game('a', { 'src/game/host.ts': `${line}\n` })), ['G2'], line);
    }
  });

  it('G2: comments and the published client are fine', () => {
    const page = `${BOOTS}// never call window.ReactNativeWebView.postMessage here\n/* window.skkuverse is bootGame's */\nconst url = 'https://example.com/a'; // ok\n`;
    assert.deepEqual(checkApp(game('a', { 'src/main.ts': page })), []);
  });

  it('G2: a page that does not boot through bootGame yet is a warning', () => {
    const findings = checkApp(game('a', { 'src/main.ts': "import './style.css';\n" }));
    assert.deepEqual(findings.map((f) => [f.rule, f.level]), [['G2', 'warn']]);
  });

  it('G3: a game has no backend', () => {
    assert.deepEqual(rules(game('a', { 'functions/api/score.ts': '' })), ['G3']);
    assert.deepEqual(rules(game('a', {}, { project: 'game-a', backend: 'functions' })), ['G3']);
  });

  it('G4: a game ships no headers of its own', () => {
    assert.deepEqual(rules(game('a', { 'public/_headers': '/*\n  X: y\n' })), ['G4']);
    assert.deepEqual(rules(game('a', { '_headers': '' })), ['G4']);
  });

  it('a miniapp is never checked against the game rules', () => {
    const app = { ...game('a', { 'src/main.ts': 'window.ReactNativeWebView.postMessage("x");', 'public/_headers': '' }), kind: 'app' } as const;
    for (const rule of ['G1', 'G2', 'G3', 'G4'] as const) assert.ok(!rules(app).includes(rule), rule);
    const noKind = { id: 'a', dir: fixture('a', { 'functions/x.ts': '' }), config: { project: 'p' } };
    assert.ok(rules(noKind).includes('B1'));
    assert.ok(!rules(noKind).includes('G3'));
  });
});

describe('checkIdNamespace (G1)', () => {
  const root = mkdtempSync(join(scratch, 'repo-'));
  write(root, { 'apps/timetable/package.json': '{}', 'games/ginkgo/package.json': '{}', 'games/timetable/package.json': '{}' });
  const config: DeployConfig = { apps: { timetable: { project: 'miniapp-timetable' } }, games: { ginkgo: { project: 'game-ginkgo' } } };

  it('passes an id no miniapp uses', () => {
    assert.deepEqual(checkIdNamespace(root, 'ginkgo', join(root, 'games', 'ginkgo'), config), []);
  });

  it('fails a game whose id a miniapp folder uses, naming both folders', () => {
    const findings = checkIdNamespace(root, 'timetable', join(root, 'games', 'timetable'), { apps: {}, games: {} });
    assert.deepEqual(findings.map((f) => f.rule), ['G1']);
    assert.match(findings[0]!.message, /games\/timetable and apps\/timetable/);
  });

  it('fails a game whose id deploy.config.json lists as a miniapp', () => {
    const findings = checkIdNamespace(root, 'mukja', join(root, 'games', 'mukja'), { apps: { mukja: { project: 'miniapp-mukja' } }, games: {} });
    assert.deepEqual(findings.map((f) => f.rule), ['G1']);
  });

  it('checks an outside folder against both folders', () => {
    const outside = join(mkdtempSync(join(scratch, 'club-')), 'ginkgo');
    assert.deepEqual(checkIdNamespace(root, 'ginkgo', outside, config).map((f) => f.rule), ['G1']);
    const clash = join(mkdtempSync(join(scratch, 'club-')), 'timetable');
    assert.deepEqual(checkIdNamespace(root, 'timetable', clash, null).map((f) => f.rule), ['G1', 'G1']);
    const free = join(mkdtempSync(join(scratch, 'club-')), 'free');
    assert.deepEqual(checkIdNamespace(root, 'free', free, config), []);
  });
});
