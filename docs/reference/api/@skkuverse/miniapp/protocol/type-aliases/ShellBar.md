---
title: "@skkuverse/miniapp/protocol ShellBar (type alias)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Type Alias: ShellBar

> **ShellBar** = `"top"` \| `"bottom"` \| `"none"`

The shell a miniapp asks the app to draw around it.

A miniapp declares it in `public/skkuverse.json`, served from its own
origin. skkuverse-server fetches that file for first-party miniapps and
merges it into the registry's `GET /miniapps/:id`, so the app knows the shell
before it creates the WebView and the first frame is already right.
`shell.set` changes the parts that may change mid-session.

Parsing is tolerant everywhere: an unknown key or a bad value is dropped and
the default takes its place. A miniapp with a broken manifest still opens.
