---
title: "@skkuverse/miniapp setShell (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: setShell()

> **setShell**(`patch`): `void`

Change the shell mid-session: `header: 'overlay'` to play full-bleed,
`statusBar: 'light'` over a dark scene. The initial shell comes from the
miniapp's `public/skkuverse.json`, so the first frame never waits for this.

## Parameters

### patch

[`ShellPatch`](../type-aliases/ShellPatch.md)

## Returns

`void`
