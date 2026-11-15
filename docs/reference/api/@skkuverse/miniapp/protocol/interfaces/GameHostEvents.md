---
title: "@skkuverse/miniapp/protocol GameHostEvents (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: GameHostEvents

Events the host sends a game page. The page obeys every one.

## Extended by

- [`HostEvents`](HostEvents.md)

## Properties

### game.init

> **game.init**: [`GameInit`](GameInit.md)

***

### game.pause

> **game.pause**: `Record`\<`string`, `never`\>

Stop the run's clock and its audio.

***

### game.reset

> **game.reset**: `Record`\<`string`, `never`\>

Back to the title, with no run started: the player closed the result.

***

### game.restart

> **game.restart**: `Record`\<`string`, `never`\>

Start a new run straight away.

***

### game.resume

> **game.resume**: `Record`\<`string`, `never`\>

***

### game.revive

> **game.revive**: `Record`\<`string`, `never`\>

Continue the crashed run: sent only after a rewarded ad paid out.

***

### game.sound

> **game.sound**: `object`

The player's sound setting changed.

#### on

> **on**: `boolean`
