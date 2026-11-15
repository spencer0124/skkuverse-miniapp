---
title: "@skkuverse/miniapp notify (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: notify()

> **notify**\<`M`\>(`method`, `params`): `void`

Send a notification. A no-op outside the app and for a method the app does
not grant. There is no answer, so never depend on it having happened.

## Type Parameters

### M

`M` *extends* keyof [`NotifyMethods`](../protocol/interfaces/NotifyMethods.md)

## Parameters

### method

`M`

### params

[`NotifyMethods`](../protocol/interfaces/NotifyMethods.md)\[`M`\]

## Returns

`void`
