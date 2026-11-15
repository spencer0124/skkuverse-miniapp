---
title: "@skkuverse/miniapp handleLinkClick (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: handleLinkClick()

> **handleLinkClick**(`event`, `url`, `options?`): `void`

The click handler for an `<a href target="_blank">` that leaves the page.
Inside the app the tap goes to the app and the default is cancelled; in a
browser the anchor's own `href` does the work, which keeps middle-click,
long-press and popup blockers behaving.

## Parameters

### event

#### preventDefault

() => `void`

### url

`string`

### options?

[`OpenUrlOptions`](../interfaces/OpenUrlOptions.md) = `{}`

## Returns

`void`
