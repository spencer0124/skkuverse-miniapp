---
title: "@skkuverse/miniapp/game installPageGuard (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: installPageGuard()

> **installPageGuard**(): `void`

The page's guard. Idempotent: a second call on the same window does nothing.

The clock and the dice are read off `window` rather than the bare globals,
which are the same objects in a page, so a test can hand it a window of its
own without pinning its runner's `Date`.

## Returns

`void`
