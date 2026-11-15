---
title: Miniapp Contracts Run in a Real Browser
type: adr
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-16
audience: public
---

# ADR 0004. Miniapp contracts run in a real browser

> `@skkuverse/miniapp-contract` judges the spec's runtime rules N1 to N4 by loading a built miniapp in Chromium through Playwright. The game contract stays on happy-dom. For anyone changing either runner, or adding a rule about what a page does rather than what its files say.

## Status

accepted (2026-11-15)

## Context

`miniapp-cli check` reads a package's files. Four rules of the [miniapp spec](../reference/miniapp-spec.md) are about what the page does once it runs, so `check` cannot see them, and they were marked `review`:

- N1. Inside the app, the page leaves its origin only through `link.open`.
- N2. A debug switch read from the query string works only under `import.meta.env.DEV`.
- N3. Every user-facing route renders inside `<MiniappRoot>`.
- N4. A backend comes from a `VITE_*` value in `.env.production`, allows the miniapp's origin through CORS, and does not authenticate with cookies.

A rule left to review is a rule an agent cannot verify on its own work. Judging these four means running the page under the conditions it meets in production: the CSP `ship` deploys, the host the app injects, and real navigation.

The game contract already runs pages, in vitest with a happy-dom window. Its harness rejected a browser because a browser adds pixels and layout, not protocol coverage. That holds for games, whose contract is a sequence of `game.*` messages. It does not hold here. happy-dom 21.0.4 ran an inline script under a `script-src 'self'` policy and dispatched no `securitypolicyviolation` event (measured on 2026-11-15). Under happy-dom a page that the production CSP would stop runs anyway, and the rules would be judged on a page that production never shows. happy-dom also has no top-level navigation, no popups and no request interception, which N1 and N4 are about.

## Decision

**A new package runs the four rules in Chromium.** `@skkuverse/miniapp-contract` depends on `playwright` at an exact version and drives its headless Chromium. Each run serves `dist/` on 127.0.0.1 with the `_headers` and `_redirects` that `ship` writes, imported from `@skkuverse/miniapp-cli/platform` so the CSP has one owner. Before the page's own script, each load gets the app's real `hostBootstrapScript` with the `granted` preset and a `ReactNativeWebView` that records every post.

**Each rule is judged from what the page did.**

- N1. The runner clicks every link and button in DOM order on each same-origin route it reaches. A navigation or popup to another origin with no `link.open` post for that URL fails.
- N2. The runner finds each query key the production bundle names in `.get`, `.getAll` or `.has`, and loads the page with each one set. Other visible text, other host messages or other request addresses than the plain load fails.
- N3. Outside the app, `<MiniappRoot>` sets `data-sv-chrome` on `<html>`, whether it shows the page or the browser gate. The runner loads each route with no host. A route that leaves the attribute unset renders outside `<MiniappRoot>`, and fails unless `deploy.config.json` lists it in `operatorPaths`. A route is a path with no file extension, or an `.html` one, so a link to `/rules.txt` is not a route.
- N4. The runner records each fetch, XHR, EventSource and WebSocket to another origin. An origin that no `VITE_*` value names fails, and a request that asks for cookies fails. For each named backend, the runner asks what a browser on the production origin asks. A request that needs a preflight, by the Fetch standard's rule (a method other than `GET`, `HEAD` or `POST`, or a header CORS does not allow by default), gets the preflight. A simple `GET` or `HEAD` is sent as itself with the production `Origin`, because a browser sends no preflight for it and judges CORS on its answer. A simple `POST` is not sent, because that would be the write, and the run prints a `warn` line for it.

**A config field never silences a rule without a trace.** `operatorPaths` and `queryParams` are declared and validated in the one `deploy.config.json` parser, `@skkuverse/miniapp-cli/config`, which `check`, `ship` and this runner share. A path must start with `/`, name a segment, hold no `*`, and be a pathname as a browser reports it, so `/a/../b` and a path with an unescaped non-ASCII character are refused. No entry can skip every route, and none is one that no route can match. `/admin` covers `/admin` and every route under `/admin/`, and not `/admin.html`, so a skip is never wider than the path written. The run prints a `warn` line for every path and key it skips.

**The page cannot reach anything.** A navigation to another origin gets an empty 204 answer, which keeps the page in place. Every other request to another origin is aborted, and every WebSocket the page opens is closed before it connects, through `context.routeWebSocket`, because `context.route` does not see WebSockets. A WebSocket a Worker opens escapes both, so each page load's browser context has its own proxy, a server inside the runner that refuses every connection, and only the served origin bypasses it. A refusal is blamed on the load whose proxy saw it. WebRTC sends STUN and TURN over UDP, which no HTTP proxy sees, so Chromium runs with `--force-webrtc-ip-handling-policy=disable_non_proxied_udp`: it sends WebRTC's UDP only through a proxy, and this one carries none. A page that sent 4 STUN and TURN packets to a local UDP server sent none with the flag (measured on 2026-11-16). Clicking every button writes nothing to a real backend. The only requests that leave the runner are its own CORS checks, sent from Node to the backends `.env.production` names: a preflight, or a simple `GET` or `HEAD` itself, to the exact production URL the page asked for, so a `GET` with side effects runs once in every run. The clock is pinned and `Math.random` is seeded, so N2 compares two loads that differ only in the query.

**Games stay on happy-dom.** The game contract keeps its harness. N1 and N2 apply to games too, and this runner does not judge a game.

## Consequences

- **N1 to N4 can become `checked` rules.** Each finding has the fields of `miniapp-cli check --json` and links to the spec heading that defines the rule. `CONTRACT_RULES` in `src/rules.ts` maps each rule to that heading, in the shape of the CLI's `RULE_SECTIONS`.
- **A run downloads a browser once.** On macOS arm64, Playwright 1.65.0's headless Chromium was a 100.1 MiB download, took 7.2 s and used 207 MiB of disk (measured on 2026-11-15). `miniapp-contract install` downloads it, and the package's test setup runs the same command, so CI needs no new step.
- **The download sits outside pnpm's `minimumReleaseAge`.** That setting holds back a `playwright` release for five days. The browser build that release names comes from Playwright's CDN when `install` runs, with no such delay of its own.
- **A page the production CSP blocks gets no verdict.** The runner exits 2 and names what the CSP blocked, rather than passing a page that does not run.
- **N4 needs the network for a page that calls a backend.** The CORS check goes to the real backend. When it cannot be reached, the runner exits 2 rather than guess.
- **Some causes stay out of reach.** A run passes a page it could not watch break a rule:
  - It clicks `<a href>`, `<button>`, `[role="button"]` and `<input>` buttons, so a `<div onClick>` is never clicked.
  - A load or click counts as settled after 150 ms with no request, message or DOM change, so a navigation a timer fires 1 s after a click is missed, and so is a query key read inside a 500 ms timer.
  - Routes are tracked by path, so a hash route such as `#/settings` is the route `/`, and a route reached only by typed input is never found.
  - N2 finds a key only in a literal `.get`, `.getAll` or `.has` call. A read through `Object.fromEntries(new URLSearchParams(location.search))` or a loop over the parameters is not found.
  - A connection the proxy refuses, such as a WebSocket from a Worker, gets a `warn` line and no verdict, whichever load, N2's and N3's included, made it. So does an `RTCPeerConnection`, whose ICE servers the line names when the page created it in its top frame. A beacon or an image to another origin is aborted and not judged.
  - A `Cookie` header that the browser adds from its own store never appears, because every request to another origin is stopped before it is sent.

## Alternatives considered

**Run N1 to N4 in happy-dom beside the game contract.** Rejected. happy-dom enforces no CSP and has no navigation or request interception, so the four rules would be judged on a page production never shows.

**Make the runner a subcommand of `miniapp-cli check`.** Rejected. Every user of `check` would install Playwright and a 100 MiB browser for rules that only some runs need. ADR 0003 kept the game contract out of the CLI for the same reason.

**Let backend requests reach the network.** Rejected. The runner clicks every button, and a button can write to a backend.

**Find a route outside `<MiniappRoot>` through React's internals.** Rejected. Component names do not survive a production build, and the attribute `<MiniappRoot>` already sets outside the app answers the question without them.

## Related

- [miniapp-spec](../reference/miniapp-spec.md): the rules N1 to N4
- [0003-spec-checker-in-this-repository](0003-spec-checker-in-this-repository.md): why the checker and the game contract are separate packages
- [protocol](../reference/protocol.md): the host, the presets and `link.open`
