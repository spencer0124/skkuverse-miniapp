---
title: "@skkuverse/miniapp onEvent (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: onEvent()

> **onEvent**\<`E`\>(`event`, `callback`): () => `void`

Subscribe to an app event. Returns the unsubscribe function.

## Type Parameters

### E

`E` *extends* keyof [`HostEvents`](../protocol/interfaces/HostEvents.md)

## Parameters

### event

`E`

### callback

(`data`) => `void`

## Returns

() => `void`
