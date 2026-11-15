---
title: "@skkuverse/miniapp/protocol HostGlobal (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: HostGlobal

The object the app puts on `window.skkuverse` before the page's own script
runs. Its presence is what "inside the app" means.

## Properties

### capabilities

> **capabilities**: readonly `string`[]

Method names this app grants this page.

***

### protocol

> **protocol**: `number`

## Methods

### getViewport()

> **getViewport**(): [`Viewport`](../../interfaces/Viewport.md)

The current viewport; a fresh copy each call.

#### Returns

[`Viewport`](../../interfaces/Viewport.md)

***

### receive()

> **receive**(`json`): `void`

App → page delivery. The app calls it through `injectJavaScript` with a
JSON-encoded `HostMessage`. It updates the viewport and the CSS variables on
`viewport.changed`, then dispatches `MESSAGE_EVENT` on `window` with the
message as `detail`.

#### Parameters

##### json

`string`

#### Returns

`void`
