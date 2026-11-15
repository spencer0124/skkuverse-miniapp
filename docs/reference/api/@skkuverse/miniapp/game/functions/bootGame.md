---
title: "@skkuverse/miniapp/game bootGame (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: bootGame()

> **bootGame**(`handlers`, `options?`): [`GameClient`](../interfaces/GameClient.md)

Boot a game page. Call it first in the page's entry.

In order: installs the page guard, subscribes to the host's events, then
looks for the host and sends `game.ready` once it is there. It looks every
`pollMs` for `waitMs`, then calls `onNoHost`, then keeps looking every
`slowPollMs` and on `load` and `pageshow` until the host appears: Android
can run the host's first bootstrap on a document it then replaces, and the
host injects it again once loading ends, which on a slow network can be
well after `waitMs`. A host that grants no game method ends the search. A
run may start only after `game.init`.

It installs no visibility or focus handler: pausing is the host's call. A
page that wants to know how often it was hidden counts it for telemetry.

## Parameters

### handlers

[`GameHandlers`](../interfaces/GameHandlers.md)

### options?

[`BootOptions`](../interfaces/BootOptions.md) = `{}`

## Returns

[`GameClient`](../interfaces/GameClient.md)
