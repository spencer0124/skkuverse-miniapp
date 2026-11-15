---
title: "@skkuverse/miniapp/testing"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# @skkuverse/miniapp/testing

## Classes

- [GameContractError](classes/GameContractError.md)

## Interfaces

- [BoundFixtures](interfaces/BoundFixtures.md)
- [ContractViolation](interfaces/ContractViolation.md)
- [FakeHost](interfaces/FakeHost.md)
- [FakeHostOptions](interfaces/FakeHostOptions.md)
- [HostPreset](interfaces/HostPreset.md)
- [HostPresetEntry](interfaces/HostPresetEntry.md)

## Type Aliases

### ContractEntry

> **ContractEntry** = \{ `from`: `"page"`; `message`: [`PageMessage`](../protocol/README.md#pagemessage) \| `null`; `raw`: `string`; \} \| \{ `data`: `unknown`; `event`: `string`; `from`: `"host"`; \}

One message in either direction, in the order they happened. The host's answer
to a request is logged as the event `response`, with the response as its data.

***

### ContractRule

> **ContractRule** = `"every-message-parses"` \| `"first-message-ready"` \| `"no-start-before-init"` \| `"start-before-over"` \| `"one-over-per-run"`

The protocol contract every game page keeps, by name:

- `every-message-parses`: each message parses as a `game.*` notification.
- `first-message-ready`: the first message is `game.ready`.
- `no-start-before-init`: no `game.start` before the host sent `game.init`.
- `start-before-over`: every `game.over` belongs to a run that `game.start` began.
- `one-over-per-run`: at most one `game.over` per run, and one more after each `game.revive`.

***

### FailureMode

> **FailureMode** = `"denied"` \| `"timeout"` \| `"failed"` \| \{ `slowMs`: `number`; \}

What a host does to one request method, keyed by method name. It changes only
the method it names.

- `'denied'`: answers at once with a `denied` error.
- `'failed'`: answers at once with a `failed` error.
- `'timeout'`: never answers, so the page's own timeout fires.
- `{ slowMs }`: answers `null` after that many milliseconds.

***

### FailureModes

> **FailureModes** = `Readonly`\<`Record`\<`string`, [`FailureMode`](#failuremode)\>\>

***

### HostPresetName

> **HostPresetName** = keyof *typeof* [`HOST_PRESETS`](#host_presets) \| `` `old-host:${OldHostVersion}` ``

***

### OldHostVersion

> **OldHostVersion** = keyof *typeof* [`HOST_METHODS_ADDED`](#host_methods_added)

## Variables

### BOUND\_FIXTURES

> `const` **BOUND\_FIXTURES**: [`BoundFixtures`](interfaces/BoundFixtures.md) = `bounds`

***

### FAILURE\_MODE\_NOTES

> `const` **FAILURE\_MODE\_NOTES**: `object`

What a page sees for each failure mode, one line each.

#### Type Declaration

##### denied

> `readonly` **denied**: `` "The request rejects at once with a `MiniappError` whose `code` is `denied`." `` = `` 'The request rejects at once with a `MiniappError` whose `code` is `denied`.' ``

##### failed

> `readonly` **failed**: `` "The request rejects at once with a `MiniappError` whose `code` is `failed`." `` = `` 'The request rejects at once with a `MiniappError` whose `code` is `failed`.' ``

##### slowMs

> `readonly` **slowMs**: `` "The host answers with a `null` result after the given milliseconds." `` = `` 'The host answers with a `null` result after the given milliseconds.' ``

##### timeout

> `readonly` **timeout**: `` "The host never answers, so the request rejects with `timeout` after its own `timeoutMs`, 10 s by default." `` = `` 'The host never answers, so the request rejects with `timeout` after its own `timeoutMs`, 10 s by default.' ``

***

### HOST\_METHODS\_ADDED

> `const` **HOST\_METHODS\_ADDED**: `object`

The methods each published `@skkuverse/miniapp` release added to the app's
grant lists, from `CHANGELOG.md`. `old-host:<version>` grants everything added
up to and including that release, which is what an app built on it grants.

#### Type Declaration

###### 0.2.0

> `readonly` **0.2.0**: readonly \[`"haptic.impact"`, `"link.open"`, `"map.openPlace"`, `"miniapp.open"`, `"analytics.track"`, `"app.ready"`, `"shell.set"`\]

###### 0.2.1

> `readonly` **0.2.1**: readonly \[\] = `[]`

###### 0.3.0

> `readonly` **0.3.0**: readonly \[`"share.open"`\]

###### 0.4.0

> `readonly` **0.4.0**: readonly \[`"game.ready"`, `"game.start"`, `"game.phase"`, `"game.layout"`, `"game.haptic"`, `"game.over"`\]

###### 0.4.1

> `readonly` **0.4.1**: readonly \[\] = `[]`

###### 0.4.2

> `readonly` **0.4.2**: readonly \[\] = `[]`

***

### HOST\_PRESETS

> `const` **HOST\_PRESETS**: `object`

The fixed presets. The app grants one method list per origin, a miniapp's
`NOTIFY_METHODS` or a game's `GAME_NOTIFY_METHODS`. These grant both, so one
preset serves either kind of page. Pass `capabilities` beside a preset to
assert an exact list.

#### Type Declaration

##### granted

> `readonly` **granted**: `object`

###### granted.capabilities

> `readonly` **capabilities**: readonly `string`[] = `EVERY_METHOD`

###### granted.note

> `readonly` **note**: `"Grants every method of both lists, on the iPhone viewport."` = `'Grants every method of both lists, on the iPhone viewport.'`

###### granted.viewport

> `readonly` **viewport**: [`Viewport`](../interfaces/Viewport.md) = `IPHONE_VIEWPORT`

##### late-host

> `readonly` **late-host**: `object`

###### late-host.capabilities

> `readonly` **capabilities**: readonly `string`[] = `EVERY_METHOD`

###### late-host.hostDelayMs

> `readonly` **hostDelayMs**: `15000` = `LATE_HOST_MS`

###### late-host.note

> `readonly` **note**: `` "The host appears 15000 ms after `install()`, later than a game page waits before it calls `onNoHost`." ``

###### late-host.viewport

> `readonly` **viewport**: [`Viewport`](../interfaces/Viewport.md) = `IPHONE_VIEWPORT`

##### no-host

> `readonly` **no-host**: `object`

###### no-host.capabilities

> `readonly` **capabilities**: readonly \[\] = `[]`

###### no-host.hostDelayMs

> `readonly` **hostDelayMs**: `number` = `Infinity`

###### no-host.note

> `readonly` **note**: `` "No host ever appears: `install()` does nothing, as in a plain browser." `` = `` 'No host ever appears: `install()` does nothing, as in a plain browser.' ``

##### nothing-granted

> `readonly` **nothing-granted**: `object`

###### nothing-granted.capabilities

> `readonly` **capabilities**: readonly \[\] = `[]`

###### nothing-granted.note

> `readonly` **note**: `"The host is there and grants no method, so every SDK call takes its fallback."` = `'The host is there and grants no method, so every SDK call takes its fallback.'`

###### nothing-granted.viewport

> `readonly` **viewport**: [`Viewport`](../interfaces/Viewport.md) = `IPHONE_VIEWPORT`

##### slow-init

> `readonly` **slow-init**: `object`

###### slow-init.capabilities

> `readonly` **capabilities**: readonly `string`[] = `EVERY_METHOD`

###### slow-init.initDelayMs

> `readonly` **initDelayMs**: `2000` = `SLOW_INIT_MS`

###### slow-init.note

> `readonly` **note**: `` "The host answers `game.ready` with `game.init` 2000 ms late." ``

###### slow-init.viewport

> `readonly` **viewport**: [`Viewport`](../interfaces/Viewport.md) = `IPHONE_VIEWPORT`

***

### IPHONE\_VIEWPORT

> `const` **IPHONE\_VIEWPORT**: [`Viewport`](../interfaces/Viewport.md)

The iPhone overlay layout of the app's shell: 47 px of status bar plus a 44 px
header on top (inset 91 px), and a 34 px home indicator at the bottom. Measured
on the playground prototype, which draws the same overlay header.

## Functions

- [assertGameContract](functions/assertGameContract.md)
- [checkGameContract](functions/checkGameContract.md)
- [createFakeHost](functions/createFakeHost.md)
- [oldHostCapabilities](functions/oldHostCapabilities.md)
- [resolvePreset](functions/resolvePreset.md)
