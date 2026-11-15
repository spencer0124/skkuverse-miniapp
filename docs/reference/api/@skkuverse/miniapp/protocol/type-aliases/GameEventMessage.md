---
title: "@skkuverse/miniapp/protocol GameEventMessage (type alias)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Type Alias: GameEventMessage

> **GameEventMessage** = `{ [E in GameHostEvent]: { data: GameHostEvents[E]; event: E } }`\[[`GameHostEvent`](GameHostEvent.md)\]

The miniapp ↔ app contract, and nothing else: no DOM at import time, no
React, no dependencies. The app imports it for the parser and the scripts it
injects, skkuverse-server for the manifest parser, and the SDK for the types.

Messages are in `messages.ts`, the shell manifest in `manifest.ts`, safe
areas in `viewport.ts`, and the injected `window.skkuverse` in `host.ts`.
