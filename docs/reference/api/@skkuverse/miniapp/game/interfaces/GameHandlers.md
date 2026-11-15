---
title: "@skkuverse/miniapp/game GameHandlers (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: GameHandlers

What a game page does when the host speaks. Every handler but `onInit` is
optional, and the host's word is final: a page obeys pause, sound and reset
rather than deciding them itself.

## Methods

### onAudioUnlock()?

> `optional` **onAudioUnlock**(): `void`

Called on every press the player really made (`pointerdown`, `keydown`),
before the game hears it: iOS opens audio only inside a tap, and a later
press wakes a context the OS suspended. Make it idempotent.

#### Returns

`void`

***

### onInit()

> **onInit**(`init`): `void`

The host answered `game.ready`. Until it does, `start()` refuses, so no
run can begin. `init.gameProtocol` is the host's game protocol: a page
built for a newer one leaves out what the host lacks rather than failing.

#### Parameters

##### init

[`GameInit`](../../protocol/interfaces/GameInit.md)

#### Returns

`void`

***

### onNoHost()?

> `optional` **onNoHost**(): `void`

Called at most once: the host had not appeared after `waitMs`, or it does
not host games (a browser, or the mini-app shell). Show nothing
interactive. A host that is merely late can still appear: `bootGame` keeps
looking, sends `game.ready` when it does, and `onInit` follows, so a page
leaves this state there.

#### Returns

`void`

***

### onPause()?

> `optional` **onPause**(): `void`

Stop the run's clock and its audio until `onResume`.

#### Returns

`void`

***

### onReset()?

> `optional` **onReset**(): `void`

Back to the title, with no run started.

#### Returns

`void`

***

### onRestart()?

> `optional` **onRestart**(): `void`

Start a new run straight away.

#### Returns

`void`

***

### onResume()?

> `optional` **onResume**(): `void`

#### Returns

`void`

***

### onRevive()?

> `optional` **onRevive**(): `void`

Continue the crashed run. The host sends it only after a rewarded ad paid out.

#### Returns

`void`

***

### onSound()?

> `optional` **onSound**(`on`): `void`

Sound on or off. The first setting comes in `onInit`.

#### Parameters

##### on

`boolean`

#### Returns

`void`

***

### onViewport()?

> `optional` **onViewport**(`viewport`): `void`

The viewport once the host is found, then on every change. The CSS
variables (`--sv-inset-*`) are already applied by the host; this is for a
canvas or other layout done in script.

#### Parameters

##### viewport

[`Viewport`](../../interfaces/Viewport.md)

#### Returns

`void`

***

### rect()?

> `optional` **rect**(): [`GameRect`](../../protocol/interfaces/GameRect.md) \| `null` \| `undefined`

Where the host may anchor its title, sent with `game.ready`.

#### Returns

[`GameRect`](../../protocol/interfaces/GameRect.md) \| `null` \| `undefined`
