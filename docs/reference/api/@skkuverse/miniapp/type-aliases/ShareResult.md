---
title: "@skkuverse/miniapp ShareResult (type alias)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Type Alias: ShareResult

> **ShareResult** = `"shared"` \| `"copied"` \| `"cancelled"` \| `"failed"`

How a `share` call ended. `shared` means a share sheet was shown, not that
anything was sent: neither the app's sheet nor the browser's says.
`copied` means there was no sheet and the link went to the clipboard, which
the page should say out loud.
