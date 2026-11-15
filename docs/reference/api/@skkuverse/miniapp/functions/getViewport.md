---
title: "@skkuverse/miniapp getViewport (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: getViewport()

> **getViewport**(): [`Viewport`](../interfaces/Viewport.md)

Where content may go, relative to the WebView. Outside the app everything is
zero. Prefer the CSS variables (`var(--sv-inset-top)`) for layout, which the
app keeps current; read this for canvas games and other JS layout.

## Returns

[`Viewport`](../interfaces/Viewport.md)
