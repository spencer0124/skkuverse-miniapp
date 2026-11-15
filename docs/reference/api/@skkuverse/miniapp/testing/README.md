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

## Type Aliases

### ContractEntry

> **ContractEntry** = \{ `from`: `"page"`; `message`: [`PageMessage`](../protocol/README.md#pagemessage) \| `null`; `raw`: `string`; \} \| \{ `data`: `unknown`; `event`: `string`; `from`: `"host"`; \}

One message in either direction, in the order they happened.

***

### ContractRule

> **ContractRule** = `"every-message-parses"` \| `"first-message-ready"` \| `"no-start-before-init"` \| `"start-before-over"` \| `"one-over-per-run"`

The protocol contract every game page keeps, by name:

- `every-message-parses`: each message parses as a `game.*` notification.
- `first-message-ready`: the first message is `game.ready`.
- `no-start-before-init`: no `game.start` before the host sent `game.init`.
- `start-before-over`: every `game.over` belongs to a run that `game.start` began.
- `one-over-per-run`: at most one `game.over` per run, and one more after each `game.revive`.

## Variables

### BOUND\_FIXTURES

> `const` **BOUND\_FIXTURES**: [`BoundFixtures`](interfaces/BoundFixtures.md) = `bounds`

## Functions

- [assertGameContract](functions/assertGameContract.md)
- [checkGameContract](functions/checkGameContract.md)
- [createFakeHost](functions/createFakeHost.md)
