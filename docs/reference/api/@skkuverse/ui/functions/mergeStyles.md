---
title: "@skkuverse/ui mergeStyles (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: mergeStyles()

> **mergeStyles**(...`styles`): `CSSProperties`

Flatten and merge styles, later entries winning.

React Native takes `style={[a, b && c, d]}` and DOM takes a single object, so
every converted component funnels its style layers through this.

## Parameters

### styles

...([`Style`](../type-aliases/Style.md) \| [`Style`](../type-aliases/Style.md)[])[]

## Returns

`CSSProperties`
