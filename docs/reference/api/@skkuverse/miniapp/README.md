---
title: "@skkuverse/miniapp"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# @skkuverse/miniapp

## Classes

- [MiniappError](classes/MiniappError.md)

## Interfaces

- [HapticOptions](interfaces/HapticOptions.md)
- [HostInfo](interfaces/HostInfo.md)
- [Insets](interfaces/Insets.md)
- [OpenUrlOptions](interfaces/OpenUrlOptions.md)
- [ShareOptions](interfaces/ShareOptions.md)
- [ShellConfig](interfaces/ShellConfig.md)
- [Viewport](interfaces/Viewport.md)

## Type Aliases

### Chrome

> **Chrome** = `"glass"` \| `"opaque"`

- `glass`: the app's header and bars are translucent Liquid Glass (iOS 26+),
  so a background painted beneath them shows through, blurred.
- `opaque`: they are solid (earlier iOS, Android); nothing beneath shows.

***

### HapticStyle

> **HapticStyle** = `"light"` \| `"medium"` \| `"heavy"`

A mini app's haptic styles (`haptic.impact`). A game has its own set, `GameHapticStyle`.

***

### Method

> **Method** = [`NotifyMethod`](protocol/README.md#notifymethod) \| [`RequestMethod`](protocol/README.md#requestmethod)

***

### ShareResult

> **ShareResult** = `"shared"` \| `"copied"` \| `"cancelled"` \| `"failed"`

How a `share` call ended. `shared` means a share sheet was shown, not that
anything was sent: neither the app's sheet nor the browser's says.
`copied` means there was no sheet and the link went to the clipboard, which
the page should say out loud.

***

### ShellPatch

> **ShellPatch** = `Partial`\<`Pick`\<[`ShellConfig`](interfaces/ShellConfig.md), `"header"` \| `"statusBar"` \| `"background"`\>\>

What `shell.set` may change at runtime. `bar` is layout, so manifest only.

## Functions

- [canOpenMap](functions/canOpenMap.md)
- [canOpenMiniapp](functions/canOpenMiniapp.md)
- [canShare](functions/canShare.md)
- [getCapabilities](functions/getCapabilities.md)
- [getViewport](functions/getViewport.md)
- [handleLinkClick](functions/handleLinkClick.md)
- [haptic](functions/haptic.md)
- [hasCapability](functions/hasCapability.md)
- [isInApp](functions/isInApp.md)
- [notify](functions/notify.md)
- [onEvent](functions/onEvent.md)
- [onViewportChange](functions/onViewportChange.md)
- [openMapPlace](functions/openMapPlace.md)
- [openMiniapp](functions/openMiniapp.md)
- [openUrl](functions/openUrl.md)
- [ready](functions/ready.md)
- [request](functions/request.md)
- [setShell](functions/setShell.md)
- [share](functions/share.md)
- [track](functions/track.md)
