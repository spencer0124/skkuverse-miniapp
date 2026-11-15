---
title: "@skkuverse/miniapp/testing FakeHostOptions (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: FakeHostOptions

For tests, never for a page: a fake game host built on the app's real
bootstrap, the protocol contract every game keeps, and the pinned bound
points of the ranked games.

## Properties

### capabilities?

> `optional` **capabilities?**: readonly `string`[]

Granted methods. Defaults to `GAME_NOTIFY_METHODS`, what the app grants a game origin.

***

### init?

> `optional` **init?**: `false` \| `Partial`\<[`GameInit`](../../protocol/interfaces/GameInit.md)\>

Answer `game.ready` with `game.init`, on a microtask as the app's
delivery is asynchronous. Defaults to this SDK's `GAME_PROTOCOL`, a best
of 0 and sound on. `false` leaves `init()` to the test.

***

### viewport?

> `optional` **viewport?**: [`Viewport`](../../interfaces/Viewport.md)

Defaults to `ZERO_VIEWPORT`.
