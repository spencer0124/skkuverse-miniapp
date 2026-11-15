---
title: "@skkuverse/miniapp/protocol viewportCssVars (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: viewportCssVars()

> **viewportCssVars**(`viewport`): `Record`\<`string`, `string`\>

The CSS custom properties a viewport sets on `<html>`:
`--sv-safe-*`, `--sv-content-*`, and `--sv-inset-*` (their sum), for each of
top, bottom, left and right. `data-sv-chrome` carries `chrome`.

## Parameters

### viewport

[`Viewport`](../../interfaces/Viewport.md)

## Returns

`Record`\<`string`, `string`\>
