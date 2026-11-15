---
title: "@skkuverse/miniapp Insets (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: Insets

Where a page may put its content, in CSS pixels, relative to the WebView.

Two layers, after Telegram's model:
- `safeArea` is the device's own: the status bar, a notch, the home
  indicator, wherever they overlap the WebView. It is zero on an edge the
  WebView does not reach.
- `contentSafeArea` is the app's: the header and the bottom bar, wherever
  they are drawn over the page.

A page paints its background edge to edge and keeps content inside both:
`padding-top: var(--sv-inset-top)` is the sum. The app injects these values
itself rather than leaving pages to `env(safe-area-inset-*)`, which reads zero
on recent Android WebViews and doubles up on iOS when the scroll view insets
as well.

## Properties

### bottom

> **bottom**: `number`

***

### left

> **left**: `number`

***

### right

> **right**: `number`

***

### top

> **top**: `number`
