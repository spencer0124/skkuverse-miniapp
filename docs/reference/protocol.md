---
title: Miniapp Bridge Protocol
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-10-21
audience: public
---

# Miniapp bridge protocol

> How a miniapp or game page and the skkuverse app talk, what shell the app draws around a page, and where a page may put its content. For anyone building a miniapp or a game, or changing the app's mini-app shell or game host.

## Overview

A miniapp is a web page the app opens in a `react-native-webview`. The two sides agree on three things, all defined in `packages/miniapp/src/protocol/`. That module has no DOM, no React and no dependencies, so the app and skkuverse-server import it from npm and nobody keeps a copy.

| Part | File | What it defines |
| --- | --- | --- |
| Messages | `messages.ts` | Notifications, requests, responses and events, and the parser the app runs on every message |
| Shell | `manifest.ts` | What a miniapp declares in `public/skkuverse.json`, and what `shell.set` may change |
| Viewport | `viewport.ts` | Safe-area insets and the `--sv-*` CSS variables |
| Host object | `host.ts` | `window.skkuverse`, and the two scripts the app injects |

Pages use the SDK, `@skkuverse/miniapp`, and never touch the channel directly. Every SDK function is safe outside the app: it is a no-op or a browser fallback. A game page is the same kind of page on its own origin, speaking the `game.*` methods through `@skkuverse/miniapp/game` ([Games](#games)).

The app's generic `/webview` screen, which hosts skkuverse-web, speaks the older `@skkuverse/bridge` message set. That is a separate channel and this document does not cover it.

## Rules both sides follow

1. **A notification has no answer.** A page never waits on one and never assumes one was handled.
2. **Detect features instead of guessing versions.** A page offers a feature only when `getCapabilities()` lists its method. It never reads a user agent or an app version to decide.
3. **Grants follow the origin and its kind.** The app decides per message, from the URL of the document that sent it: a miniapp origin against the server's `BRIDGE_ORIGINS`, which grants `NOTIFY_METHODS`, and a game origin against its own list, which grants `GAME_NOTIFY_METHODS`. The two lists share no method. The app answers a request it does not grant with `denied` or `unsupported`, and drops a notification.
4. **Parse everything.** The app runs `parseMessage` on every message. Anything malformed is dropped without a word.

## Messages

Page to app goes through `window.ReactNativeWebView.postMessage(JSON)`. App to page goes through `window.skkuverse.receive(JSON)`, which the app calls with `injectJavaScript`.

| Kind | Direction | Shape |
| --- | --- | --- |
| Notification | page → app | `{ method, params }` |
| Request | page → app | `{ id, method, params }`, answered by exactly one response |
| Response | app → page | `{ id, ok: true, result }` or `{ id, ok: false, error: { code, message } }` |
| Event | app → page | `{ event, data }` |

Error codes are `unsupported`, `denied`, `cancelled`, `timeout` and `failed`.

### Methods

These are a miniapp's methods, the ones `NOTIFY_METHODS` lists. A game's are under [Games](#games).

| Method | Kind | Params | SDK |
| --- | --- | --- | --- |
| `haptic.impact` | notification | `{ style: 'light' \| 'medium' \| 'heavy' }` | `haptic()` |
| `link.open` | notification | `{ url, appUrl? }` | `openUrl()`, `handleLinkClick()` |
| `map.openPlace` | notification | `{ place }` | `openMapPlace()` |
| `miniapp.open` | notification | `{ target }` | `openMiniapp()` |
| `share.open` | notification | `{ url, text? }` | `share()` |
| `analytics.track` | notification | `{ event, params? }` | `track()` |
| `app.ready` | notification | none | `ready()` |
| `shell.set` | notification | `ShellPatch` | `setShell()` |

No request method exists yet. The channel is implemented and tested, so the first request method is an entry in the table rather than a protocol change.

`link.open` tries `appUrl` first and falls back to `url` only when nothing on the device handles the scheme. An app that takes the scheme but ignores its path never reaches `url`: Instagram opens its home feed for `instagram://p/<shortcode>`. Leave `appUrl` off for a site whose https links its app already claims, Instagram included. The app hands the https address to the OS, which opens it in that app or in the browser.

`share()` works without the grant too: outside the app it opens the browser's share sheet (Web Share), and where there is none it copies `text` and `url` to the clipboard and resolves `'copied'`, which the page should say. Call it from a tap, since browsers allow both only inside a user gesture.

| Event | Data | SDK |
| --- | --- | --- |
| `viewport.changed` | `Viewport` | `onViewportChange()`, `useViewport()` |

### Adding a method

Adding a method means one entry here, one SDK wrapper and one handler in the app. See [add-a-bridge-method](../how-to/add-a-bridge-method.md). Anything that grants value, such as a reward or a ranking, must be confirmed by a server, never by an app response the page relays.

## The host object

Before the page's own script runs, the app injects `hostBootstrapScript({ capabilities, viewport })`. It defines:

```ts
window.skkuverse = Object.freeze({
  protocol: 1,             // envelope version, not a feature list
  capabilities: [...],     // method names this page may use
  getViewport(),           // current viewport, a fresh copy
  receive(json),           // app → page delivery
});
```

`receive` belongs to the app, not the SDK. On `viewport.changed` it updates its state and the CSS variables. Then it dispatches `skkuverse:message` on `window` with the message as `detail`, and the SDK listens for that event. Because the object is frozen, a page script cannot replace it.

The app delivers each message with `hostDeliverScript(origin, message)`. That script first checks `location.origin` against the page the request came from, so a response never reaches a page that has since navigated elsewhere.

## Shell

A miniapp declares the shell the app draws around it in `public/skkuverse.json`, which is served at `https://<id>.mini.skkuverse.com/skkuverse.json`:

```json
{ "shell": { "bar": "top", "header": "opaque", "statusBar": "dark", "background": "#FFFFFF" } }
```

| Field | Values | Default | Meaning |
| --- | --- | --- | --- |
| `bar` | `top`, `bottom`, `none` | `bottom` | Where the name pill goes: in the header, in a floating bottom bar with back and forward, or nowhere |
| `header` | `opaque`, `overlay` | `opaque` | Whether the page starts below a solid header, or at the top of the screen under a transparent one |
| `statusBar` | `dark`, `light` | `dark` | Status bar icon colour |
| `background` | `#RRGGBB` | `#FFFFFF` | Painted behind the page while it loads and on overscroll |

skkuverse-server fetches the manifest of every first-party miniapp and merges it into `GET /miniapps/:id`. The app therefore knows the shell before it creates the WebView, and the first frame is already right. The merge order is default, then the registry entry, then the manifest. The registry still owns identity: the start URL, the name and the verified badge. A manifest can only change presentation. A change takes up to about ten minutes to reach users, through the server's cache and then the response cache.

`shell.set` changes `header`, `statusBar` and `background` during a session, for example to go full-bleed for a game or switch to light icons over a dark scene. `bar` changes the layout, so only the manifest sets it.

Parsing is tolerant on both sides. An unknown key or a bad value falls back to the default, so a broken manifest never stops a miniapp from opening.

## Viewport and safe areas

The app tells the page where content may go, in CSS pixels relative to the WebView, in two layers:

- **`safeArea`**: the parts of the WebView the device itself covers, such as the status bar, a notch or the home indicator. An edge the WebView does not reach reads zero.
- **`contentSafeArea`**: the parts the app's own UI covers, such as an overlay header or the bottom bar.
- **`chrome`**: `glass` when that UI is translucent Liquid Glass (iOS 26 and later), `opaque` otherwise.

```text
 ┌──────────────────────────┐ ─┐
 │ status bar               │  │ safeArea.top          ┐
 ├──────────────────────────┤ ─┤                       │ --sv-inset-top
 │ ‹  header (overlay)   ⋯  │  │ contentSafeArea.top   ┘
 ├──────────────────────────┤ ─┘
 │                          │
 │   page content           │
 │                          │
 ├──────────────────────────┤ ─┐
 │ ‹  [ name pill ]  ›      │  │ contentSafeArea.bottom ┐
 ├──────────────────────────┤ ─┤                        │ --sv-inset-bottom
 │ home indicator           │  │ safeArea.bottom        ┘
 └──────────────────────────┘ ─┘
```

The app injects the values itself, as CSS variables on `<html>` and through `getViewport()`, and does not rely on `env(safe-area-inset-*)`. That CSS function reads zero on recent Android WebViews, and on iOS it doubles up when the scroll view also insets.

| Variable | Value |
| --- | --- |
| `--sv-safe-{top,bottom,left,right}` | `safeArea` |
| `--sv-content-{top,bottom,left,right}` | `contentSafeArea` |
| `--sv-inset-{top,bottom,left,right}` | their sum |
| `html[data-sv-chrome]` | `glass` or `opaque` |

Outside the app, `MiniappRoot` sets them to the browser's `env(safe-area-inset-*)` and the content layer to zero, so they are always defined and an allowed page still clears the notch in Safari.

Paint the background edge to edge and keep content inside `--sv-inset-*`. The CSS, the choice between an opaque and an overlay header, and checking the result in a desktop browser are in [lay-out-for-safe-areas](../how-to/lay-out-for-safe-areas.md).

## Games

A game is a page on its own origin, `https://<id>.game.skkuverse.com`, that the app hosts in its game screen rather than the mini-app shell. It shares this envelope, the host object and the viewport, and nothing that grants trust: the app grants a game origin `GAME_NOTIFY_METHODS` and nothing else, and grants a miniapp origin none of them. The app hosts games over this channel only, never the previous one (`window.__host` with `game:*` and `host:*` messages), and drops a message from it.

The page owns gameplay. The host owns everything a run is worth: the best score, revives, sign-in and the leaderboard. So the page reports what happened and the host tells it what to do next. A ranked score is validated by the server, never trusted from `game.over`.

### Game methods

All are notifications from the page.

| Method | Params | `GameClient` |
| --- | --- | --- |
| `game.ready` | `{ rect? }`: where the host may anchor its title | sent by `bootGame` |
| `game.start` | none | `start()` |
| `game.phase` | `{ phase: 'ready' \| 'running' \| 'paused' \| 'crashed' }` | `phase()` |
| `game.layout` | `{ rect }`: a rectangle the host draws over moved | `layout()` |
| `game.haptic` | `{ style }`: one of `GameHapticStyle`'s seven | `haptic()` |
| `game.over` | `{ score, ticks, hit, revives, revivesLeft, validator?, stats?, telemetry? }` | `over()` |

A rectangle is `{ x, y, width, height }` in CSS pixels, relative to the web view. `game.over` is rebuilt from its declared fields only, since its score is what gets submitted: `score`, `ticks`, `revives` and `revivesLeft` are safe non-negative integers, and `hit` is the game's own word for what ended the run, or `null`. `validator` is the version a ranked page was built for, `<gameId>@<n>`; the server accepts only versions it knows. `stats` are figures the result shows and `telemetry` is evidence for judging a score; neither is submitted. A malformed `rect` on `game.ready`, or a malformed `validator`, `stats` or `telemetry`, is dropped alone and the message kept. The limits are in `messages.ts`, and a test pins the largest `game.over` inside the message limit.

`game.haptic` is a game's one haptic channel. A miniapp's `haptic.impact` keeps its three styles.

### Game events

| Event | Data | Handler |
| --- | --- | --- |
| `game.init` | `{ gameProtocol, hi, sound }` | `onInit` |
| `game.pause`, `game.resume` | none | `onPause`, `onResume` |
| `game.sound` | `{ on }` | `onSound` |
| `game.reset` | none: back to the title, with no run started | `onReset` |
| `game.restart` | none: a new run straight away | `onRestart` |
| `game.revive` | none: continue the crashed run, sent only after a rewarded ad paid out | `onRevive` |

A page obeys every event. Pause stops the run's clock and its audio, sound off silences all of the page's audio, and reset returns to the title. A page never pauses or mutes itself on a visibility or focus change; it may count them as telemetry.

### Versions

`window.skkuverse.protocol` is the envelope's version, `PROTOCOL_VERSION`, shared with miniapps. The game methods have their own, `GAME_PROTOCOL`, which the host sends in `game.init` as `gameProtocol`. A page built for a newer game protocol than the host's leaves out what the host lacks rather than stopping:

```ts
bootGame({
  onInit(init) {
    useV2Feature = init.gameProtocol >= 2; // off on an older host, never an error
  },
});
```

The server's games registry can also hold a game back from a host that is too old (`minHostProtocol`), for a change a page cannot degrade around.

### Booting a game

```ts
import { bootGame } from '@skkuverse/miniapp/game';

const game = bootGame({
  onInit: ({ hi, sound }) => loop.ready(hi, sound),
  onPause: () => loop.pause(),
  onResume: () => loop.resume(),
  onSound: (on) => setSoundOn(on),
  onReset: () => loop.reset(),
  onRestart: () => loop.restart(),
  onRevive: () => loop.revive(),
  onAudioUnlock: unlockSound,
  onViewport: (viewport) => loop.fit(viewport),
});

loop.onRunStart = () => game.start();
loop.onCrash = (result) => game.over({ ...result, validator: 'wave-run@1' });
```

`bootGame` is the first thing a game's entry calls. In order, it:

1. Installs the page guard: an input event a script dispatched never reaches the game, the clipboard, drags, the long-press menu and an iOS pinch are blocked, and the clock, the dice, the timers and `requestAnimationFrame` are pinned. `window.skkuverse` needs no pin, because the bootstrap defines it non-writable.
2. Subscribes to the host's events.
3. Looks for the host until `window.skkuverse` and `window.ReactNativeWebView` both exist, every `HOST_POLL_MS` for up to `HOST_WAIT_MS` (`packages/miniapp/src/game/boot.ts`). Android can run the before-load bootstrap on a document it then replaces, and the host injects it again when loading ends. A host that never appears, or one that grants no game method, calls `onNoHost`, and the page shows nothing interactive.
4. Sends `game.ready`, with the rectangle from `rect()` when the page gives one.

Until `game.init` arrives, `start()` refuses and every other event is ignored, so no run starts before the host has spoken. `onAudioUnlock` runs on every press the player made, before the game hears it: iOS opens audio only inside a tap, and later presses wake a context the OS suspended.

A game reads its safe area the way a miniapp does. The host's bootstrap sets `--sv-inset-*` on `<html>` before the page's script runs, and updates them on `viewport.changed`, so CSS needs nothing from `bootGame`:

```css
#stage { position: fixed; inset: 0; padding: var(--sv-inset-top) var(--sv-inset-right) var(--sv-inset-bottom) var(--sv-inset-left); }
```

A canvas sized in script takes the same numbers from `onViewport`, once the host is found and then on every change.

### Testing a game

`@skkuverse/miniapp/testing` is for tests, never for a page:

- `createFakeHost()` stands in for the game host. It runs the real `hostBootstrapScript`, records what the page posts, answers `game.ready` with `game.init`, and sends events (`pause()`, `revive()` and the rest). It needs a `window`, from a browser, jsdom or a test's own stub. It runs the bootstrap with `new Function`, so it cannot run under the production game headers.
- `checkGameContract(host.log)` and `assertGameContract(host.log)` hold a page to the contract and name each rule it broke: `every-message-parses`, `first-message-ready` (`game.ready` comes first), `no-start-before-init`, `start-before-over`, and `one-over-per-run` (one `game.over` per run, and one more after each `game.revive`).
- `BOUND_FIXTURES` are the pinned bound points of the ranked games, which the games' bound tests and the server's validator tests both assert. They are also published as plain JSON, `@skkuverse/miniapp/fixtures/bounds.json`, for a CommonJS consumer: `require` it, or `import` it `with { type: 'json' }` from an ES module.

## Outside the app

`MiniappRoot` blocks a plain browser by default. It renders a full-screen "스꾸버스 앱에서 열기" page linking to `https://skkuverse.com/p/m/<id>`. <!-- conventions:allow-korean: the gate's button label, quoted as product copy --> That universal link opens the app when it is installed and shows the store links otherwise. A miniapp opts out with `browser="allow"`. On localhost and private addresses, or with `dev`, it never blocks and shows a small banner instead.

The gate is presentation, not protection. The page's HTML and JavaScript are public by nature. Anything that must not be reachable from a browser needs a server check.

## Related

- [architecture](../explanation/architecture.md): how the SDK, the app and the server fit together
- [0001-sdk-distribution](../decisions/0001-sdk-distribution.md): why this is an npm package
- [0002-miniapp-protocol-shell-viewport](../decisions/0002-miniapp-protocol-shell-viewport.md): why this protocol, manifest and viewport
- `skkuverse-app/docs/decisions/0006-miniapp-webview-push-architecture.md`: the origin gate
- `skkuverse-server/docs/reference/miniapps-api.md`: the registry and the manifest merge
