---
title: "@skkuverse/miniapp/game GameClient (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: GameClient

What a page reports through. Every call is a no-op outside a game host.

## Properties

### init

> `readonly` **init**: [`GameInit`](../../protocol/interfaces/GameInit.md) \| `null`

What `game.init` said, or null before it arrived.

## Methods

### dispose()

> **dispose**(): `void`

Stop listening and looking for the host. For tests and hot reloads.

#### Returns

`void`

***

### haptic()

> **haptic**(`style`): `void`

#### Parameters

##### style

[`GameHapticStyle`](../../protocol/type-aliases/GameHapticStyle.md)

#### Returns

`void`

***

### layout()

> **layout**(`rect`): `void`

A rectangle the host draws over moved.

#### Parameters

##### rect

[`GameRect`](../../protocol/interfaces/GameRect.md)

#### Returns

`void`

***

### over()

> **over**(`result`): `void`

The run ended. Send it once a run, again only after `onRevive`.

#### Parameters

##### result

[`GameOver`](../../protocol/interfaces/GameOver.md)

#### Returns

`void`

***

### phase()

> **phase**(`phase`): `void`

#### Parameters

##### phase

[`GamePhase`](../../protocol/type-aliases/GamePhase.md)

#### Returns

`void`

***

### start()

> **start**(): `boolean`

Report that a run began. Refused, and false, before `game.init`.

#### Returns

`boolean`
