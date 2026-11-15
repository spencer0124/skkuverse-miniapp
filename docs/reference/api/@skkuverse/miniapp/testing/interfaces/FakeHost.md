---
title: "@skkuverse/miniapp/testing FakeHost (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: FakeHost

For tests, never for a page: a fake game host built on the app's real
bootstrap, the protocol contract every game keeps, and the pinned bound
points of the ranked games.

## Properties

### installed

> `readonly` **installed**: `boolean`

***

### log

> `readonly` **log**: readonly [`ContractEntry`](../type-aliases/ContractEntry.md)[]

Everything sent both ways, in order: what the contract assertions read.

***

### messages

> `readonly` **messages**: readonly ([`PageMessage`](../../protocol/type-aliases/PageMessage.md) \| `null`)[]

What the page posted, parsed (`null` for a message that does not parse).

## Methods

### cssVar()

> **cssVar**(`name`): `string` \| `undefined`

A CSS variable as the bootstrap set it on `<html>`, such as `--sv-inset-top`.

#### Parameters

##### name

`string`

#### Returns

`string` \| `undefined`

***

### flush()

> **flush**(): `Promise`\<`void`\>

Let pending deliveries (the automatic `game.init`) run.

#### Returns

`Promise`\<`void`\>

***

### init()

> **init**(`init?`): `void`

#### Parameters

##### init?

`Partial`\<[`GameInit`](../../protocol/interfaces/GameInit.md)\>

#### Returns

`void`

***

### install()

> **install**(): `void`

Become the host: define `window.ReactNativeWebView`, which records what
the page posts, and run the app's real `hostBootstrapScript`, which
defines `window.skkuverse` and the CSS variables. Call it before or after
the page boots: after is the late host the page must wait for.

#### Returns

`void`

***

### methods()

> **methods**(): `string`[]

The method of each page message, `'?'` for one that does not parse.

#### Returns

`string`[]

***

### onMessage()

> **onMessage**(`callback`): () => `void`

Called for each page message as it arrives. Returns the unsubscribe function.

#### Parameters

##### callback

(`message`, `raw`) => `void`

#### Returns

() => `void`

***

### pause()

> **pause**(): `void`

#### Returns

`void`

***

### reset()

> **reset**(): `void`

#### Returns

`void`

***

### restart()

> **restart**(): `void`

#### Returns

`void`

***

### resume()

> **resume**(): `void`

#### Returns

`void`

***

### revive()

> **revive**(): `void`

#### Returns

`void`

***

### send()

> **send**\<`E`\>(`event`, `data`): `void`

Deliver a game event, as `hostDeliverScript` would.

#### Type Parameters

##### E

`E` *extends* keyof [`GameHostEvents`](../../protocol/interfaces/GameHostEvents.md)

#### Parameters

##### event

`E`

##### data

[`GameHostEvents`](../../protocol/interfaces/GameHostEvents.md)\[`E`\]

#### Returns

`void`

***

### setViewport()

> **setViewport**(`viewport`): `void`

Change the viewport, as the app does on a rotation or a shell change.

#### Parameters

##### viewport

[`Viewport`](../../interfaces/Viewport.md)

#### Returns

`void`

***

### sound()

> **sound**(`on`): `void`

#### Parameters

##### on

`boolean`

#### Returns

`void`
