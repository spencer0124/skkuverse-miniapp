---
title: "@skkuverse/miniapp ShellPatch (type alias)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Type Alias: ShellPatch

> **ShellPatch** = `Partial`\<`Pick`\<[`ShellConfig`](../interfaces/ShellConfig.md), `"header"` \| `"statusBar"` \| `"background"`\>\>

What `shell.set` may change at runtime. `bar` is layout, so manifest only.
