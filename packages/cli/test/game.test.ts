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

  it('G2: a page that does not boot through bootGame fails', () => {
    const findings = checkApp(game('a', { 'src/main.ts': "import './style.css';\n" }));
    assert.deepEqual(findings.map((f) => [f.rule, f.level]), [['G2', 'error']]);
  });

  it('G2: a game with no src/ fails', () => {
    const findings = checkApp(game('a', { 'src/main.ts': null }));
    assert.deepEqual(findings.map((f) => [f.rule, f.level]), [['G2', 'error']]);
  });

  it('G2: naming the client without calling the bootGame it exports fails', () => {
    const cases = [
      "const sdk = '@skkuverse/miniapp/game';\n",
      "import { bootGame } from '@skkuverse/miniapp/game';\n",
      "import type { GamePhase } from '@skkuverse/miniapp/game';\nbootGame({});\n",
      "import { type bootGame } from '@skkuverse/miniapp/game';\nbootGame({});\n",
      "import { bootGame as boot } from '@skkuverse/miniapp/game';\nbootGame({});\n",
    ];
    for (const page of cases) {
      assert.deepEqual(rules(game('a', { 'src/main.ts': page })), ['G2'], page);
    }
  });

  it('G2: bootGame called under the name it was imported by boots', () => {
    const cases = [
      "import { bootGame as boot, type GamePhase } from '@skkuverse/miniapp/game';\nconst game = boot({});\n",
      "import * as sdk from '@skkuverse/miniapp/game';\nsdk.bootGame({});\n",
      'import {\n  bootGame,\n  type GameRect,\n} from "@skkuverse/miniapp/game";\nexport const game = bootGame ({\n});\n',
    ];
    for (const page of cases) {
      assert.deepEqual(checkApp(game('a', { 'src/main.ts': page })), [], page);
    }
  });

  it('G3: a game has no backend', () => {
    assert.deepEqual(rules(game('a', { 'functions/api/score.ts': '' })), ['G3']);
    assert.deepEqual(rules(game('a', {}, { project: 'game-a', backend: 'functions' })), ['G3']);
  });

  it('G4: a game ships no headers of its own', () => {
    assert.deepEqual(rules(game('a', { 'public/_headers': '/*\n  X: y\n' })), ['G4']);
    assert.deepEqual(rules(game('a', { '_headers': '' })), ['G4']);
  });

  describe('G5: the build stays inside the game headers', () => {
    const head = (extra: string) => GOOD_HTML.replace('</head>', `${extra}</head>`);
    const body = (extra: string) => GOOD_HTML.replace('</body>', `${extra}</body>`);
    const findings = (files: Record<string, string | null>) => checkApp(game('a', files));

    it('passes same-origin files, inline images and media, local fonts, and a comment that names what it avoids', () => {
      const html = head('<link rel="icon" href="data:image/png;base64,iVBORw0KGgo=">\n<link rel="modulepreload" href="/assets/vendor-AbCd1234.js">')
        .replace('<body>', '<body><!-- no inline <style> or style= here -->')
        .replace(
          '</body>',
          `<img src="/assets/logo-AbCd1234.png" srcset="data:image/png;base64,iVBORw0KGgo= 1x, assets/logo-EfGh5678.png 2x" alt="">
<img src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E" alt="">
<audio src="/assets/hit-AbCd1234.mp3"></audio><audio src="data:audio/wav;base64,UklGRg=="></audio>
<video poster="data:image/png;base64,iVBORw0KGgo="><source src="/assets/intro-AbCd1234.mp4"></video>
<a href="https://example.com/">credits</a></body>`,
        );
      const css = `/* @font-face { src: url(https://cdn.example/x.woff2) } */
@font-face{font-family:Ko;src:local("AppleSDGothicNeo-Regular")}
@font-face{font-family:Game;src:url(/assets/game-AbCd1234.woff2) format("woff2"),url("./game-EfGh5678.woff") format("woff")}
.coin{background:url(data:image/png;base64,iVBORw0KGgo=)}
.sky{background-image:url('/assets/sky-AbCd1234.png')}`;
      const js = 'const hit="data:image/png;base64,iVBORw0KGgo=";fetch(n.href);ctx.decodeAudioData(b);';
      assert.deepEqual(findings({ 'dist/index.html': html, 'dist/assets/index-EfGh5678.css': css, 'dist/assets/index-AbCd1234.js': js }), []);
    });

    it('fails an inline <style> and a style= attribute', () => {
      assert.deepEqual(rules(game('a', { 'dist/index.html': head('<style>body{margin:0}</style>') })), ['G5']);
      assert.deepEqual(rules(game('a', { 'dist/index.html': GOOD_HTML.replace('<canvas id="game">', '<canvas id="game" style="width:100%">') })), ['G5']);
      // An attribute that only ends in "style" is not one.
      assert.deepEqual(rules(game('a', { 'dist/index.html': GOOD_HTML.replace('<canvas id="game">', '<canvas id="game" data-style="x">') })), []);
    });

    it('joins no tag where it cuts a comment out', () => {
      assert.deepEqual(rules(game('a', { 'dist/index.html': body('<sty<!-- -->le>') })), []);
    });

    it('fails a link, image or sound off the game origin, and a frame, object or embed at all', () => {
      const cases = [
        head('<link rel="stylesheet" href="https://cdn.example/tossface.css">'),
        head('<link rel="preconnect" href="//fonts.example">'),
        head('<link rel="stylesheet" href="data:text/css,body{}">'),
        body('<img src="https://example.com/a.png" alt="">'),
        body('<img src="/a.png" srcset="/a.png 1x, https://cdn.example/a@2x.png 2x" alt="">'),
        body('<audio src="https://cdn.example/bgm.mp3"></audio>'),
        body('<video><source src="http://cdn.example/intro.mp4"></video>'),
        body('<iframe src="/assets/frame-AbCd1234.html"></iframe>'),
        body('<object data="/a.swf"></object>'),
        body('<embed src="/a.swf">'),
      ];
      for (const html of cases) assert.deepEqual(rules(game('a', { 'dist/index.html': html })), ['G5'], html);
    });

    it('leaves an off-origin <script src> to H1, for both kinds', () => {
      assert.deepEqual(rules(game('a', { 'dist/index.html': head('<script type="module" src="https://cdn.example/x.js"></script>') })), ['H1']);
    });

    it('fails a font inlined as data or loaded from elsewhere, and a stylesheet or image from elsewhere', () => {
      const cases = [
        '@font-face{font-family:Game;src:url(data:font/woff2;base64,d09GMgABAAAAAA) format("woff2")}',
        '@font-face{font-family:Game;src:url("https://cdn.example/game.woff2")}',
        '@import url("https://cdn.example/tossface.css");',
        '@import "//cdn.example/a.css";',
        '.sky{background:url(https://cdn.example/sky.png)}',
      ];
      for (const css of cases) {
        const found = findings({ 'dist/assets/index-EfGh5678.css': css });
        assert.deepEqual(found.map((f) => f.rule), ['G5'], css);
        assert.match(found[0]!.message, /^dist\/assets\/index-EfGh5678\.css: /);
      }
    });

    it('fails inline audio in a page that decodes sound through fetch, and only there', () => {
      const inlined = 'const hit="data:audio/wav;base64,UklGRg==";';
      const decodes = 'fetch(u).then(r=>r.arrayBuffer()).then(b=>ctx.decodeAudioData(b));';
      const found = findings({ 'dist/assets/index-AbCd1234.js': inlined + decodes });
      assert.deepEqual(found.map((f) => f.rule), ['G5']);
      assert.match(found[0]!.message, /connect-src 'self'/);
      // The decoder may sit in another chunk.
      assert.deepEqual(rules(game('a', { 'dist/assets/index-AbCd1234.js': inlined, 'dist/assets/sound-EfGh5678.js': decodes })), ['G5']);
      // Played through <audio>, inline audio is what media-src data: allows; inline images never matter.
      assert.deepEqual(rules(game('a', { 'dist/assets/index-AbCd1234.js': `${inlined}new Audio(hit).play();` })), []);
      assert.deepEqual(rules(game('a', { 'dist/assets/index-AbCd1234.js': `const t="data:image/png;base64,iVBORw0KGgo=";${decodes}` })), []);
    });
  });

  it('a miniapp is never checked against the game rules', () => {
    const app = {
      ...game('a', {
        'src/main.ts': 'window.ReactNativeWebView.postMessage("x");',
        'public/_headers': '',
        'dist/assets/index-EfGh5678.css': '@font-face{font-family:T;src:url(https://cdn.example/t.woff2)}',
      }),
      kind: 'app',
    } as const;
    for (const rule of ['G1', 'G2', 'G3', 'G4', 'G5'] as const) assert.ok(!rules(app).includes(rule), rule);
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
