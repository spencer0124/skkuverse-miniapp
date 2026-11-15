---
title: "@skkuverse/miniapp/protocol HostEvents (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: HostEvents

Events the app sends, keyed by name, valued by data.

## Extends

- [`GameHostEvents`](GameHostEvents.md)

## Properties

### game.init

> **game.init**: [`GameInit`](GameInit.md)

#### Inherited from

[`GameHostEvents`](GameHostEvents.md).[`game.init`](GameHostEvents.md#gameinit)

***

### game.pause

> **game.pause**: `Record`\<`string`, `never`\>

Stop the run's clock and its audio.

#### Inherited from

[`GameHostEvents`](GameHostEvents.md).[`game.pause`](GameHostEvents.md#gamepause)

***

### game.reset

> **game.reset**: `Record`\<`string`, `never`\>

Back to the title, with no run started: the player closed the result.

#### Inherited from

[`GameHostEvents`](GameHostEvents.md).[`game.reset`](GameHostEvents.md#gamereset)

***

### game.restart

> **game.restart**: `Record`\<`string`, `never`\>

Start a new run straight away.

#### Inherited from

[`GameHostEvents`](GameHostEvents.md).[`game.restart`](GameHostEvents.md#gamerestart)

***

### game.resume

> **game.resume**: `Record`\<`string`, `never`\>

#### Inherited from

[`GameHostEvents`](GameHostEvents.md).[`game.resume`](GameHostEvents.md#gameresume)

***

### game.revive

> **game.revive**: `Record`\<`string`, `never`\>

Continue the crashed run: sent only after a rewarded ad paid out.

#### Inherited from

[`GameHostEvents`](GameHostEvents.md).[`game.revive`](GameHostEvents.md#gamerevive)

***

### game.sound

> **game.sound**: `object`

The player's sound setting changed.

#### on

> **on**: `boolean`

#### Inherited from

[`GameHostEvents`](GameHostEvents.md).[`game.sound`](GameHostEvents.md#gamesound)

***

### viewport.changed

> **viewport.changed**: [`Viewport`](../../interfaces/Viewport.md)
