---
title: "@skkuverse/miniapp/react MiniappRootProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: MiniappRootProps

React bindings. Wrap the app in `MiniappRoot`; the hooks throw outside it.
Nothing here imports `@skkuverse/ui` — the SDS-styled components are in
`@skkuverse/miniapp/react/ui`.

## Properties

### browser?

> `optional` **browser?**: `"block"` \| `"allow"`

What a plain browser gets.
- `block` (default): a full-screen "open in the skkuverse app" page.
- `allow`: the miniapp itself, with every app feature reporting unavailable.

Blocking is the default so that a miniapp is shared outside the app only
when someone decided it should be. It is presentation, not protection:
anything that must not be reachable from a browser needs a server check.

***

### children

> **children**: `ReactNode`

***

### dev?

> `optional` **dev?**: `boolean`

Development mode: never block, show a thin banner instead, and apply
`mockViewport` so layouts can be checked in a desktop browser. Pass
`import.meta.env.DEV`. Defaults to true on localhost and private addresses.

***

### id

> **id**: `string`

The miniapp's registry id, as in `skkuverse://m/<id>`.

***

### mockViewport?

> `optional` **mockViewport?**: [`Viewport`](../../interfaces/Viewport.md)

Viewport to simulate in development outside the app. Defaults to all zeros.
