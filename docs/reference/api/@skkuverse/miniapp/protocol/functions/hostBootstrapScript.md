---
title: "@skkuverse/miniapp/protocol hostBootstrapScript (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: hostBootstrapScript()

> **hostBootstrapScript**(`options`): `string`

The script the app injects before content loads
(`injectedJavaScriptBeforeContentLoaded`). It defines `window.skkuverse` and
applies the viewport's CSS variables as early as the document allows, so a
page's first paint already has them.

Built here rather than in the app so that what `receive` does, and which CSS
variables exist, is defined in exactly one place next to the types.

With `origin`, the script does nothing unless it runs in the top window of
a document on exactly that origin. The app injects it again from
`onLoadEnd` into whatever document is loaded by then, and on Android a
subframe can receive it too, so without the gate a page the WebView reached
some other way would get a host that grants it methods. A game host must
pass it. Without it the script installs in any document, as the mini-app
shell has always called it, and the per-message origin check is the gate.

## Parameters

### options

[`HostBootstrapOptions`](../interfaces/HostBootstrapOptions.md)

## Returns

`string`
