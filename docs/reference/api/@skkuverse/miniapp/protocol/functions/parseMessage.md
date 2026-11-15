---
title: "@skkuverse/miniapp/protocol parseMessage (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: parseMessage()

> **parseMessage**(`raw`): [`PageMessage`](../type-aliases/PageMessage.md) \| `null`

One message from the page, validated, or null. For the app: anything that
does not parse is dropped without a word, like any other untrusted input.

A request (`id` present) is returned whatever its method, so the app can
answer `unsupported` instead of leaving the page to time out. A notification
must name a known method with valid params.

## Parameters

### raw

`unknown`

## Returns

[`PageMessage`](../type-aliases/PageMessage.md) \| `null`
