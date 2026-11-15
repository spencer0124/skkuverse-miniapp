---
title: "@skkuverse/ui useColorScheme (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: useColorScheme()

> **useColorScheme**(): [`ColorSchemeName`](../README.md#colorschemename)

Browser equivalent of React Native's `useColorScheme`.

Starts at `'light'` rather than reading the media query during render, so
server rendering and the first client paint agree. The effect corrects it
immediately after mount.

## Returns

[`ColorSchemeName`](../README.md#colorschemename)
