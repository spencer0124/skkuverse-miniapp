---
title: "@skkuverse/miniapp/protocol hostDeliverScript (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: hostDeliverScript()

> **hostDeliverScript**(`origin`, `message`): `string`

The script that delivers one message to the page (`injectJavaScript`). It
checks the page is still on `origin` first: the WebView may have navigated
since the request arrived, and a response must never reach another site.

## Parameters

### origin

`string`

### message

[`HostMessage`](../type-aliases/HostMessage.md)

## Returns

`string`
