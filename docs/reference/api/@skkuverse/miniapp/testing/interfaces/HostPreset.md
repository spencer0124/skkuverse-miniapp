---
title: "@skkuverse/miniapp/testing HostPreset (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: HostPreset

A partial host state: what `createFakeHost` takes from a named preset. A field
the preset leaves out keeps `createFakeHost`'s own default, and a field the
caller passes beside the preset wins over it. A delay is `Infinity` or 0 to 2147483647 ms;
`createFakeHost` throws a `RangeError` for any other value.

## Extended by

- [`FakeHostOptions`](FakeHostOptions.md)
- [`HostPresetEntry`](HostPresetEntry.md)

## Properties

### capabilities?

> `optional` **capabilities?**: readonly `string`[]

Methods the host grants.

***

### hostDelayMs?

> `optional` **hostDelayMs?**: `number`

Milliseconds before `install()` takes effect: the page boots first and the
host appears later. `Infinity` is a host that never appears.

***

### init?

> `optional` **init?**: `false` \| `Partial`\<[`GameInit`](../../protocol/interfaces/GameInit.md)\>

What the host answers `game.ready` with, or `false` to leave `init()` to the test.

***

### initDelayMs?

> `optional` **initDelayMs?**: `number`

Milliseconds the host waits before it answers `game.ready` with `game.init`. `Infinity` is never.

***

### viewport?

> `optional` **viewport?**: [`Viewport`](../../interfaces/Viewport.md)
