---
title: "@skkuverse/ui toBoxShadow (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: toBoxShadow()

> **toBoxShadow**(`color`, `offsetX`, `offsetY`, `blurRadius`, `opacity`): `string`

Compose a React Native shadow config into a CSS `boxShadow`.

React Native splits a shadow across four iOS properties plus an Android
`elevation`; CSS states it in one string. Colour arrives as hex or `rgba()`,
and opacity is a separate multiplier, so a hex colour is expanded here rather
than at every call site.

## Parameters

### color

`string`

### offsetX

`number`

### offsetY

`number`

### blurRadius

`number`

### opacity

`number`

## Returns

`string`
