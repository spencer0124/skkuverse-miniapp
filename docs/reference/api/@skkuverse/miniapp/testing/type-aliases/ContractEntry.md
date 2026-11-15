---
title: "@skkuverse/miniapp/testing ContractEntry (type alias)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Type Alias: ContractEntry

> **ContractEntry** = \{ `from`: `"page"`; `message`: [`PageMessage`](../../protocol/type-aliases/PageMessage.md) \| `null`; `raw`: `string`; \} \| \{ `data`: `unknown`; `event`: `string`; `from`: `"host"`; \}

One message in either direction, in the order they happened.
