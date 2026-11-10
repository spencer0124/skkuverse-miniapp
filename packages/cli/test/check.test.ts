import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, truncateSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { checkApp, compareVersions, MAX_FILE_BYTES, MAX_FILES, type CheckTarget, type RuleId } from '../src/check.ts';
import { toJson } from '../src/report.ts';

const scratch = mkdtempSync(join(tmpdir(), 'miniapp-cli-test-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

const GOOD_HTML = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <script type="module" crossorigin src="/assets/index-AbCd1234.js"></script>
  </head>
  <body><div id="root"></div></body>
</html>`;
const GOOD_MANIFEST = { shell: { bar: 'top', header: 'opaque', statusBar: 'dark', background: '#FFFFFF' } };

/** A miniapp that passes every rule, with `files` overriding or (null) deleting paths. */
function fixture(id: string, files: Record<string, string | null> = {}): string {
  const dir = join(mkdtempSync(join(scratch, 'app-')), id);
  const base: Record<string, string> = {
    'package.json': JSON.stringify({
      scripts: { dev: 'vite', build: 'vite build', typecheck: 'tsc --noEmit' },
      dependencies: { '@skkuverse/miniapp': '^0.4.0', react: '^19', 'react-dom': '^19' },
      devDependencies: { vite: '^6', typescript: '^5' },
    }),
    'index.html': GOOD_HTML,
    'vite.config.ts': 'export default {};',
    'tsconfig.json': '{}',
    'public/skkuverse.json': JSON.stringify(GOOD_MANIFEST),
    'src/main.tsx': `<MiniappRoot id="${id}" browser="block" dev={import.meta.env.DEV}>`,
    'README.md': '# app',
    'node_modules/@skkuverse/miniapp/package.json': JSON.stringify({ version: '0.4.0' }),
    'dist/index.html': GOOD_HTML,
    'dist/skkuverse.json': JSON.stringify(GOOD_MANIFEST),
    'dist/assets/index-AbCd1234.js': '',
    'dist/assets/WantedSans-Bold-DOtFq8Zv.otf': '',
  };
  for (const [path, content] of Object.entries({ ...base, ...files })) {
    if (content === null) continue;
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

function rules(target: CheckTarget, level: 'error' | 'warn' = 'error'): RuleId[] {
  return checkApp(target)
    .filter((f) => f.level === level)
    .map((f) => f.rule);
}

const target = (id: string, files?: Record<string, string | null>, config: CheckTarget['config'] = { project: `miniapp-${id}` }) =>
  ({ id, dir: fixture(id, files), config }) satisfies CheckTarget;

describe('checkApp', () => {
  it('passes a conforming miniapp', () => {
    assert.deepEqual(checkApp(target('good')), []);
  });

  it('R1: rejects a malformed id', () => {
    assert.ok(rules(target('Bad_Id')).includes('R1'));
  });

  it('R2: the root id must match', () => {
    assert.deepEqual(rules(target('a', { 'src/main.tsx': '<MiniappRoot id="b" browser="block">' })), ['R2']);
  });

  it('R3: browser must be explicit', () => {
    assert.deepEqual(rules(target('a', { 'src/main.tsx': '<MiniappRoot id="a" dev={true}>' })), ['R3']);
  });

  it('R2, R3: a root in a comment is not the root the page renders', () => {
    const decoy = '// <MiniappRoot id="a" browser="block">\n/* <MiniappRoot id="a" browser="allow"> */\n';
    assert.deepEqual(rules(target('a', { 'src/main.tsx': `${decoy}<MiniappRoot id="b">` })), ['R2', 'R3']);
    assert.deepEqual(rules(target('a', { 'src/main.tsx': decoy })), ['R2']);
  });

  it('R2: a spread on <MiniappRoot> fails, since it could replace the literal id', () => {
    assert.deepEqual(rules(target('a', { 'src/main.tsx': '<MiniappRoot id="a" browser="block" {...props}>' })), ['R2']);
  });

  it('R2, R3: every <MiniappRoot> tag is held to them, not only the first', () => {
    const page = `const sample = '<MiniappRoot id="a" browser="block">';\n<MiniappRoot id="b" browser="block">`;
    assert.deepEqual(rules(target('a', { 'src/main.tsx': page })), ['R2']);
  });

  it('R4: a host exception warns, and needs a reason', () => {
    assert.deepEqual(rules(target('a', {}, { project: 'p', host: 'x.example', hostReason: 'legacy' }), 'warn'), ['R4']);
    assert.deepEqual(rules(target('a', {}, { project: 'p', host: 'x.example' })), ['R4']);
  });

  it('S1: required files', () => {
    assert.deepEqual(rules(target('a', { 'README.md': null })), ['S1']);
  });

  it('S3: required scripts', () => {
    const pkg = JSON.stringify({
      scripts: { dev: 'vite', build: 'vite build' },
      dependencies: { '@skkuverse/miniapp': '^0.4.0', react: '^19', 'react-dom': '^19' },
      devDependencies: { vite: '^6', typescript: '^5' },
    });
    assert.deepEqual(rules(target('a', { 'package.json': pkg })), ['S3']);
  });

  it('S4: reads the installed SDK, not the range', () => {
    const old = JSON.stringify({ version: '0.2.1' });
    assert.deepEqual(rules(target('a', { 'node_modules/@skkuverse/miniapp/package.json': old })), ['S4']);
  });

  it('O1: needs a build', () => {
    const noDist = { 'dist/index.html': null, 'dist/skkuverse.json': null, 'dist/assets/index-AbCd1234.js': null, 'dist/assets/WantedSans-Bold-DOtFq8Zv.otf': null };
    assert.ok(rules(target('a', noDist)).includes('O1'));
  });

  it('O2: platform files and 404 pages', () => {
    assert.deepEqual(rules(target('a', { 'dist/_headers': '' })), ['O2']);
    assert.deepEqual(rules(target('a', { 'dist/_worker.js/index.js': '' })), ['O2']);
    assert.deepEqual(rules(target('a', { 'dist/docs/404.html': '' })), ['O2']);
  });

  it('O3: unhashed assets', () => {
    assert.deepEqual(rules(target('a', { 'dist/assets/logo.png': '' })), ['O3']);
  });

  describe('O4: the build stays within the Pages limits', () => {
    /** A conforming miniapp whose dist/data/ the callback fills. */
    const withData = (fill: (data: string) => void) => {
      const t = target('a');
      const data = join(t.dir, 'dist', 'data');
      mkdirSync(data);
      fill(data);
      return t;
    };

    it('fails a file over the size limit, and passes one at it', () => {
      const sized = (bytes: number) =>
        withData((data) => {
          writeFileSync(join(data, 'big.bin'), '');
          truncateSync(join(data, 'big.bin'), bytes);
        });
      assert.deepEqual(rules(sized(MAX_FILE_BYTES)), []);
      const over = checkApp(sized(MAX_FILE_BYTES + 1));
      assert.deepEqual(over.map((f) => f.rule), ['O4']);
      assert.match(over[0]!.message, /dist\/data\/big\.bin/);
    });

    it('fails a build with more files than the limit', () => {
      const crowded = withData((data) => {
        for (let n = 0; n <= MAX_FILES; n++) writeFileSync(join(data, String(n)), '');
      });
      assert.deepEqual(rules(crowded), ['O4']);
    });
  });

  it('H1: viewport-fit, lang, scripts and handlers', () => {
    const noFit = GOOD_HTML.replace(', viewport-fit=cover', '');
    assert.deepEqual(rules(target('a', { 'dist/index.html': noFit })), ['H1']);
    const inline = GOOD_HTML.replace('</head>', '<script>alert(1)</script></head>');
    assert.deepEqual(rules(target('a', { 'dist/index.html': inline })), ['H1']);
    const remote = GOOD_HTML.replace('</head>', '<script src="https://cdn.example/x.js"></script></head>');
    assert.deepEqual(rules(target('a', { 'dist/index.html': remote })), ['H1']);
    const handler = GOOD_HTML.replace('<body>', '<body onload="go()">');
    assert.deepEqual(rules(target('a', { 'dist/index.html': handler })), ['H1']);
    const data = GOOD_HTML.replace('</head>', '<script type="application/ld+json">{}</script></head>');
    assert.deepEqual(rules(target('a', { 'dist/index.html': data })), []);
  });

  it('H1: ends a script at an end tag with attributes, as a browser does', () => {
    const remote = GOOD_HTML.replace('</head>', '<script src="https://cdn.example/x.js"></script foo></head>');
    assert.deepEqual(rules(target('a', { 'dist/index.html': remote })), ['H1']);
  });

  it('M1: the manifest is strict where the parser is silent', () => {
    const m = (shell: unknown, extra: Record<string, unknown> = {}) =>
      ({ 'dist/skkuverse.json': JSON.stringify({ shell, ...extra }) });
    assert.deepEqual(rules(target('a', m({ ...GOOD_MANIFEST.shell, bar: 'side' }))), ['M1']);
    assert.deepEqual(rules(target('a', m({ ...GOOD_MANIFEST.shell, color: '#000000' }))), ['M1']);
    assert.deepEqual(rules(target('a', m({ bar: 'top' }))), ['M1', 'M1', 'M1']);
    assert.deepEqual(rules(target('a', m(GOOD_MANIFEST.shell, { id: 'a' }))), ['M1']);
    assert.deepEqual(rules(target('a', m({ ...GOOD_MANIFEST.shell, background: '#f2f4f6' }))), []);
  });

  it('B1: functions/ only when declared, with its wrangler.toml', () => {
    assert.deepEqual(rules(target('a', { 'functions/api/x.ts': '' })), ['B1']);
    const backend = { project: 'p', backend: 'functions' } as const;
    assert.deepEqual(rules(target('a', { 'functions/api/x.ts': '', 'wrangler.toml': '' }, backend)), []);
    assert.deepEqual(rules(target('a', { 'functions/api/x.ts': '' }, backend)), ['B1']);
  });
});

describe('compareVersions', () => {
  it('orders plain and prerelease versions', () => {
    assert.equal(compareVersions('0.3.0', '0.3.0'), 0);
    assert.equal(compareVersions('0.2.9', '0.3.0'), -1);
    assert.equal(compareVersions('0.10.0', '0.3.0'), 1);
    assert.equal(compareVersions('0.3.0-beta.1', '0.3.0'), -1);
  });
});

describe('toJson', () => {
  it('names the package, its kind, the rule, the level, the message and the spec heading of a finding', () => {
    const dropReact = JSON.stringify({
      scripts: { dev: 'vite', build: 'vite build', typecheck: 'tsc --noEmit' },
      dependencies: { '@skkuverse/miniapp': '^0.4.0', 'react-dom': '^19' },
      devDependencies: { vite: '^6', typescript: '^5' },
    });
    assert.deepEqual(toJson({ id: 'club', kind: 'app', findings: checkApp(target('club', { 'package.json': dropReact })) }), [
      {
        id: 'club',
        kind: 'app',
        rule: 'S2',
        level: 'error',
        message: 'package.json does not depend on react',
        spec: 'docs/reference/miniapp-spec.md#package',
      },
    ]);
  });

  it('keeps a warning a warning, so a host exception reads as allowed', () => {
    const findings = checkApp(target('a', {}, { project: 'p', host: 'x.example', hostReason: 'legacy' }));
    assert.deepEqual(
      toJson({ id: 'a', kind: 'app', findings }).map((f) => [f.rule, f.level, f.spec]),
      [['R4', 'warn', 'docs/reference/miniapp-spec.md#identity']],
    );
  });

  it('is empty for a package that passes', () => {
    assert.deepEqual(toJson({ id: 'good', kind: 'app', findings: checkApp(target('good')) }), []);
  });
});
