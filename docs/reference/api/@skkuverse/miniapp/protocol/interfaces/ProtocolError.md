---
title: "@skkuverse/miniapp/protocol ProtocolError (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: ProtocolError

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.

## Properties

### code

> **code**: [`ErrorCode`](../README.md#errorcode)

***

### message

> **message**: `string`
