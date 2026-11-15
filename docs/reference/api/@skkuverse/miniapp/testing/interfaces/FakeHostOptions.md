---
title: "@skkuverse/miniapp/testing FakeHostOptions (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: FakeHostOptions

Without a `preset`, the host grants `GAME_NOTIFY_METHODS` (what the app grants
a game origin) on `ZERO_VIEWPORT`, and answers `game.ready` with `game.init`
on a microtask, as the app's delivery is asynchronous. `init` defaults to this
SDK's `GAME_PROTOCOL`, a best of 0 and sound on, and `false` leaves `init()` to
the test. A field passed here wins over the same field of the preset.

## Extends

- [`HostPreset`](HostPreset.md)

## Properties

### capabilities?

> `optional` **capabilities?**: readonly `string`[]

Methods the host grants.

#### Inherited from

[`HostPreset`](HostPreset.md).[`capabilities`](HostPreset.md#capabilities)

***

### failureModes?

> `optional` **failureModes?**: `Readonly`\<`Record`\<`string`, [`FailureMode`](../README.md#failuremode)\>\>

What the host does to the request methods it names. A named method joins the
host's capabilities, because `request()` rejects a method the host does not
grant with `unsupported` before anything is posted.

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

### preset?

> `optional` **preset?**: [`HostPresetName`](../README.md#hostpresetname)

A named host state: `granted`, `nothing-granted`, `no-host`, `late-host`, `slow-init` or `old-host:<version>`.

***

### viewport?

> `optional` **viewport?**: [`Viewport`](../../interfaces/Viewport.md)

#### Inherited from

[`HostPreset`](HostPreset.md).[`viewport`](HostPreset.md#viewport)
