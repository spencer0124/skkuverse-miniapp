---
title: "@skkuverse/ui lineClamp (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: lineClamp()

> **lineClamp**(`numberOfLines?`): `CSSProperties`

Clamp text to a fixed number of lines, the CSS equivalent of React Native's
`numberOfLines`. Returns nothing when unset, so callers can spread it
unconditionally.

`WebkitBoxOrient` is not in React's CSSProperties despite being universally
supported, hence the assertion.

## Parameters

### numberOfLines?

`number`

## Returns

`CSSProperties`
