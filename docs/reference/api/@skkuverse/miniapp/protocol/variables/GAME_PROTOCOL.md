---
title: "@skkuverse/miniapp/protocol GAME_PROTOCOL (variable)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Variable: GAME\_PROTOCOL

> `const` **GAME\_PROTOCOL**: `1` = `1`

The game protocol this SDK speaks. The host sends its own in `game.init`, so
a page built for a newer one can leave out what an older host lacks. Bumped
when a `game.*` method, event or field is added.
