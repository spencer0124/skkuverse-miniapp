import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage } from 'node:http';
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

function parsed(run: Run) {
  const findings = run.stdout.split('\n').filter(Boolean).map((line) => JSON.parse(line) as Record<string, string>);
  return { ...run, findings, rules: findings.map((f) => f.rule) };
}

async function judge(dir: string, id?: string) {
  return parsed(await contract(['--dir', dir, ...(id ? ['--id', id] : []), '--json']));
}

/**
 * A built page with no bundler: `script` runs as its module. It marks `<html>`
 * the way `<MiniappRoot>` does outside the app, so N3 holds.
 */
function page(script: string, env?: string, files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'miniapp-contract-page-'));
  mkdirSync(join(dir, 'dist', 'assets'), { recursive: true });
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, 'dist', name), text);
  writeFileSync(join(dir, 'dist', 'index.html'), '<!doctype html><html lang="en"><body><script type="module" src="/assets/index-a1b2c3d4.js"></script></body></html>');
  writeFileSync(join(dir, 'dist', 'assets', 'index-a1b2c3d4.js'), `document.documentElement.setAttribute('data-sv-chrome', '');\n${script}`);
  if (env !== undefined) writeFileSync(join(dir, '.env.production'), env);
  return dir;
}

/** A repository whose apps/<id> holds a copy of a fixture's build, with `entry` as its deploy.config.json line. */
function repository(fixtureName: string, entry: Record<string, unknown>): string {
  const root = mkdtempSync(join(tmpdir(), 'miniapp-contract-repo-'));
  cpSync(join(fixture(fixtureName), 'dist'), join(root, 'apps', fixtureName, 'dist'), { recursive: true });
  writeFileSync(join(root, 'deploy.config.json'), JSON.stringify({ apps: { [fixtureName]: { project: `miniapp-${fixtureName}`, ...entry } } }));
  return root;
}

interface Sink {
  origin: string;
  requests: string[];
  upgrades: string[];
  close(): Promise<void>;
}

/** A backend on 127.0.0.1 that logs every request and every WebSocket handshake that reaches it. */
async function sink(answer: (request: IncomingMessage) => { status: number; headers?: Record<string, string> }): Promise<Sink> {
  const requests: string[] = [];
  const upgrades: string[] = [];
  const server = createServer((request, response) => {
    requests.push(`${request.method} ${request.url}`);
    const { status, headers } = answer(request);
    response.writeHead(status, headers).end();
  });
  server.on('upgrade', (request, socket) => {
    upgrades.push(String(request.url));
    socket.destroy();
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  return {
    origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    requests,
    upgrades,
    close: () => new Promise<void>((done) => server.close(() => done())),
  };
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

describe('N4 CORS', () => {
  let backend: Sink;
  let answer: (request: IncomingMessage) => { status: number; headers?: Record<string, string> } = () => ({ status: 204 });
  const production = 'https://shop.mini.skkuverse.com';

  beforeAll(async () => {
    backend = await sink((request) => answer(request));
  });
  afterAll(() => backend.close());

  const visitCalling = (url: string, method = 'PUT', preflightHeaders = ['authorization']): Visit => ({
    path: '/',
    posted: [],
    departures: [],
    outbound: [{ url, method, preflightHeaders, transport: 'http', trigger: 'the load of /' }],
    requests: [],
    refused: [],
    cookieAsks: [],
    routes: ['/'],
    text: '',
    rootMarked: false,
    unclicked: 0,
  });

  test('a backend that allows the production origin, method and headers passes', async () => {
    answer = ({ headers }) => ({
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': String(headers.origin),
        'Access-Control-Allow-Methods': String(headers['access-control-request-method']),
        'Access-Control-Allow-Headers': String(headers['access-control-request-headers']),
      },
    });
    assert.deepEqual(await judgeN4([visitCalling(`${backend.origin}/cart`)], new Set([backend.origin]), production), []);
  });

  test('a backend that does not allow the production origin breaks N4', async () => {
    answer = () => ({ status: 204, headers: { 'Access-Control-Allow-Origin': 'https://elsewhere.example' } });
    const findings = await judgeN4([visitCalling(`${backend.origin}/cart`)], new Set([backend.origin]), production);
    assert.deepEqual(findings.map((f) => f.rule), ['N4']);
    assert.match(findings[0]!.message, /does not allow https:\/\/shop\.mini\.skkuverse\.com through CORS: Access-Control-Allow-Origin is "https:\/\/elsewhere\.example"/);
  });

  test('a backend that does not allow a header the page sets breaks N4', async () => {
    answer = ({ headers }) => ({ status: 204, headers: { 'Access-Control-Allow-Origin': String(headers.origin), 'Access-Control-Allow-Methods': 'PUT' } });
    const findings = await judgeN4([visitCalling(`${backend.origin}/cart`)], new Set([backend.origin]), production);
    assert.deepEqual(findings.map((f) => f.rule), ['N4']);
    assert.match(findings[0]!.message, /Access-Control-Allow-Headers does not allow authorization/);
  });

  test('a simple GET sends no preflight, so a backend that refuses OPTIONS but allows the GET passes', async () => {
    answer = ({ method }) => (method === 'OPTIONS' ? { status: 405 } : { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
    backend.requests.length = 0;
    assert.deepEqual(await judgeN4([visitCalling(`${backend.origin}/data?page=2`, 'GET', [])], new Set([backend.origin]), production), []);
    assert.deepEqual(backend.requests, ['GET /data?page=2']);
  });

  test('a simple GET whose answer allows no origin breaks N4', async () => {
    answer = () => ({ status: 200 });
    const findings = await judgeN4([visitCalling(`${backend.origin}/data`, 'GET', [])], new Set([backend.origin]), production);
    assert.deepEqual(findings.map((f) => [f.rule, f.level]), [['N4', 'error']]);
    assert.match(findings[0]!.message, /through CORS: Access-Control-Allow-Origin is missing in its answer to GET/);
  });

  test('a simple POST is not sent: the runner says it did not check it', async () => {
    answer = () => ({ status: 204 });
    backend.requests.length = 0;
    const findings = await judgeN4([visitCalling(`${backend.origin}/vote`, 'POST', [])], new Set([backend.origin]), production);
    assert.deepEqual(findings.map((f) => [f.rule, f.level]), [['N4', 'warn']]);
    assert.match(findings[0]!.message, /did not check CORS for POST http:\/\/127\.0\.0\.1:\d+\/vote/);
    assert.deepEqual(backend.requests, []);
  });

  test('a backend that cannot be reached is a runner error, not a verdict', async () => {
    await assert.rejects(judgeN4([visitCalling('http://127.0.0.1:9/cart')], new Set(['http://127.0.0.1:9']), production), RunnerError);
  });
});

describe('the page reaches nothing', () => {
  test.concurrent('a WebSocket to another origin never connects, and N4 reports it', async () => {
    const backend = await sink(() => ({ status: 404 }));
    try {
      const socket = `${backend.origin.replace('http:', 'ws:')}/live`;
      const run = await judge(page(`new WebSocket(${JSON.stringify(socket)}); document.body.append('live');`));
      assert.deepEqual(backend.upgrades, []);
      assert.equal(run.status, 1, run.stderr);
      assert.deepEqual(run.rules, ['N4']);
      assert.match(run.findings[0]!.message!, new RegExp(`the load of / opened a WebSocket to ${socket.replaceAll('.', '\\.')}, an origin that no VITE_\\* value`));
    } finally {
      await backend.close();
    }
  });

  test.concurrent('a WebSocket a Worker opens, which the page routing cannot see, never connects, and the run prints it', async () => {
    const backend = await sink(() => ({ status: 404 }));
    try {
      const socket = `${backend.origin.replace('http:', 'ws:')}/from-worker`;
      const run = await judge(page(`new Worker('/worker.js'); document.body.append('worker');`, undefined, { 'worker.js': `new WebSocket(${JSON.stringify(socket)});` }));
      assert.deepEqual(backend.upgrades, []);
      assert.equal(run.status, 0, run.stderr);
      assert.deepEqual(run.findings.map((f) => [f.rule, f.level]), [['N4', 'warn']]);
      assert.match(run.findings[0]!.message!, new RegExp(`opened a connection to ${new URL(backend.origin).host.replaceAll('.', '\\.')} that the runner's routing did not see`));
    } finally {
      await backend.close();
    }
  });

  test.concurrent('a WebSocket to a backend .env.production names never connects either, and passes', async () => {
    const backend = await sink(() => ({ status: 404 }));
    try {
      const socket = `${backend.origin.replace('http:', 'ws:')}/live`;
      const run = await judge(page(`new WebSocket(${JSON.stringify(socket)}); document.body.append('live');`, `VITE_LIVE_URL=${socket}\n`));
      assert.deepEqual(backend.upgrades, []);
      assert.deepEqual({ status: run.status, stdout: run.stdout }, { status: 0, stdout: '' }, run.stderr);
    } finally {
      await backend.close();
    }
  });
});

describe('N2 compares what the page requests', () => {
  test.concurrent('a query key that changes only a request address breaks N2', async () => {
    const script = `const api = new URLSearchParams(location.search).get('api') ?? '';
fetch(api + '/items').catch(() => {});
document.body.append('items');`;
    const run = await judge(page(script));
    assert.equal(run.status, 1, run.stderr);
    assert.deepEqual(run.rules, ['N2']);
    assert.match(run.findings[0]!.message!, /query key "api": with \?api=1 the page requests other addresses \(GET http:\/\/127\.0\.0\.1:\d+\/1\/items\)/);
  });
});

describe('operatorPaths and queryParams in deploy.config.json', () => {
  test.concurrent('a skipped path or key fails nothing, and every skip is printed as a warn line', async () => {
    const root = repository('n3-bad', { operatorPaths: ['/about'] });
    const run = parsed(await contract(['--root', root, '--json']));
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(run.findings.map((f) => [f.rule, f.level]), [['N3', 'warn']]);
    assert.match(run.findings[0]!.message!, /did not load \/about or any route under it, because operatorPaths in deploy\.config\.json lists it\. The crawl reached \/about/);

    const text = await contract(['--root', repository('n2-bad', { queryParams: ['debug'] })]);
    assert.equal(text.status, 0, text.stderr);
    assert.match(text.stdout, /^! n2-bad N2 did not load \/ with the query key "debug", because queryParams in deploy\.config\.json lists it$/m);
  });

  test.concurrent('the N3 failure that points at operatorPaths says the skip is printed', async () => {
    const run = await judge(fixture('n3-bad'));
    assert.match(run.findings[0]!.message!, /list it in operatorPaths if it is an operator page; the runner prints every path it skips/);
  });

  for (const paths of [[''], ['/'], ['settings']]) {
    test.concurrent(`operatorPaths ${JSON.stringify(paths)} is refused with exit 2`, async () => {
      const run = await contract(['--root', repository('n3-bad', { operatorPaths: paths }), '--json']);
      assert.deepEqual({ status: run.status, stdout: run.stdout }, { status: 2, stdout: '' });
      assert.match(run.stderr, /apps\.n3-bad\.operatorPaths: ".*" must start with \/ and name at least one segment, such as "\/admin"/);
    });
  }
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
