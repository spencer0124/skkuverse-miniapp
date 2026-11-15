---
title: "@skkuverse/miniapp/protocol GameHapticStyle (type alias)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Type Alias: GameHapticStyle

> **GameHapticStyle** = [`HapticStyle`](../../type-aliases/HapticStyle.md) \| `"soft"` \| `"rigid"` \| `"error"` \| `"success"`

`light`, `medium`, `heavy`, `soft` and `rigid` are impact taps. `error` is a
short, hard tap for a slip, not the notification pattern, which is too long
to repeat. `success` is that notification pattern, for a moment that comes
at most once a run.
