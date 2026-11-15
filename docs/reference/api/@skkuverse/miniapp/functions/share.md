---
title: "@skkuverse/miniapp share (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: share()

> **share**(`__namedParameters`): `Promise`\<[`ShareResult`](../README.md#shareresult)\>

Share a link: the app's share sheet, else the browser's (Web Share), else
the clipboard. Call it from a tap: browsers allow Web Share and clipboard
writes only inside a user gesture.

## Parameters

### \_\_namedParameters

[`ShareOptions`](../interfaces/ShareOptions.md)

## Returns

`Promise`\<[`ShareResult`](../README.md#shareresult)\>
