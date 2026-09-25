---
title: Miniapp Bridge Protocol
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-25
audience: public
---

# Miniapp bridge protocol

> The messages a miniapp page and the skkuverse app exchange, the rules both sides follow, and the reserved shape of what comes next. For anyone writing a miniapp or touching the app's WebView shell.

## Overview

A miniapp is a web page the app opens in a `react-native-webview`. The two talk over the
WebView's message channel and nothing else. This repository owns that channel's contract:
`packages/miniapp/src/protocol/v1.ts` is the source of truth, and the app
(`skkuverse-app/packages/bridge/src/types.ts`) and `skkuverse-web` hold byte copies of it
under the umbrella's `contracts/manifest.json`.

Pages never touch the channel directly. They call `@skkuverse/miniapp`, which is safe to
call anywhere: outside the app every function is a no-op or a browser fallback.

## Rules both sides follow

1. **A message may be dropped, silently.** An app build that predates a message type drops
   it, and so does an app that does not grant the page's origin. A page never waits on a v1
   message and never assumes one was handled.
2. **Detect features and don't guess versions.** A page asks `getCapabilities()` and offers what
   is listed. It never reads the user agent or an app version to decide.
3. **Grants follow the origin.** The app decides per message, from the URL of the document
   that posted it, against the server's `BRIDGE_ORIGINS`. A new miniapp host must be added
   there before any message from it is honoured.
4. **Change additively.** Existing message shapes never change meaning, and new fields are optional.
   An old app meets a new page every day, and a new app meets an old page just as often.

## v1: the wire format today

Page to app, `window.ReactNativeWebView.postMessage(JSON.stringify(msg))`:

| Message | SDK | Granted today |
| --- | --- | --- |
| `{ type: 'web:haptic', style }` | `haptic()` | yes |
| `{ type: 'web:open-url', url, appUrl? }` | `openUrl()`, `handleLinkClick()` | yes |
| `{ type: 'web:action', actionType: 'map', actionValue }` | `openMapPlace()` | yes, if `bridge.actions` lists `map` |
| `{ type: 'web:action', actionType: 'miniapp', actionValue }` | `openMiniapp()` | yes, if `bridge.actions` lists `miniapp` |
| `{ type: 'web:map-select', payload }` | `postToApp()` | yes (festival timetable) |
| `{ type: 'web:analytics', event, params? }` | `track()` | not yet |
| `{ type: 'web:ready' }` | `ready()` | not yet |
| `{ type: 'web:navigate', path }` | none | removed from the grant set, never honoured |

App to page: `AppToWebMessage` is declared but no app build sends any of it yet.

Before the page's own script runs, the app injects:

```js
window.skkuverse = { bridge: { actions: ['map', 'miniapp'] } };
```

`getCapabilities()` derives a v1 host's capabilities from two signals. The channel's presence
means `haptic` and `openUrl`, and each entry in `actions` means `action.<entry>`.

## v2: reserved

v1 cannot answer back. Rewarded ads, sign-in and launch tokens all need an answer, so v2
adds a request/response envelope on the same channel. The types are in
`packages/miniapp/src/protocol/v2.ts`. No host speaks it yet.

```ts
// page → app
{ v: 2, id: 'r1', method: 'ads.showRewarded', params: { placement: 'retry' } }
// app → page, exactly one per request
{ v: 2, id: 'r1', ok: true, result: { … } }
{ v: 2, id: 'r1', ok: false, error: { code: 'unsupported', message: '…' } }
// app → page, unsolicited
{ v: 2, event: 'theme', data: { theme: 'dark' } }
```

- **Coexistence.** A v2 message has `v` and no `type`, so a v1 host's parser drops it. A page
  therefore sends v2 only after `getCapabilities()` reports protocol 2.
- **App to page.** The SDK installs `window.skkuverse.bridge.receive(json)`. The app calls it
  through `injectJavaScript`, re-checking the page's origin immediately before each call so a
  navigation cannot redirect a response to another site.
- **Advertising.** A v2 host adds `protocol: 2` and `capabilities: string[]` to the object it
  already injects. `getCapabilities()` then returns those as they are.

### Reserved capabilities

| Capability | Meaning |
| --- | --- |
| `haptic`, `openUrl`, `action.map`, `action.miniapp` | v1 features, derivable today |
| `openUrl.appUrl` | the host honours `appUrl` (not derivable from v1 signals) |
| `ads.rewarded` | the host can show an AdMob rewarded ad |
| `auth.idToken` | the host can hand over a short-lived token naming the signed-in user |
| `launchToken` | the host opened this page with a launch token |

## Designs for the reserved capabilities

These are the intended flows, written down so the SDK's shape is fixed before the first host
implements any of them. One principle runs through all three: **the page never trusts
something the app told it.** Anything that grants value is confirmed by the server.

### Rewarded ads (`ads.rewarded`)

1. The page asks the miniapp's backend for a reward nonce, bound to the user and the reward.
2. The page calls `ads.showRewarded({ nonce })`. The app shows the AdMob rewarded ad with
   server-side verification enabled and `customData = nonce`.
3. When the ad completes, Google calls the backend's SSV callback. The backend verifies
   Google's signature against the published keys, checks `transaction_id` for replay, and
   marks the nonce rewarded.
4. The page asks the backend whether the nonce was rewarded. That answer is the only one it acts on.

The app's own response to `ads.showRewarded` is for the user experience only, such as closing
a spinner. A page that grants a reward on it can be fooled by anyone with a JavaScript console.

### Sign-in (`auth.idToken`)

1. The page calls `auth.getIdToken()`.
2. The app sends its Firebase ID token to the skkuverse server, which returns a token it
   signs itself (ES256, lifetime of 5 minutes or less, `aud` = the miniapp's origin, `sub` = the user).
3. The page forwards that token to its own backend, which verifies it against the server's
   JWKS and checks `aud`, then issues its own session.

The long-lived Firebase credential never enters the page. A token minted for one miniapp is
useless to another because of `aud`.

### Keeping a miniapp inside the app (`launchToken`)

A static page cannot be hidden from a browser: its HTML and JavaScript are public by nature,
and a user-agent check is one header away from being spoofed. The enforceable boundary is
the miniapp's data, not its shell.

1. When opening a miniapp, the app calls `POST /miniapps/:id/launch` and appends the result
   to `startUrl` as a fragment: `#lt=<token>`. A fragment never reaches a server log or a
   `Referer` header.
2. The SDK reads the token, removes it from the URL with `history.replaceState`, and keeps it
   in memory.
3. The miniapp's data APIs require it (short TTL, `aud` = the miniapp). Opened directly in a
   browser, the page loads but its data calls fail, and the page can say "open this in the
   skkuverse app" — a user-agent check is fine for that message, never for access.

## Related

- [0001-sdk-distribution](../decisions/0001-sdk-distribution.md) — why the SDK is an npm package and how it relates to the hosted-script plan
- `skkuverse-app/docs/decisions/0006-miniapp-webview-push-architecture.md` — the origin gate and the capability handshake
- `skkuverse/docs/decisions/0002-pull-based-config-contracts.md` — how the byte copies of `v1.ts` are kept honest
