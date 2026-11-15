---
title: "@skkuverse/miniapp ShellConfig (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: ShellConfig

## Properties

### background

> **background**: `string`

`#RRGGBB` painted behind the WebView: while loading, and on overscroll.

***

### bar

> **bar**: [`ShellBar`](../protocol/type-aliases/ShellBar.md)

Where the app draws the miniapp's name pill.
- `top`: in the header, beside the back button.
- `bottom`: a floating bar at the bottom with back/forward buttons.
- `none`: nowhere. The header keeps only back and more.

***

### header

> **header**: [`ShellHeader`](../protocol/type-aliases/ShellHeader.md)

- `opaque`: the header is a solid band and the page starts below it.
- `overlay`: the page starts at the top of the screen, under the status
  bar and a transparent header. Pad content with `--sv-inset-top`.

***

### statusBar

> **statusBar**: [`ShellStatusBar`](../protocol/type-aliases/ShellStatusBar.md)

Status bar icon colour: `dark` icons for a light page, `light` for a dark one.
