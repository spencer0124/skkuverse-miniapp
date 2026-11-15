/**
 * Opens a built miniapp in Chromium and records what it does: the messages it
 * posts to the host, the navigations and popups that would leave its origin,
 * the requests it makes to other origins, and the routes it reaches.
 *
 * Each visit is one page load in a fresh browser context, under the headers
 * `ship` writes (`serve.ts`). With a host, the context gets the app's real
 * `hostBootstrapScript` with the `granted` preset and a recording
 * `ReactNativeWebView` before the page's own script runs, as the app injects
 * them. The page never leaves 127.0.0.1: a navigation to another origin is
 * answered 204, which keeps the page where it is, and any other request to
 * another origin is aborted, so a click on a button that writes to a backend
 * writes nothing. The clock is pinned and `Math.random` is seeded, so two
 * loads of one URL render the same.
 */
import type { Server } from 'node:http';
import { chromium, type Browser, type Locator, type Page, type Request } from 'playwright';
import { hostBootstrapScript, parseMessage } from '@skkuverse/miniapp/protocol';
import { resolvePreset } from '@skkuverse/miniapp/testing';
import { serve } from './serve.ts';

/** A message the page posted to the host, its request id left out so two loads compare. */
export interface Posted {
  method: string;
  params: unknown;
}

/** What the runner was doing when something happened: the load of a path, or a click on it. */
type Trigger = string;

/** A top-level navigation, in the page or in a popup it opened, to another origin. */
export interface Departure {
  url: string;
  via: 'navigation' | 'popup';
  trigger: Trigger;
}

/** A fetch, XHR or EventSource request to another origin. */
export interface Outbound {
  url: string;
  method: string;
  /** The request headers the page's code set, beyond the ones the browser adds itself. */
  headers: string[];
  trigger: Trigger;
}

/** A request to another origin for which the page asked the browser to send cookies. */
export interface CookieAsk {
  url: string;
  how: 'credentials' | 'cookie-header';
  trigger: Trigger;
}

export interface Visit {
  /** The path and query loaded. */
  path: string;
  posted: Posted[];
  departures: Departure[];
  outbound: Outbound[];
  cookieAsks: CookieAsk[];
  /** Same-origin paths the visit navigated to or found in an `<a href>`. */
  routes: string[];
  /** The page's visible text once the load settled, before any click. */
  text: string;
  /** Whether `<html>` carries `data-sv-chrome`, which `<MiniappRoot>` sets outside the app. Only a visit with no host reads it. */
  rootMarked: boolean;
  /** Controls left unclicked because the visit reached `MAX_CLICKS`. */
  unclicked: number;
}

export interface VisitOptions {
  /** Install the fake host before the page loads, as the app does. */
  host: boolean;
  /** Click every anchor and button in DOM order after the load. */
  click: boolean;
}

/** The binding the page's instrumentation reports through. */
const BINDING = '__miniappContract';
/** Every control the crawl clicks, in DOM order. */
const CLICKABLE = 'a[href], button, [role="button"], input[type="button"], input[type="submit"]';
export const MAX_CLICKS = 50;
/** The most routes a crawl visits, and the most N3 loads. */
export const MAX_ROUTES = 20;
/** How long a visit stays quiet (no message, request or DOM change) before it counts as settled. */
const QUIET_MS = 150;
const SETTLE_MAX_MS = 3_000;
const CLICK_TIMEOUT_MS = 1_500;
const LOAD_TIMEOUT_MS = 15_000;
/** The pinned clock: any fixed instant works, as long as every load sees the same one. */
const FIXED_TIME = Date.UTC(2026, 2, 2, 3, 0, 0);
/** The iPhone the `granted` preset's viewport was measured on. */
const VIEWPORT = { width: 390, height: 844 };
/** The request types that reach a backend. A stylesheet, font or image from a CDN is not one. */
const BACKEND_TYPES = new Set(['fetch', 'xhr', 'eventsource']);
/** Headers the browser sets itself, or that CORS allows without a preflight. */
const BROWSER_HEADERS = new Set(['accept', 'accept-language', 'content-language', 'range', 'user-agent', 'referer', 'origin', 'cookie', 'host', 'connection', 'accept-encoding']);
const SIMPLE_CONTENT_TYPES = new Set(['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain']);

/**
 * Runs in every document before its own script, host or not: seeds
 * `Math.random`, reports DOM changes so a visit knows when it settled,
 * reports a fetch or XHR to another origin that asks for cookies, which the
 * request itself does not show once it is intercepted, and reports what the
 * production CSP blocks.
 */
const INSTRUMENT = `(function () {
  var report = window[${JSON.stringify(BINDING)}];
  if (window.top !== window || typeof report !== 'function') return;
  var seed = 0x2f6b4ac1;
  Math.random = function () {
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  var last = 0;
  new MutationObserver(function () {
    var now = performance.now();
    if (now - last < 50) return;
    last = now;
    report('change', '');
  }).observe(document, { childList: true, subtree: true, characterData: true, attributes: true });
  function away(url) {
    try { var u = new URL(url, location.href); return u.origin !== location.origin ? u.href : null; } catch (e) { return null; }
  }
  function ask(url, how) { report('cookies', JSON.stringify({ url: url, how: how })); }
  function namesCookie(headers) {
    if (!headers) return false;
    try { return Object.keys(headers instanceof Headers ? Object.fromEntries(headers) : Array.isArray(headers) ? Object.fromEntries(headers) : headers).some(function (n) { return n.toLowerCase() === 'cookie'; }); } catch (e) { return false; }
  }
  var realFetch = window.fetch;
  window.fetch = function (input, init) {
    var request = input instanceof Request ? input : null;
    var url = away(request ? request.url : String(input));
    if (url) {
      if ((init && init.credentials) === 'include' || (!(init && init.credentials) && request && request.credentials === 'include')) ask(url, 'credentials');
      if (namesCookie(init && init.headers)) ask(url, 'cookie-header');
    }
    return realFetch.apply(this, arguments);
  };
  var proto = XMLHttpRequest.prototype, open = proto.open, send = proto.send, setHeader = proto.setRequestHeader;
  var urls = new WeakMap(), cookieHeaders = new WeakSet();
  proto.open = function (method, url) { urls.set(this, away(String(url))); return open.apply(this, arguments); };
  proto.setRequestHeader = function (name) { if (String(name).toLowerCase() === 'cookie') cookieHeaders.add(this); return setHeader.apply(this, arguments); };
  proto.send = function () {
    var url = urls.get(this);
    if (url) {
      if (this.withCredentials) ask(url, 'credentials');
      if (cookieHeaders.has(this)) ask(url, 'cookie-header');
    }
    return send.apply(this, arguments);
  };
  document.addEventListener('securitypolicyviolation', function (event) {
    report('csp', JSON.stringify({ directive: event.effectiveDirective, blocked: event.blockedURI }));
  });
  report('ready', '');
})();`;

/**
 * The app's side, in the top window: a `ReactNativeWebView` that reports each
 * post and answers each request with `null`, as `createFakeHost` does, then
 * the real bootstrap with the `granted` preset.
 */
function hostScript(): string {
  const { capabilities = [], viewport } = resolvePreset('granted');
  if (viewport === undefined) throw new Error('the granted preset names no viewport');
  return `if (window.top === window) {
(function () {
  var report = window[${JSON.stringify(BINDING)}];
  window.ReactNativeWebView = {
    postMessage: function (raw) {
      var text = String(raw);
      report('post', text);
      var message;
      try { message = JSON.parse(text); } catch (e) { return; }
      if (message && typeof message.id === 'string') {
        setTimeout(function () { window.skkuverse.receive(JSON.stringify({ id: message.id, ok: true, result: null })); }, 0);
      }
    }
  };
})();
${hostBootstrapScript({ capabilities, viewport })}
}`;
}

/** Something kept the runner from a verdict. The command exits 2. */
export class RunnerError extends Error {}

/** Chromium is not installed. The command exits 2 and says how to install it. */
export class BrowserMissingError extends RunnerError {}

export class Session {
  private readonly browser: Browser;
  private readonly server: Server;
  /** The origin the page is served on. */
  readonly origin: string;

  private constructor(browser: Browser, server: Server, origin: string) {
    this.browser = browser;
    this.server = server;
    this.origin = origin;
  }

  /** Serves `dist` and starts Chromium. */
  static async open(dist: string): Promise<Session> {
    let browser: Browser;
    try {
      browser = await chromium.launch({ headless: true });
    } catch (error) {
      if (error instanceof Error && /Executable doesn't exist|browserType\.launch.*install/s.test(error.message)) {
        throw new BrowserMissingError(error.message);
      }
      throw error;
    }
    try {
      const { server, origin } = await serve(dist);
      return new Session(browser, server, origin);
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.browser.close();
    await new Promise<void>((done) => this.server.close(() => done()));
  }

  /** Loads `path` in a fresh context and records it, clicking every control when `click` is set. */
  async visit(path: string, { host, click }: VisitOptions): Promise<Visit> {
    const { origin } = this;
    const context = await this.browser.newContext({ viewport: VIEWPORT, serviceWorkers: 'block' });
    const visit: Visit = { path, posted: [], departures: [], outbound: [], cookieAsks: [], routes: [], text: '', rootMarked: false, unclicked: 0 };
    const routes = new Set<string>();
    let trigger: Trigger = `the load of ${path}`;
    let quietSince = Date.now();
    let ready = false;
    let blockedByCsp: string | undefined;
    let page: Page | undefined;

    const fromPage = (source: { page: Page; frame: unknown }) => source.page === page && source.frame === page.mainFrame();
    await context.exposeBinding(BINDING, (source, kind: string, payload: string) => {
      if (!fromPage(source)) return;
      quietSince = Date.now();
      if (kind === 'ready') ready = true;
      if (kind === 'post') visit.posted.push(posted(payload));
      if (kind === 'csp') {
        const { directive, blocked } = JSON.parse(payload) as { directive: string; blocked: string };
        blockedByCsp ??= `the production CSP blocked ${blocked || 'a script'} (${directive}) during ${trigger}, so the page does not run as it would in production`;
      }
      if (kind === 'cookies') {
        const { url, how } = JSON.parse(payload) as { url: string; how: CookieAsk['how'] };
        visit.cookieAsks.push({ url, how, trigger });
      }
    });
    await context.addInitScript(INSTRUMENT);
    if (host) await context.addInitScript(hostScript());
    await context.clock.setFixedTime(FIXED_TIME);
    await context.route('**/*', async (route) => {
      const request = route.request();
      quietSince = Date.now();
      const url = new URL(request.url());
      if (url.origin === origin) {
        if (request.isNavigationRequest()) routes.add(url.pathname);
        return route.continue();
      }
      const via = request.isNavigationRequest() ? leaves(request, page) : undefined;
      if (via) {
        visit.departures.push({ url: request.url(), via, trigger });
        return route.fulfill({ status: 204 });
      }
      if (BACKEND_TYPES.has(request.resourceType())) {
        visit.outbound.push({ url: request.url(), method: request.method(), headers: setByPage(request.headers()), trigger });
      }
      return route.abort('blockedbyclient');
    });

    const settle = async () => {
      const start = Date.now();
      while (Date.now() - start < SETTLE_MAX_MS && Date.now() - quietSince < QUIET_MS) {
        await new Promise((done) => setTimeout(done, 25));
      }
      if (blockedByCsp) throw new RunnerError(blockedByCsp);
    };
    const load = async () => {
      quietSince = Date.now();
      await page!.goto(`${origin}${path}`, { waitUntil: 'load', timeout: LOAD_TIMEOUT_MS });
      await settle();
    };

    try {
      page = await context.newPage();
      await load();
      if (!ready) throw new RunnerError(`the runner's instrumentation did not start in ${path}`);
      visit.text = await page.evaluate(() => document.body?.innerText ?? '');
      if (!host) visit.rootMarked = await page.evaluate(() => document.documentElement.hasAttribute('data-sv-chrome'));
      if (click) {
        for (let index = 0; ; index++) {
          const targets = page.locator(CLICKABLE);
          const count = await targets.count();
          if (index >= count) break;
          if (index >= MAX_CLICKS) {
            visit.unclicked = count - index;
            break;
          }
          await linkedRoutes(page, origin, routes);
          const target = targets.nth(index);
          if (!(await target.isVisible()) || !(await target.isEnabled())) continue;
          trigger = `a click on ${await describe(target)} in ${path}`;
          quietSince = Date.now();
          await target.click({ timeout: CLICK_TIMEOUT_MS }).catch(() => {});
          await settle();
          for (const other of context.pages()) if (other !== page) await other.close();
          const now = new URL(page.url());
          if (now.origin !== origin || `${now.pathname}${now.search}` !== path) {
            if (now.origin === origin) routes.add(now.pathname);
            trigger = `the load of ${path}`;
            await load();
          }
        }
      }
      await linkedRoutes(page, origin, routes);
      visit.routes = [...routes];
      return visit;
    } finally {
      await context.close();
    }
  }
}

function posted(raw: string): Posted {
  const message = parseMessage(raw);
  return message ? { method: message.method, params: message.params } : { method: '?', params: raw };
}

/**
 * How a top-level navigation leaves the page: in the page itself or in a popup.
 * A popup's first navigation is issued before its frame exists, so Playwright
 * has no frame for it. A frame inside the page is not leaving it.
 */
function leaves(request: Request, page: Page | undefined): Departure['via'] | undefined {
  let frame;
  try {
    frame = request.frame();
  } catch {
    return 'popup';
  }
  if (frame.parentFrame() !== null) return undefined;
  return frame.page() === page ? 'navigation' : 'popup';
}

/** The headers a preflight would name: the page's own, not the browser's, and a content type CORS does not allow as is. */
function setByPage(headers: Record<string, string>): string[] {
  return Object.entries(headers)
    .filter(([name, value]) => {
      if (name === 'content-type') return !SIMPLE_CONTENT_TYPES.has(value.split(';')[0]!.trim().toLowerCase());
      return !BROWSER_HEADERS.has(name) && !name.startsWith('sec-');
    })
    .map(([name]) => name)
    .sort();
}

/** Adds the same-origin paths of every `<a href>` on the page, a file other than a page aside. */
async function linkedRoutes(page: Page, origin: string, routes: Set<string>): Promise<void> {
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((a) => (a as HTMLAnchorElement).href));
  for (const href of hrefs) {
    const url = new URL(href);
    if (url.origin === origin && !/\.(?!html?$)[a-z0-9]+$/i.test(url.pathname)) routes.add(url.pathname);
  }
}

async function describe(target: Locator): Promise<string> {
  return target.evaluate((element) => {
    const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `<${element.tagName.toLowerCase()}>${text ? ` "${text}"` : ''}`;
  });
}

/** Opens a session on `dist`, runs `work`, and closes it whatever happens. */
export async function withSession<T>(dist: string, work: (session: Session) => Promise<T>): Promise<T> {
  const session = await Session.open(dist);
  try {
    return await work(session);
  } finally {
    await session.close();
  }
}

export interface Crawl {
  /** One visit with the host per route, clicking every control, from `/` outward. */
  visits: Visit[];
  /** Every same-origin route found, visited or not. */
  routes: string[];
}

/** Visits `/` with the host, then every route it reaches, up to `MAX_ROUTES`. */
export async function crawl(session: Session): Promise<Crawl> {
  const routes = ['/'];
  const visits: Visit[] = [];
  for (let next = 0; next < routes.length && visits.length < MAX_ROUTES; next++) {
    const visit = await session.visit(routes[next]!, { host: true, click: true });
    visits.push(visit);
    for (const route of visit.routes) if (!routes.includes(route)) routes.push(route);
  }
  return { visits, routes };
}
