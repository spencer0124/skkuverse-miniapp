---
title: "@skkuverse/miniapp HapticOptions (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: HapticOptions

## Properties

### vibrate?

> `optional` **vibrate?**: `number`

Where the app cannot tap, pulse the Vibration API for this many
milliseconds instead. Android browsers honour it; iOS Safari has none. Off
by default: a buzz a page did not ask for is worse than none.
