---
title: "@skkuverse/miniapp/game BootOptions (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: BootOptions

The client a game page boots through: `bootGame` finds the host, says
`game.ready`, waits for `game.init`, reports the run and hands the host's
events to the page. It imports no package, so a game's bundle carries
nothing beyond this SDK's own code.

`installPageGuard` is what `bootGame` installs first; the parts are exported
for a game that guards a field of its own on top.

## Properties

### pollMs?

> `optional` **pollMs?**: `number`

Defaults to `HOST_POLL_MS`.

***

### slowPollMs?

> `optional` **slowPollMs?**: `number`

Defaults to `HOST_SLOW_POLL_MS`.

***

### waitMs?

> `optional` **waitMs?**: `number`

Defaults to `HOST_WAIT_MS`.
