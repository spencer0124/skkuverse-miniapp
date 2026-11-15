---
title: "@skkuverse/miniapp/protocol NotifyMethods (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: NotifyMethods

Every method a page sends and forgets, for the parser. Grants decide which a page may use.

## Extends

- [`MiniappNotifyMethods`](MiniappNotifyMethods.md)
- [`GameNotifyMethods`](GameNotifyMethods.md)

## Properties

### analytics.track

> **analytics.track**: `object`

#### event

> **event**: `string`

#### params?

> `optional` **params?**: `Record`\<`string`, `unknown`\>

#### Inherited from

[`MiniappNotifyMethods`](MiniappNotifyMethods.md).[`analytics.track`](MiniappNotifyMethods.md#analyticstrack)

***

### app.ready

> **app.ready**: `Record`\<`string`, `never`\>

The page has rendered.

#### Inherited from

[`MiniappNotifyMethods`](MiniappNotifyMethods.md).[`app.ready`](MiniappNotifyMethods.md#appready)

***

### game.haptic

> **game.haptic**: `object`

#### style

> **style**: [`GameHapticStyle`](../README.md#gamehapticstyle)

#### Inherited from

[`GameNotifyMethods`](GameNotifyMethods.md).[`game.haptic`](GameNotifyMethods.md#gamehaptic)

***

### game.layout

> **game.layout**: `object`

A rectangle the host draws over moved, after a resize for example.

#### rect

> **rect**: [`GameRect`](GameRect.md)

#### Inherited from

[`GameNotifyMethods`](GameNotifyMethods.md).[`game.layout`](GameNotifyMethods.md#gamelayout)

***

### game.over

> **game.over**: [`GameOver`](GameOver.md)

#### Inherited from

[`GameNotifyMethods`](GameNotifyMethods.md).[`game.over`](GameNotifyMethods.md#gameover)

***

### game.phase

> **game.phase**: `object`

#### phase

> **phase**: [`GamePhase`](../README.md#gamephase)

#### Inherited from

[`GameNotifyMethods`](GameNotifyMethods.md).[`game.phase`](GameNotifyMethods.md#gamephase)

***

### game.ready

> **game.ready**: `object`

The page can be shown. `rect` is where the host may anchor its title.

#### rect?

> `optional` **rect?**: [`GameRect`](GameRect.md)

#### Inherited from

[`GameNotifyMethods`](GameNotifyMethods.md).[`game.ready`](GameNotifyMethods.md#gameready)

***

### game.start

> **game.start**: `Record`\<`string`, `never`\>

A run began. Never before `game.init`.

#### Inherited from

[`GameNotifyMethods`](GameNotifyMethods.md).[`game.start`](GameNotifyMethods.md#gamestart)

***

### haptic.impact

> **haptic.impact**: `object`

#### style

> **style**: [`HapticStyle`](../../README.md#hapticstyle)

#### Inherited from

[`MiniappNotifyMethods`](MiniappNotifyMethods.md).[`haptic.impact`](MiniappNotifyMethods.md#hapticimpact)

***

### link.open

> **link.open**: `object`

Open a URL outside the page. `appUrl`, when set, is an app's own scheme
(`spotify:track:…`) the app tries first, falling back to `url`.

#### appUrl?

> `optional` **appUrl?**: `string`

#### url

> **url**: `string`

#### Inherited from

[`MiniappNotifyMethods`](MiniappNotifyMethods.md).[`link.open`](MiniappNotifyMethods.md#linkopen)

***

### map.openPlace

> **map.openPlace**: `object`

Close the page and open the campus map on `place` (`[<kind>:]<placeId>`).

#### place

> **place**: `string`

#### Inherited from

[`MiniappNotifyMethods`](MiniappNotifyMethods.md).[`map.openPlace`](MiniappNotifyMethods.md#mapopenplace)

***

### miniapp.open

> **miniapp.open**: `object`

Open another registered miniapp: `<id>[/path]`.

#### target

> **target**: `string`

#### Inherited from

[`MiniappNotifyMethods`](MiniappNotifyMethods.md).[`miniapp.open`](MiniappNotifyMethods.md#miniappopen)

***

### share.open

> **share.open**: `object`

Open the app's share sheet on `url`, with `text` as the message above it.
The sheet's outcome is the user's business: the page is not told.

#### text?

> `optional` **text?**: `string`

#### url

> **url**: `string`

#### Inherited from

[`MiniappNotifyMethods`](MiniappNotifyMethods.md).[`share.open`](MiniappNotifyMethods.md#shareopen)

***

### shell.set

> **shell.set**: [`ShellPatch`](../../README.md#shellpatch)

#### Inherited from

[`MiniappNotifyMethods`](MiniappNotifyMethods.md).[`shell.set`](MiniappNotifyMethods.md#shellset)
