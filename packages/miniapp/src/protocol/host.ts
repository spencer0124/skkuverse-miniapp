import { MESSAGE_EVENT, PROTOCOL_VERSION, type HostMessage } from './messages';
import { viewportCssVars, type Viewport } from './viewport';

/**
 * The object the app puts on `window.skkuverse` before the page's own script
 * runs. Its presence is what "inside the app" means.
 */
export interface HostGlobal {
  protocol: number;
  /** Method names this app grants this page. */
  capabilities: readonly string[];
  /** The current viewport; a fresh copy each call. */
  getViewport(): Viewport;
  /**
   * App → page delivery. The app calls it through `injectJavaScript` with a
   * JSON-encoded `HostMessage`. It updates the viewport and the CSS variables on
   * `viewport.changed`, then dispatches `MESSAGE_EVENT` on `window` with the
   * message as `detail`.
   */
  receive(json: string): void;
}

// Built from char codes: written literally, either one ends a line in source.
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

/**
 * JSON for embedding in a script: `JSON.stringify` leaves U+2028 and U+2029
 * unescaped, and older engines end a string literal on them.
 */
function embed(value: unknown): string {
  return JSON.stringify(value).split(LINE_SEPARATOR).join('\\u2028').split(PARAGRAPH_SEPARATOR).join('\\u2029');
}

/**
 * The script the app injects before content loads
 * (`injectedJavaScriptBeforeContentLoaded`). It defines `window.skkuverse` and
 * applies the viewport's CSS variables as early as the document allows, so a
 * page's first paint already has them.
 *
 * Built here rather than in the app so that what `receive` does, and which CSS
 * variables exist, is defined in exactly one place next to the types.
 */
export function hostBootstrapScript(options: { capabilities: readonly string[]; viewport: Viewport }): string {
  const varNames = Object.keys(viewportCssVars(options.viewport));
  return `(function () {
  if (window.skkuverse) return;
  var caps = Object.freeze(${embed(options.capabilities)});
  var vp = ${embed(options.viewport)};
  var names = ${embed(varNames)};
  function cssVars(v) {
    var out = {}, edges = ['top', 'bottom', 'left', 'right'];
    for (var i = 0; i < edges.length; i++) {
      var e = edges[i], s = v.safeArea[e], c = v.contentSafeArea[e];
      out['--sv-safe-' + e] = s + 'px';
      out['--sv-content-' + e] = c + 'px';
      out['--sv-inset-' + e] = (s + c) + 'px';
    }
    return out;
  }
  function apply() {
    var root = document.documentElement;
    if (!root) return false;
    var vars = cssVars(vp);
    for (var i = 0; i < names.length; i++) root.style.setProperty(names[i], vars[names[i]]);
    root.setAttribute('data-sv-chrome', vp.chrome);
    return true;
  }
  if (!apply()) {
    var mo = new MutationObserver(function () { if (apply()) mo.disconnect(); });
    mo.observe(document, { childList: true });
  }
  var host = Object.freeze({
    protocol: ${PROTOCOL_VERSION},
    capabilities: caps,
    getViewport: function () { return JSON.parse(JSON.stringify(vp)); },
    receive: function (json) {
      var msg;
      try { msg = JSON.parse(json); } catch (e) { return; }
      if (!msg || typeof msg !== 'object') return;
      if (msg.event === 'viewport.changed' && msg.data) { vp = msg.data; apply(); }
      window.dispatchEvent(new CustomEvent(${embed(MESSAGE_EVENT)}, { detail: msg }));
    }
  });
  Object.defineProperty(window, 'skkuverse', { value: host, writable: false, configurable: false });
})();
true;`;
}

/**
 * The script that delivers one message to the page (`injectJavaScript`). It
 * checks the page is still on `origin` first: the WebView may have navigated
 * since the request arrived, and a response must never reach another site.
 */
export function hostDeliverScript(origin: string, message: HostMessage): string {
  return `(function () {
  if (location.origin !== ${embed(origin)}) return;
  var host = window.skkuverse;
  if (host && typeof host.receive === 'function') host.receive(${embed(JSON.stringify(message))});
})();
true;`;
}
