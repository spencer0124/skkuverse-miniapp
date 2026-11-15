---
title: "@skkuverse/miniapp/protocol MiniappNotifyMethods (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: MiniappNotifyMethods

Methods a mini-app page sends and forgets. Keyed by name, valued by params.

## Extended by

- [`NotifyMethods`](NotifyMethods.md)

## Properties

### analytics.track

> **analytics.track**: `object`

#### event

> **event**: `string`

#### params?

> `optional` **params?**: `Record`\<`string`, `unknown`\>

***

### app.ready

> **app.ready**: `Record`\<`string`, `never`\>

The page has rendered.

***

### haptic.impact

> **haptic.impact**: `object`

#### style

> **style**: [`HapticStyle`](../../README.md#hapticstyle)

***

### link.open

> **link.open**: `object`

Open a URL outside the page. `appUrl`, when set, is an app's own scheme
(`spotify:track:…`) the app tries first, falling back to `url`.

#### appUrl?

> `optional` **appUrl?**: `string`

#### url

> **url**: `string`

***

### map.openPlace

> **map.openPlace**: `object`

Close the page and open the campus map on `place` (`[<kind>:]<placeId>`).

#### place

> **place**: `string`

***

### miniapp.open

> **miniapp.open**: `object`

Open another registered miniapp: `<id>[/path]`.

#### target

> **target**: `string`

***

### share.open

> **share.open**: `object`

Open the app's share sheet on `url`, with `text` as the message above it.
The sheet's outcome is the user's business: the page is not told.

#### text?

> `optional` **text?**: `string`

#### url

> **url**: `string`

***

### shell.set

> **shell.set**: [`ShellPatch`](../../README.md#shellpatch)
