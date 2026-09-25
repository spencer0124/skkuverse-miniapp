---
title: A Dedicated Miniapp Protocol, Shell Manifest and Injected Viewport
type: adr
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-26
audience: public
---

# ADR 0002 — A dedicated miniapp protocol, shell manifest and injected viewport

> In 0.2.0 the miniapp channel stopped reusing the app's v1 messages. It has its own request/response protocol, a shell each miniapp declares for itself, and safe-area values the app injects.

## Status

accepted (2026-09-25)

## Context

`@skkuverse/miniapp` 0.1.0 carried the app's first-party bridge over unchanged. That was fire-and-forget `{ type }` messages, with capabilities guessed from `window.ReactNativeWebView` and a `bridge.actions` list. Three needs did not fit.

1. **Nothing could answer.** Rewarded ads, sign-in and launch tokens all need a response, and v1 had no request ids.
2. **Pages could not lay themselves out.** The app never told a page its safe area. `env(safe-area-inset-*)` reads zero on recent Android WebViews and doubles up on iOS when the scroll view insets as well. The app also reserved a hard-coded 66 px for its bottom bar with `contentInset`.
3. **The shell belonged to the wrong repository.** The server registry's `shell.bar` decided how each page was framed, so a design change in a miniapp needed a server release. The header was always opaque, so no page could paint up to the top of the screen.

Nothing built on the miniapp channel had been released to users yet, so the design did not need backward compatibility.

## Decision

**One envelope for everything.** Page to app is a notification `{ method, params }` or a request `{ id, method, params }`. App to page is a response `{ id, ok, result | error }` or an event `{ event, data }`. Methods are named `<namespace>.<verb>`, and adding one is an entry in `messages.ts`, not an envelope change. The request channel ships and is tested before any request method exists.

**The app owns the runtime it injects.** `hostBootstrapScript` defines a frozen `window.skkuverse` before the page's script runs. It contains `protocol`, `capabilities`, `getViewport` and `receive`. The script is built in `protocol/host.ts`, and the app only supplies the values. `hostDeliverScript` re-checks the page origin before every delivery.

**Safe areas come in two injected layers.** `safeArea` is what the device covers. `contentSafeArea` is what the app's own header and bars cover. `chrome` says whether that UI is glass or opaque. The app sets them as `--sv-safe-*`, `--sv-content-*` and `--sv-inset-*` CSS variables, and keeps them current with `viewport.changed`. Outside the app, `MiniappRoot` sets the safe layer to `env()` and the content layer to zero.

**Each miniapp declares its shell in `public/skkuverse.json`.** The shell has `bar`, `header`, `statusBar` and `background`. skkuverse-server fetches the manifest of each first-party miniapp and merges it into `GET /miniapps/:id`, after the default and the registry entry. The registry keeps identity, and the manifest can change presentation only. `shell.set` changes the presentation fields mid-session. `bar` changes the layout, so it stays manifest-only.

**`MiniappRoot` blocks plain browsers by default.** A miniapp renders inside it, and the SDK hooks throw outside it. It shows an "open in the skkuverse app" page unless the miniapp writes `browser="allow"`.

## Consequences

- ✅ **The next feature is an entry, not a protocol change.** Ads, sign-in and anything else that answers back fit the existing request channel.
- ✅ **Layout works everywhere.** Pages lay out correctly on iOS and Android, under an opaque or a glass header, with one CSS variable.
- ✅ **Design stays with the miniapp.** A miniapp changes its own framing with one line in its own repository, and the first frame is already right.
- ⚠️ **The protocol, the app and the miniapps must ship in order.** A miniapp on 0.2.x inside an app without the new shell finds no `window.skkuverse` and shows the browser gate. The app's OTA ships before any miniapp is merged to production.
- ⚠️ **Old pages lose their buttons.** Pages still sending v1 `web:*` messages get no response in the mini-app shell. The app's generic `/webview` screen keeps v1 for skkuverse-web.
- ⚠️ **A manifest change takes up to about ten minutes to reach users.** The delay is the server's five-minute cache plus the registry's five-minute response cache.
- ⚠️ **The server keeps a copy of the manifest parser.** The server is CommonJS and the package is ESM-only. The copy is pinned by tests that mirror this repository's vectors.

## Alternatives considered

**Keep v1 and add v2 beside it.** Rejected. Since nothing was released, the compatibility layer would have protected no one and cost a second message format in every parser.

**Let the page declare its shell at runtime only.** Rejected. The app would draw a default frame first and then jump once the page's script ran. Runtime changes remain available through `shell.set`.

**Rely on `env(safe-area-inset-*)`.** Rejected. It reads zero on Android WebView 138 and later. It knows nothing about the app's own UI, and it doubles up with scroll-view insets on iOS.

## Related

- [protocol](../reference/protocol.md) — the resulting contract
- [architecture](../explanation/architecture.md) — how the pieces fit
- [0001-sdk-distribution](0001-sdk-distribution.md) — the packaging this builds on
