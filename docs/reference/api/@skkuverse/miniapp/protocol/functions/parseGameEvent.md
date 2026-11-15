---
title: "@skkuverse/miniapp/protocol parseGameEvent (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: parseGameEvent()

> **parseGameEvent**(`message`): [`GameEventMessage`](../README.md#gameeventmessage) \| `null`

One game event as the page receives it (the `detail` of `MESSAGE_EVENT`),
validated and rebuilt, or null. For the page: the host is trusted, but a
malformed event is still ignored rather than acted on.

## Parameters

### message

`unknown`

## Returns

[`GameEventMessage`](../README.md#gameeventmessage) \| `null`
