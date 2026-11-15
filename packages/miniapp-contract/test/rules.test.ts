import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { judgeN4 } from '../src/observe/n4.ts';
import { RunnerError, type Visit } from '../src/session.ts';
import { TEMPLATE_BUILD } from './global-setup.ts';

const pkg = resolve(import.meta.dirname, '..');
const fixture = (name: string) => join(pkg, 'test', 'fixtures', name);

interface Run {
  status: number | null;
  stdout: string;
  stderr: string;
}

function contract(args: string[], env: NodeJS.ProcessEnv = process.env): Promise<Run> {
  return new Promise((done) => {
    const child = spawn(process.execPath, [join(pkg, 'dist', 'cli.js'), ...args], { env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (status) => done({ status, stdout, stderr }));
  });
}

async function judge(dir: string, id?: string) {
  const run = await contract(['--dir', dir, ...(id ? ['--id', id] : []), '--json']);
  const findings = run.stdout.split('\n').filter(Boolean).map((line) => JSON.parse(line) as Record<string, string>);
  return { ...run, findings, rules: findings.map((f) => f.rule) };
}

describe('the fixtures', () => {
  test.concurrent('n1-bad breaks N1 and only N1, with a finding in the shape of check --json', async () => {
    const run = await judge(fixture('n1-bad'));
    assert.equal(run.status, 1, run.stderr);
    assert.deepEqual(run.rules, ['N1']);
    assert.deepEqual(run.findings[0], {
      id: 'n1-bad',
      kind: 'app',
      rule: 'N1',
      level: 'error',
      message: 'a click on <a> "site" in / navigated to https://example.org/ with no link.open for it. Inside the app, leave the page through openUrl() or handleLinkClick()',
      spec: 'docs/reference/miniapp-spec.md#page',
    });
  });

  test.concurrent('n2-bad breaks N2 and only N2, naming the key', async () => {
    const run = await judge(fixture('n2-bad'));
    assert.equal(run.status, 1, run.stderr);
    assert.deepEqual(run.rules, ['N2']);
    assert.match(run.findings[0]!.message!, /query key "debug": with \?debug=1 the page shows other text/);
  });

  test.concurrent('n3-bad breaks N3 and only N3, naming the route', async () => {
    const run = await judge(fixture('n3-bad'));
    assert.equal(run.status, 1, run.stderr);
    assert.deepEqual(run.rules, ['N3']);
    assert.match(run.findings[0]!.message!, /^\/about renders outside <MiniappRoot>/);
  });

  test.concurrent('n4-bad breaks N4 once per cause: an origin .env.production does not name, and cookies', async () => {
    const run = await judge(fixture('n4-bad'));
    assert.equal(run.status, 1, run.stderr);
    assert.deepEqual(run.rules, ['N4', 'N4']);
    assert.match(run.findings[0]!.message!, /called https:\/\/api\.elsewhere\.example\/me, an origin that no VITE_\* value/);
    assert.match(run.findings[1]!.message!, /asked to send cookies to https:\/\/api\.elsewhere\.example\/me/);
    assert.equal(run.findings[1]!.spec, 'docs/reference/miniapp-spec.md#backend');
  });

  test.concurrent('good keeps all four and prints nothing', async () => {
    const run = await judge(fixture('good'));
    assert.deepEqual({ status: run.status, stdout: run.stdout }, { status: 0, stdout: '' }, run.stderr);
  });

  test.concurrent('the miniapp template keeps all four and prints nothing', async () => {
    const run = await judge(TEMPLATE_BUILD, 'template');
    assert.deepEqual({ status: run.status, stdout: run.stdout }, { status: 0, stdout: '' }, run.stderr);
  });
});

describe('N4 preflight', () => {
  let server: Server;
  let backend: string;
  let answer: (headers: IncomingHttpHeaders) => Record<string, string> = () => ({});
  const production = 'https://shop.mini.skkuverse.com';

  beforeAll(async () => {
    server = createServer((request, response) => response.writeHead(204, answer(request.headers)).end());
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    backend = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((done) => server.close(() => done())));

  const visitCalling = (url: string): Visit => ({
    path: '/',
    posted: [],
    departures: [],
    outbound: [{ url, method: 'PUT', preflightHeaders: ['authorization'], trigger: 'the load of /' }],
    cookieAsks: [],
    routes: ['/'],
    text: '',
    rootMarked: false,
    unclicked: 0,
  });

  test('a backend that allows the production origin, method and headers passes', async () => {
    answer = (headers) => ({
      'Access-Control-Allow-Origin': String(headers.origin),
      'Access-Control-Allow-Methods': String(headers['access-control-request-method']),
      'Access-Control-Allow-Headers': String(headers['access-control-request-headers']),
    });
    assert.deepEqual(await judgeN4([visitCalling(`${backend}/cart`)], new Set([backend]), production), []);
  });

  test('a backend that does not allow the production origin breaks N4', async () => {
    answer = () => ({ 'Access-Control-Allow-Origin': 'https://elsewhere.example' });
    const findings = await judgeN4([visitCalling(`${backend}/cart`)], new Set([backend]), production);
    assert.deepEqual(findings.map((f) => f.rule), ['N4']);
    assert.match(findings[0]!.message, /does not allow https:\/\/shop\.mini\.skkuverse\.com through CORS: Access-Control-Allow-Origin is "https:\/\/elsewhere\.example"/);
  });

  test('a backend that does not allow a header the page sets breaks N4', async () => {
    answer = (headers) => ({ 'Access-Control-Allow-Origin': String(headers.origin), 'Access-Control-Allow-Methods': 'PUT' });
    const findings = await judgeN4([visitCalling(`${backend}/cart`)], new Set([backend]), production);
    assert.deepEqual(findings.map((f) => f.rule), ['N4']);
    assert.match(findings[0]!.message, /Access-Control-Allow-Headers does not allow authorization/);
  });

  test('a backend that cannot be reached is a runner error, not a verdict', async () => {
    await assert.rejects(judgeN4([visitCalling('http://127.0.0.1:9/cart')], new Set(['http://127.0.0.1:9']), production), RunnerError);
  });
});

describe('runner errors exit 2', () => {
  test('with no Chromium, it names the install command', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'miniapp-contract-no-browser-'));
    const run = await contract(['--dir', fixture('good'), '--json'], { ...process.env, PLAYWRIGHT_BROWSERS_PATH: empty });
    assert.deepEqual({ status: run.status, stdout: run.stdout }, { status: 2, stdout: '' });
    assert.match(run.stderr, /Chromium for Playwright [\d.]+ is not installed\. Install it with: npx miniapp-contract install/);
  });

  test('a page the production CSP blocks is not judged', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'miniapp-contract-csp-'));
    mkdirSync(join(dir, 'dist', 'assets'), { recursive: true });
    writeFileSync(join(dir, 'dist', 'index.html'), '<!doctype html><html lang="en"><body><script type="module" src="/assets/index-a1b2c3d4.js"></script></body></html>');
    writeFileSync(join(dir, 'dist', 'assets', 'index-a1b2c3d4.js'), "document.body.append(String(eval('1 + 1')));");
    const run = await contract(['--dir', dir, '--id', 'csp', '--json']);
    assert.deepEqual({ status: run.status, stdout: run.stdout }, { status: 2, stdout: '' });
    assert.match(run.stderr, /the production CSP blocked eval \(script-src\) during the load of \//);
  });

  test('a folder with no build is a usage error', async () => {
    const run = await contract(['--dir', join(pkg, 'src'), '--json']);
    assert.equal(run.status, 2);
    assert.match(run.stderr, /src is not built: .*index\.html does not exist/);
  });
});
