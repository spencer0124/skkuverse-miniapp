---
title: "@skkuverse/miniapp HostInfo (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: HostInfo

## Properties

### capabilities

> **capabilities**: `ReadonlySet`\<`string`\>

Method names the app grants this page. Empty outside the app.

***

### inApp

> **inApp**: `boolean`

Inside the skkuverse app's WebView.

***

### protocol

> **protocol**: `number`

The app's protocol version; 0 outside the app.
