---
title: "@skkuverse/miniapp/game installGuard (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: installGuard()

> **installGuard**(`target`, `isEditable?`): `void`

Listens at the top in the capture phase, so a blocked event is stopped
before any game listener — React's included — sees it.

## Parameters

### target

`EventTarget`

### isEditable?

(`t`) => `boolean`

## Returns

`void`
