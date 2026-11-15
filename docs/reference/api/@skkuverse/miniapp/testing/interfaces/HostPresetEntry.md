---
title: "@skkuverse/miniapp/testing HostPresetEntry (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: HostPresetEntry

A preset and the sentence the docs give it.

## Extends

- [`HostPreset`](HostPreset.md)

## Properties

### capabilities?

> `optional` **capabilities?**: readonly `string`[]

Methods the host grants.

#### Inherited from

[`HostPreset`](HostPreset.md).[`capabilities`](HostPreset.md#capabilities)

***

### hostDelayMs?

> `optional` **hostDelayMs?**: `number`

Milliseconds before `install()` takes effect: the page boots first and the
host appears later. `Infinity` is a host that never appears.

#### Inherited from

[`HostPreset`](HostPreset.md).[`hostDelayMs`](HostPreset.md#hostdelayms)

***

### init?

> `optional` **init?**: `false` \| `Partial`\<[`GameInit`](../../protocol/interfaces/GameInit.md)\>

What the host answers `game.ready` with, or `false` to leave `init()` to the test.

#### Inherited from

[`HostPreset`](HostPreset.md).[`init`](HostPreset.md#init)

***

### initDelayMs?

> `optional` **initDelayMs?**: `number`

Milliseconds the host waits before it answers `game.ready` with `game.init`. `Infinity` is never.

#### Inherited from

[`HostPreset`](HostPreset.md).[`initDelayMs`](HostPreset.md#initdelayms)

***

### note

> **note**: `string`

***

### viewport?

> `optional` **viewport?**: [`Viewport`](../../interfaces/Viewport.md)

#### Inherited from

[`HostPreset`](HostPreset.md).[`viewport`](HostPreset.md#viewport)
