---
title: Miniapp Platform Architecture
type: explanation
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-26
audience: public
---

# Miniapp platform architecture

> How a skkuverse miniapp, this repository, the app and the server fit together, and why each piece sits where it does. Read it before changing the protocol, the shell or the SDK.

## Context

A miniapp is a small web app, built with Vite and React, that runs inside the skkuverse app. Each one lives in its own repository (`spencer0124/miniapp-<name>`) and deploys to Cloudflare Pages at `https://<name>.mini.skkuverse.com`. The app opens it in a `react-native-webview` screen called the mini-app shell.

Three things used to be copied into every miniapp: the design system, the bridge message types and a file of bridge helpers. By the sixth miniapp the copies had drifted. This repository replaced them with three npm packages ([ADR 0001](../decisions/0001-sdk-distribution.md)). It then gave the channel a proper contract: request/response messages, a declared shell and injected safe areas ([ADR 0002](../decisions/0002-miniapp-protocol-shell-viewport.md)).

## Structure

```text
 skkuverse-miniapp (this repo)                 npm
 ┌───────────────────────────────┐      ┌──────────────────────┐
 │ packages/tokens  ──────────── │ ───▶ │ @skkuverse/tokens    │
 │ packages/ui      ──────────── │ ───▶ │ @skkuverse/ui        │
 │ packages/miniapp              │ ───▶ │ @skkuverse/miniapp   │
 │   protocol/  (the contract)   │      └──────────┬───────────┘
 │   sdk/, react/                │                 │
 └───────────────────────────────┘                 │ imported by
                                                   ▼
   miniapp-<name>          skkuverse-app                 skkuverse-server
   (a page)                (the host)                    (the registry)
 ┌──────────────────┐   ┌──────────────────────────┐   ┌───────────────────────┐
 │ <MiniappRoot>    │   │ app/mini-app.tsx         │   │ GET /miniapps/:id     │
 │ SDK calls ───────┼──▶│ parseMessage → dispatch  │   │ registry details      │
 │                  │◀──┼─ hostDeliverScript       │◀──┤ + page's manifest     │
 │ public/          │   │ hostBootstrapScript      │   │   (shell merged)      │
 │  skkuverse.json ─┼───┼──────────────────────────┼──▶│ fetched every 5 min   │
 └──────────────────┘   └──────────────────────────┘   └───────────────────────┘
```

| Piece | Owns | Lives in |
| --- | --- | --- |
| `@skkuverse/tokens` | Colours, type, spacing and radius, hash-checked copies of the app's token files | `packages/tokens` |
| `@skkuverse/ui` | The web port of the SKKU Design System | `packages/ui` |
| `@skkuverse/miniapp/protocol` | The wire contract: messages, parser, shell manifest, viewport, and the scripts the app injects | `packages/miniapp/src/protocol` |
| `@skkuverse/miniapp` | The page-side SDK: every function safe to call anywhere | `packages/miniapp/src/sdk`, `transport.ts` |
| `@skkuverse/miniapp/react` | `MiniappRoot` and hooks | `packages/miniapp/src/react` |
| `@skkuverse/miniapp/react/ui` | SDS-styled components such as `MapButton` | `packages/miniapp/src/react/ui` |
| Mini-app shell | Injection, the message dispatcher, chrome and viewport | skkuverse-app `apps/mobile/app/mini-app.tsx` |
| Registry | Identity, start URL, and the merged shell | skkuverse-server `src/miniapps` |

### A page's life in the app

1. The app reads `GET /miniapps/:id`. The server has already merged the page's own `public/skkuverse.json` into `shell`, so the app knows the bar, the header style and the background colour before it creates a WebView.
2. Before any page script runs, the app injects `hostBootstrapScript`. It defines a frozen `window.skkuverse` with the granted methods, the current viewport and `receive`, and sets the `--sv-*` CSS variables on `<html>`.
3. The page renders inside `MiniappRoot`, which sees `window.skkuverse` and renders the miniapp rather than the browser gate.
4. SDK calls post JSON through `window.ReactNativeWebView`. The app parses each message with `parseMessage`, checks the sending page's origin against `BRIDGE_ORIGINS` on every message, and dispatches it.
5. The app answers requests and sends events through `hostDeliverScript`, which re-checks `location.origin` before calling `receive`. When insets or the shell change, it sends `viewport.changed`, and `receive` updates the CSS variables before the SDK hears about it.

### Outside the app

Opened in a plain browser, the page finds no `window.skkuverse`. `MiniappRoot` renders a full-screen "open in the skkuverse app" page linking to the universal link `https://skkuverse.com/p/m/<id>`, unless the miniapp declares `browser="allow"`. SDK functions still work: each one becomes a no-op or a browser fallback.

## Rationale and trade-offs

**The contract is a module, not a copy.** `packages/miniapp/src/protocol` has no DOM, no React and no dependencies, so the app imports the same parser and injection scripts the SDK was tested against. The server is the exception. It is CommonJS and the package is ESM-only, so it keeps a copy of the manifest parser, pinned by mirrored tests.

**The app injects its runtime.** What `receive` does and which CSS variables exist are defined in `host.ts`, beside the types. The app only chooses the values. Because the object is frozen before the page runs, a page cannot replace or wrap the channel.

**Safe areas are injected, not read from `env()`.** `env(safe-area-inset-*)` reads zero on recent Android WebViews, and on iOS it doubles up when the scroll view also insets. It also cannot know about the app's own bar. The app knows all three, so it reports them in two layers: the device's safe area and the part its own UI covers.

**The shell is declared by the page and delivered by the server.** Declaring it at runtime would make the first frame wrong and then jump. Declaring it in the registry would put a design decision in the wrong repository. The manifest keeps the decision with the page. The server merge makes it available before first paint, and `shell.set` covers changes during a session.

**Blocking browsers is the default, and it is presentation.** A miniapp is shared outside the app only when someone decided it should be, so the default is to block. The gate does not protect anything, because the page's HTML and JavaScript are public by nature. Anything that must not be reachable from a browser needs a server check.

**Grants follow the origin of each message.** A page can navigate. Checking the sender's origin per message, rather than once at open, keeps a grant from following the WebView to another site. On Android an embedded iframe reports the top document's URL, so miniapps must not embed third-party iframes.

## Related

- [protocol](../reference/protocol.md) — the contract in detail
- [0001-sdk-distribution](../decisions/0001-sdk-distribution.md) — why npm packages
- [0002-miniapp-protocol-shell-viewport](../decisions/0002-miniapp-protocol-shell-viewport.md) — why this protocol, manifest and viewport
- [create-a-miniapp](../how-to/create-a-miniapp.md) — building one end to end
