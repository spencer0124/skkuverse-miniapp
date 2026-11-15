---
title: "@skkuverse/miniapp/protocol HostBootstrapOptions (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: HostBootstrapOptions

## Properties

### capabilities

> **capabilities**: readonly `string`[]

Method names this app grants the page.

***

### origin?

> `optional` **origin?**: `string`

The origin the page must be on, such as `https://wave-run.game.skkuverse.com`.
When given, the script installs nothing in another origin's document or
in any frame but the top one. Required for a game host.

***

### viewport

> **viewport**: [`Viewport`](../../interfaces/Viewport.md)
