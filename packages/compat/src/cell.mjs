/**
 * One matrix cell in its own process: `node src/cell.mjs <mode> <page> <host> [esm|global]`.
 *
 * Modes: `mini` (miniapp shell scenarios), `game` (the `bootGame` handshake), `late` (the host appears after the page
 * gave up waiting) and `honly` (the host bootstrap alone). A version is a published `@skkuverse/miniapp` version, or
 * `workspace` for the package in this repository. Each cell is its own process because the SDK holds module state and
 * the bootstrap defines a non-configurable `window.skkuverse`.
 *
 * The host of version H is what H's package says an app built with H does: `hostBootstrapScript`, `hostDeliverScript`,
 * `parseMessage`, `NOTIFY_METHODS`, `GAME_NOTIFY_METHODS` and `GAME_PROTOCOL`. The dispatcher around them models the
 * app's bridge. It parses, answers a request with `unsupported`, drops a method the grant lacks and marks the rest
 * handled.
 *
 * Adding a bridge method means one entry in `METHOD_SCENARIOS` (or, for a game method, `GAME_OUTBOUND`). The test in
 * `test/matrix.test.mjs` fails for a method of the workspace protocol that no entry here names.
 */
import fs, { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const COMPAT_ROOT = path.join(import.meta.dirname, '..');

const VIEWPORT = {
  safeArea: { top: 47, bottom: 34, left: 0, right: 0 },
  contentSafeArea: { top: 56, bottom: 0, left: 0, right: 0 },
  chrome: 'glass',
};
const VIEWPORT2 = {
  safeArea: { top: 20, bottom: 0, left: 44, right: 44 },
  contentSafeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  chrome: 'opaque',
};
const RECT = { x: 0, y: 56, width: 320, height: 480 };
const OVER = { score: 12, ticks: 300, hit: 'wall', revives: 0, revivesLeft: 1, validator: 'wave-run@1', stats: { jumps: 3 }, telemetry: { fps: 60 } };

/** Each mini-app notification the page can send, the SDK function that sends it, and a call that exercises it. */
export const METHOD_SCENARIOS = [
  { id: 'haptic', method: 'haptic.impact', fn: 'haptic', call: (api) => api.haptic('light') },
  { id: 'link', method: 'link.open', fn: 'openUrl', call: (api) => api.openUrl('https://example.com/a', { appUrl: 'example://a' }) },
  { id: 'map', method: 'map.openPlace', fn: 'openMapPlace', call: (api) => api.openMapPlace('event:42') },
  { id: 'miniapp', method: 'miniapp.open', fn: 'openMiniapp', call: (api) => api.openMiniapp('wave-run') },
  { id: 'share', method: 'share.open', fn: 'share', call: (api) => api.share({ url: 'https://example.com/s', text: 'hi' }), webFallback: true },
  { id: 'ready', method: 'app.ready', fn: 'ready', call: (api) => api.ready() },
  { id: 'track', method: 'analytics.track', fn: 'track', call: (api) => api.track('evt', { a: 1 }) },
  { id: 'shell', method: 'shell.set', fn: 'setShell', call: (api) => api.setShell({ header: 'overlay', statusBar: 'light', background: '#112233' }) },
];

/** The game notifications `game-outbound` expects the host to see after `game.ready`, which `game-ready-init` covers. */
export const GAME_OUTBOUND = ['game.start', 'game.phase', 'game.layout', 'game.haptic', 'game.over'];

/** Every notification method some scenario here sends, mini-app and game. */
export const COVERED_METHODS = [...METHOD_SCENARIOS.map((s) => s.method), 'game.ready', ...GAME_OUTBOUND];

const RANK = { broken: 3, gap: 2, fallback: 1, ok: 0 };
const NAMES = { broken: 'FAIL', gap: 'gap', fallback: 'fb', ok: 'ok' };

/** The verdict of a set of scenarios: the worst status, and its scenario ids when there are few of them. */
export function verdict(scenarios) {
  const measured = scenarios.filter((s) => s.status !== 'n/a');
  if (measured.length === 0) return 'n/a';
  const worst = measured.reduce((w, s) => (RANK[s.status] > RANK[w] ? s.status : w), 'ok');
  if (worst === 'ok') return 'ok';
  const ids = measured.filter((s) => s.status === worst).map((s) => s.id);
  return `${NAMES[worst]}: ${ids.length > 3 ? `${ids.length} scenarios` : ids.join(',')}`;
}

const mask = (s) => String(s).replace(/r\d+-[a-z0-9]{8}/g, 'r<n>-<rand>');
const short = (s, n = 140) => (String(s).length > n ? `${String(s).slice(0, n)}...` : String(s));
const posted = (host, from) => host.log.slice(from).filter((e) => e.dir === 'page>host');
const sameSet = (a, b) => {
  const left = [...a].sort();
  const right = [...b].sort();
  return left.length === right.length && left.every((x, i) => x === right[i]);
};
const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

async function cell(mode, page, host, build, install) {
  const hostVersion = host;
  const pkgDir = (v) => path.join(install, 'node_modules', `sdk-${v}`);
  const entry = (v, sub) => pathToFileURL(path.join(pkgDir(v), 'dist', sub, 'index.js')).href;
  const { Window } = await import(pathToFileURL(createRequire(path.join(install, 'noop.js')).resolve('happy-dom')).href);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function freshWindow(url) {
    const win = new Window({ url });
    Object.assign(globalThis, {
      window: win,
      document: win.document,
      location: win.location,
      CustomEvent: win.CustomEvent,
      Event: win.Event,
      MutationObserver: win.MutationObserver,
    });
    const nav = { share: undefined, clipboard: undefined, calls: [] };
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
    win.open = (...a) => nav.calls.push(['window.open', a[0]]);
    return { win, nav };
  }

  async function loadHost(version) {
    try {
      const proto = await import(entry(version, 'protocol'));
      if (typeof proto.hostBootstrapScript !== 'function') return { error: 'no hostBootstrapScript export' };
      return { proto };
    } catch (e) {
      return { error: String(e.message).split('\n')[0] };
    }
  }

  function makeHost(Hp, win, kind) {
    const grants = [...(kind === 'game' ? (Hp.GAME_NOTIFY_METHODS ?? Hp.NOTIFY_METHODS) : Hp.NOTIFY_METHODS)];
    const log = [];
    const deliver = (msg) => {
      log.push({ dir: 'host>page', msg });
      new Function(Hp.hostDeliverScript(win.location.origin, msg))();
    };
    const reply = (msg) => queueMicrotask(() => deliver(msg));
    const onRaw = (raw) => {
      const parsed = Hp.parseMessage(raw);
      let outcome;
      if (!parsed) outcome = { kind: 'dropped', why: 'parseMessage returned null' };
      else if (parsed.id !== undefined) {
        outcome = { kind: 'replied', why: 'unsupported' };
        reply({ id: parsed.id, ok: false, error: { code: 'unsupported', message: `Unknown method: ${parsed.method}` } });
      } else if (!grants.includes(parsed.method)) outcome = { kind: 'dropped', why: `${parsed.method} not granted` };
      else {
        outcome = { kind: 'handled', method: parsed.method };
        if (kind === 'game' && parsed.method === 'game.ready') {
          reply({ event: 'game.init', data: { gameProtocol: Hp.GAME_PROTOCOL, hi: 7, sound: true } });
        }
      }
      log.push({ dir: 'page>host', raw, parsed, outcome });
    };
    return {
      grants,
      log,
      deliver,
      install(viewport = VIEWPORT, origin) {
        win.ReactNativeWebView = { postMessage: (raw) => onRaw(String(raw)) };
        const opts = { capabilities: grants, viewport };
        if (origin !== undefined) opts.origin = origin;
        new Function('window', 'document', Hp.hostBootstrapScript(opts))(win, win.document);
      },
    };
  }

  async function loadPage(version, kind) {
    if (build === 'global') {
      const file = path.join(pkgDir(version), 'dist', 'miniapp-sdk.global.js');
      const api = new Function(`${readFileSync(file, 'utf8')}\n;return SkkuverseMiniapp;`)();
      return { api, game: null };
    }
    const api = await import(entry(version, ''));
    const hasGame = kind === 'game' && fs.existsSync(path.join(pkgDir(version), 'dist', 'game', 'index.js'));
    return { api, game: hasGame ? await import(entry(version, 'game')) : null };
  }

  async function methodScenario(api, host, { id, method, fn, call }) {
    if (typeof api[fn] !== 'function') return { id, status: 'n/a', detail: `page has no ${fn}` };
    const from = host.log.length;
    let error;
    let result;
    try {
      result = await call(api);
    } catch (e) {
      error = String(e);
    }
    await flush();
    const sent = posted(host, from);
    const granted = host.grants.includes(method);
    const observed = sent.map((s) => mask(short(s.raw)));
    if (error) return { id, status: 'broken', detail: `threw ${short(error)}`, observed };
    if (sent.length === 0) {
      return granted
        ? { id, status: 'broken', detail: `host grants ${method} but the page sent nothing`, observed, result }
        : { id, status: 'fallback', detail: `host does not grant ${method}; page degraded without a message`, observed, result };
    }
    const bad = sent.find((s) => s.outcome.kind !== 'handled' || s.parsed.method !== method);
    if (bad) return { id, status: 'broken', detail: `host ${bad.outcome.kind}: ${bad.outcome.why ?? bad.outcome.method}`, observed, result };
    return { id, status: 'ok', detail: `host handled ${method}`, observed, result };
  }

  async function miniScenarios(api, Hp, host, nav) {
    const out = [];
    {
      const c = typeof api.getCapabilities === 'function' ? api.getCapabilities() : null;
      const inApp = api.isInApp();
      const caps = c ? [...c.capabilities] : [];
      const ok = inApp && c && c.protocol === Hp.PROTOCOL_VERSION && sameSet(caps, host.grants);
      out.push({
        id: 'detect',
        status: ok ? 'ok' : 'broken',
        detail: ok
          ? `inApp, protocol ${c.protocol}, ${caps.length} capabilities match the host grant`
          : `inApp=${inApp} protocol=${c?.protocol} page sees [${caps.join(',')}] but host grants [${host.grants.join(',')}]`,
      });
    }
    for (const scenario of METHOD_SCENARIOS) {
      if (!scenario.webFallback) {
        out.push(await methodScenario(api, host, scenario));
        continue;
      }
      nav.share = async (d) => nav.calls.push(['navigator.share', d.url]);
      const before = nav.calls.length;
      const r = await methodScenario(api, host, scenario);
      const viaFallback = nav.calls.slice(before).some((c) => c[0] === 'navigator.share');
      if (r.status === 'fallback' && !viaFallback) {
        r.status = 'broken';
        r.detail = `host does not grant ${scenario.method} and the web fallback did not run`;
      }
      if (r.status === 'fallback') r.detail += `; navigator.share fallback returned ${JSON.stringify(r.result)}`;
      out.push(r);
    }
    if (typeof api.request !== 'function') out.push({ id: 'request', status: 'n/a', detail: 'page has no request' });
    else {
      const from = host.log.length;
      let outcome;
      try {
        await api.request('link.open', { url: 'https://example.com/r' }, { timeoutMs: 500 });
        outcome = { status: 'broken', detail: 'request resolved, the host answers unsupported' };
      } catch (e) {
        outcome =
          e?.name === 'MiniappError' && e.code === 'unsupported'
            ? { status: 'ok', detail: 'MiniappError unsupported round trip' }
            : { status: 'broken', detail: `rejected with ${e?.name}/${e?.code}: ${short(e?.message)}` };
      }
      out.push({ id: 'request', ...outcome, observed: posted(host, from).map((s) => mask(short(s.raw))) });
    }
    if (typeof api.onViewportChange !== 'function' || typeof api.getViewport !== 'function') {
      out.push({ id: 'viewport', status: 'n/a', detail: 'page has no viewport API' });
    } else {
      const seen = [];
      const stop = api.onViewportChange((v) => seen.push(v));
      const before = JSON.stringify(api.getViewport());
      host.deliver({ event: 'viewport.changed', data: VIEWPORT2 });
      await flush();
      const after = JSON.stringify(api.getViewport());
      const css = globalThis.document.documentElement.style.getPropertyValue('--sv-inset-left');
      stop();
      const ok = before === JSON.stringify(VIEWPORT) && after === JSON.stringify(VIEWPORT2) && seen.length === 1 && JSON.stringify(seen[0]) === JSON.stringify(VIEWPORT2) && css === '44px';
      out.push({
        id: 'viewport',
        status: ok ? 'ok' : 'broken',
        detail: ok ? 'initial viewport, viewport.changed callback, getViewport and CSS var all follow the host' : `before=${before} after=${after} callbacks=${seen.length} css=${css}`,
      });
    }
    return out;
  }

  function gameHandlers(events) {
    const note = (name) => (...a) => events.push([name, ...a]);
    return {
      onInit: note('init'),
      onPause: note('pause'),
      onResume: note('resume'),
      onSound: note('sound'),
      onReset: note('reset'),
      onRestart: note('restart'),
      onRevive: note('revive'),
      onViewport: note('viewport'),
      onNoHost: note('noHost'),
      rect: () => RECT,
    };
  }
  const names = (events) => events.map((e) => e[0]);

  async function waitFor(pred, ms) {
    const end = performance.now() + ms;
    while (performance.now() < end) {
      if (pred()) return true;
      await sleep(5);
    }
    return pred();
  }

  async function gameScenario(game, Hp, host) {
    const events = [];
    const handle = game.bootGame(gameHandlers(events), { pollMs: 5, waitMs: 400 });
    if (typeof Hp.GAME_NOTIFY_METHODS === 'undefined') {
      await waitFor(() => names(events).includes('noHost'), 3000);
      handle.dispose();
      const sent = posted(host, 0);
      return [
        {
          id: 'game-handshake',
          status: names(events).includes('noHost') && sent.length === 0 ? 'gap' : 'broken',
          detail: `host ${hostVersion} has no game.* grant: page reported noHost=${names(events).includes('noHost')}, sent ${sent.length} messages`,
        },
      ];
    }
    const got = await waitFor(() => names(events).includes('init'), 3000);
    const out = [];
    const initEvt = events.find((e) => e[0] === 'init');
    const initOk = got && initEvt[1].gameProtocol === Hp.GAME_PROTOCOL && initEvt[1].hi === 7 && initEvt[1].sound === true;
    out.push({
      id: 'game-ready-init',
      status: initOk ? 'ok' : 'broken',
      detail: initOk ? `game.ready answered by game.init ${JSON.stringify(initEvt[1])}` : `no valid init (events: ${names(events).join(',')})`,
      observed: posted(host, 0).map((s) => mask(short(s.raw))),
    });
    const from = host.log.length;
    const startOk = handle.start();
    handle.phase('running');
    handle.layout(RECT);
    handle.haptic('success');
    handle.over(OVER);
    await flush();
    const sent = posted(host, from);
    const methods = sent.map((s) => s.parsed?.method ?? '?');
    const handled = sent.every((s) => s.outcome.kind === 'handled');
    out.push({
      id: 'game-outbound',
      status: startOk && handled && sameSet(methods, GAME_OUTBOUND) ? 'ok' : 'broken',
      detail: `start()=${startOk}; host saw [${methods.join(',')}]${handled ? '' : `; not handled: ${sent.filter((s) => s.outcome.kind !== 'handled').map((s) => `${s.parsed?.method ?? short(s.raw, 60)} -> ${s.outcome.why}`).join('; ')}`}`,
      observed: sent.map((s) => mask(short(s.raw, 160))),
    });
    const mark = events.length;
    host.deliver({ event: 'game.pause', data: {} });
    host.deliver({ event: 'game.resume', data: {} });
    host.deliver({ event: 'game.sound', data: { on: false } });
    host.deliver({ event: 'game.reset', data: {} });
    host.deliver({ event: 'game.restart', data: {} });
    host.deliver({ event: 'game.revive', data: {} });
    host.deliver({ event: 'viewport.changed', data: VIEWPORT2 });
    await flush();
    const inbound = events.slice(mark);
    const wantIn = ['pause', 'resume', 'sound', 'reset', 'restart', 'revive', 'viewport'];
    out.push({
      id: 'game-inbound',
      status: sameSet(names(inbound), wantIn) && names(inbound).length === wantIn.length ? 'ok' : 'broken',
      detail: `page handlers fired [${names(inbound).join(',')}]`,
    });
    handle.dispose();
    return out;
  }

  async function lateScenario(game, installHost) {
    const events = [];
    const handle = game.bootGame(gameHandlers(events), { pollMs: 5, waitMs: 50, slowPollMs: 20 });
    const gaveUp = await waitFor(() => names(events).includes('noHost'), 3000);
    if (!gaveUp) {
      handle.dispose();
      return [{ id: 'game-late-host', status: 'broken', detail: 'the page never reported noHost within 3000 ms, so the host could not be late' }];
    }
    installHost();
    const got = await waitFor(() => names(events).includes('init'), 1000);
    handle.dispose();
    return [
      {
        id: 'game-late-host',
        status: got ? 'ok' : 'broken',
        detail: got ? 'host appeared after the page said noHost, and the page still handshook' : 'host appeared after the page said noHost, and the page never sent game.ready',
      },
    ];
  }

  function hostOnly(Hp) {
    const out = [];
    const caps = ['a.b', 'c.d'];
    {
      const { win } = freshWindow('https://miniapp.example/');
      new Function('window', 'document', Hp.hostBootstrapScript({ capabilities: caps, viewport: VIEWPORT }))(win, win.document);
      const h = win.skkuverse;
      const css = win.document.documentElement.style.getPropertyValue('--sv-inset-top');
      const ok = h && h.protocol === Hp.PROTOCOL_VERSION && sameSet([...h.capabilities], caps) && Object.isFrozen(h) && css === '103px' && win.document.documentElement.getAttribute('data-sv-chrome') === 'glass';
      out.push({ id: 'host-install', status: ok ? 'ok' : 'broken', detail: ok ? 'window.skkuverse frozen, protocol, capabilities, CSS vars and data-sv-chrome set' : `skkuverse=${!!h} css=${css}` });
      let threw = null;
      try {
        new Function('window', 'document', Hp.hostBootstrapScript({ capabilities: ['x'], viewport: VIEWPORT }))(win, win.document);
      } catch (e) {
        threw = String(e);
      }
      out.push({ id: 'host-reinject', status: !threw && sameSet([...win.skkuverse.capabilities], caps) ? 'ok' : 'broken', detail: threw ? `second injection threw ${short(threw)}` : 'second injection leaves the first host in place' });
    }
    const originOption =
      Hp.hostBootstrapScript({ capabilities: caps, viewport: VIEWPORT, origin: 'https://game.example' }) !==
      Hp.hostBootstrapScript({ capabilities: caps, viewport: VIEWPORT });
    if (!originOption) {
      const detail = 'the origin option does not exist in this version (absent from its types, ignored by the script)';
      out.push({ id: 'host-origin-gate', status: 'n/a', detail });
      out.push({ id: 'host-subframe-gate', status: 'n/a', detail });
    } else {
      {
        const { win } = freshWindow('https://other.example/');
        new Function('window', 'document', Hp.hostBootstrapScript({ capabilities: caps, viewport: VIEWPORT, origin: 'https://game.example' }))(win, win.document);
        const installed = !!win.skkuverse;
        out.push({
          id: 'host-origin-gate',
          status: installed ? 'broken' : 'ok',
          detail: installed ? 'bootstrap installed window.skkuverse on a foreign origin' : 'bootstrap installs nothing on a foreign origin',
        });
      }
      {
        const { win } = freshWindow('https://game.example/');
        const other = new Window({ url: 'https://game.example/' });
        Object.defineProperty(win, 'top', { value: other, configurable: true });
        new Function('window', 'document', Hp.hostBootstrapScript({ capabilities: caps, viewport: VIEWPORT, origin: 'https://game.example' }))(win, win.document);
        const installed = !!win.skkuverse;
        out.push({
          id: 'host-subframe-gate',
          status: installed ? 'broken' : 'ok',
          detail: installed ? 'bootstrap installed in a subframe of the right origin' : 'bootstrap installs nothing in a subframe',
        });
      }
    }
    {
      const { win } = freshWindow('https://miniapp.example/');
      new Function('window', 'document', Hp.hostBootstrapScript({ capabilities: caps, viewport: VIEWPORT }))(win, win.document);
      let seen = 0;
      win.addEventListener('skkuverse:message', () => seen++);
      let threw = null;
      try {
        win.skkuverse.receive('not json');
        win.skkuverse.receive('42');
        win.skkuverse.receive('null');
        win.skkuverse.receive(JSON.stringify({ event: 'x', data: {} }));
      } catch (e) {
        threw = String(e);
      }
      out.push({ id: 'host-receive', status: !threw && seen === 1 ? 'ok' : 'broken', detail: threw ? `receive threw ${short(threw)}` : `receive ignored bad JSON and delivered ${seen} of 1 valid message` });
    }
    return out;
  }

  const result = { mode, page, host, build, scenarios: [] };
  const hostMod = await loadHost(host);
  if (hostMod.error) {
    result.scenarios.push({ id: 'host', status: 'n/a', detail: `host ${host}: ${hostMod.error}` });
    return result;
  }
  const Hp = hostMod.proto;
  if (mode === 'honly') {
    result.scenarios = hostOnly(Hp);
    return result;
  }
  if (mode === 'mini') {
    const { win, nav } = freshWindow('https://miniapp.example/');
    const h = makeHost(Hp, win, 'mini');
    h.install();
    const { api } = await loadPage(page, 'mini');
    result.scenarios = await miniScenarios(api, Hp, h, nav);
    return result;
  }
  if (mode === 'game' || mode === 'late') {
    const { win } = freshWindow('https://wave-run.game.example/');
    const h = makeHost(Hp, win, 'game');
    const { game } = await loadPage(page, 'game');
    if (!game) {
      result.scenarios.push({ id: mode, status: 'n/a', detail: `page ${page} has no ./game entry` });
      return result;
    }
    if (mode === 'game') {
      h.install();
      result.scenarios = await gameScenario(game, Hp, h);
    } else if (typeof Hp.GAME_NOTIFY_METHODS === 'undefined') {
      result.scenarios.push({ id: 'game-late-host', status: 'gap', detail: `host ${host} has no game.* grant` });
    } else {
      result.scenarios = await lateScenario(game, () => h.install());
    }
    return result;
  }
  throw new Error(`unknown mode ${mode}`);
}

/** Runs one cell and returns its result. A crash is a result too, so one bad cell cannot hide the rest. */
export async function runCell(mode, page, host, build = 'esm', install = process.env.COMPAT_INSTALL ?? COMPAT_ROOT) {
  const started = performance.now();
  let result;
  try {
    result = await cell(mode, page, host, build, install);
  } catch (e) {
    result = { mode, page, host, build, crash: String(e?.stack ?? e).split('\n').slice(0, 4).join(' | ') };
  }
  result.ms = Math.round(performance.now() - started);
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [mode, page, host, build = 'esm'] = process.argv.slice(2);
  if (mode === undefined || page === undefined || host === undefined) {
    process.stderr.write('usage: node src/cell.mjs <mini|game|late|honly> <page version|workspace> <host version> [esm|global]\n');
    process.exit(2);
  }
  const result = await runCell(mode, page, host, build);
  const line = result.crash === undefined ? `verdict: ${verdict(result.scenarios)}\n` : `verdict: CRASH ${result.crash}\n`;
  process.stdout.write(`${line}${JSON.stringify(result)}\n`, () => process.exit(0));
}
