/**
 * The page never leaves 127.0.0.1. A navigation to another origin is answered
 * 204, which a browser treats as "stay on the current document", and every
 * other request to another origin is aborted, so a click on a button that
 * writes to a backend writes nothing. The clock is pinned and `Math.random`
 * seeded so two loads of one URL render the same, which N2 relies on.
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

type Trigger = string;

export interface Departure {
  url: string;
  via: 'navigation' | 'popup';
  trigger: Trigger;
}

export interface Outbound {
  url: string;
  method: string;
  preflightHeaders: string[];
  trigger: Trigger;
}

export interface CookieAsk {
  url: string;
  how: 'credentials' | 'cookie-header';
  trigger: Trigger;
}

export interface Visit {
  path: string;
  posted: Posted[];
  departures: Departure[];
  outbound: Outbound[];
  cookieAsks: CookieAsk[];
  routes: string[];
  text: string;
  /** Read only on a visit with no host, where only `<MiniappRoot>` sets the attribute. */
  rootMarked: boolean;
  unclicked: number;
}

export interface VisitOptions {
  host: boolean;
  click: boolean;
}

const BINDING = '__miniappContract';
const CLICKABLE = 'a[href], button, [role="button"], input[type="button"], input[type="submit"]';
export const MAX_CLICKS = 50;
export const MAX_ROUTES = 20;
const QUIET_MS = 150;
const SETTLE_MAX_MS = 3_000;
const CLICK_TIMEOUT_MS = 1_500;
const LOAD_TIMEOUT_MS = 15_000;
/** The pinned clock: any fixed instant works, as long as every load sees the same one. */
const FIXED_TIME = Date.UTC(2026, 2, 2, 3, 0, 0);
/** The iPhone the `granted` preset's viewport was measured on. */
const VIEWPORT = { width: 390, height: 844 };
/** A stylesheet, font or image from a CDN is not a backend call, so N4 leaves it alone. */
const BACKEND_TYPES = new Set(['fetch', 'xhr', 'eventsource']);
const NO_PREFLIGHT_HEADERS = new Set(['accept', 'accept-language', 'content-language', 'range', 'user-agent', 'referer', 'origin', 'cookie', 'host', 'connection', 'accept-encoding']);
const SIMPLE_CONTENT_TYPES = new Set(['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain']);

/**
 * Cookie asks are reported from inside the page because the routed request
 * cannot show them: Playwright's `Request` has no credentials mode, and the
 * browser silently drops a `Cookie` header the page sets.
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

export class RunnerError extends Error {}

export class BrowserMissingError extends RunnerError {}

export class Session {
  private readonly browser: Browser;
  private readonly server: Server;
  readonly origin: string;

  private constructor(browser: Browser, server: Server, origin: string) {
    this.browser = browser;
    this.server = server;
    this.origin = origin;
  }

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
        visit.outbound.push({ url: request.url(), method: request.method(), preflightHeaders: preflightHeaders(request.headers()), trigger });
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

/** Playwright's `request.frame()` throws for a popup's first navigation, which is issued before the popup's frame exists. */
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

function preflightHeaders(headers: Record<string, string>): string[] {
  return Object.entries(headers)
    .filter(([name, value]) => {
      if (name === 'content-type') return !SIMPLE_CONTENT_TYPES.has(value.split(';')[0]!.trim().toLowerCase());
      return !NO_PREFLIGHT_HEADERS.has(name) && !name.startsWith('sec-');
    })
    .map(([name]) => name)
    .sort();
}

/** A path with no extension, or an `.html` one: a route rather than a file such as `/report.pdf`. */
const isPage = (pathname: string) => !/\.(?!html?$)[a-z0-9]+$/i.test(pathname);

async function linkedRoutes(page: Page, origin: string, routes: Set<string>): Promise<void> {
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((a) => (a as HTMLAnchorElement).href));
  for (const href of hrefs) {
    const url = new URL(href);
    if (url.origin === origin && isPage(url.pathname)) routes.add(url.pathname);
  }
}

async function describe(target: Locator): Promise<string> {
  return target.evaluate((element) => {
    const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `<${element.tagName.toLowerCase()}>${text ? ` "${text}"` : ''}`;
  });
}

export async function withSession<T>(dist: string, work: (session: Session) => Promise<T>): Promise<T> {
  const session = await Session.open(dist);
  try {
    return await work(session);
  } finally {
    await session.close();
  }
}

export interface Crawl {
  visits: Visit[];
  routes: string[];
}

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
