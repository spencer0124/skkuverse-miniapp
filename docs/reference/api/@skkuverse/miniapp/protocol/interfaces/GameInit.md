---
title: "@skkuverse/miniapp/protocol GameInit (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: GameInit

What the host tells a game page in answer to `game.ready`.

## Properties

### gameProtocol

> **gameProtocol**: `number`

The host's game protocol (`GAME_PROTOCOL` of the SDK it was built with).

***

### hi

> **hi**: `number`

The device best, in the game's own units.

***

### sound

> **sound**: `boolean`

The player's sound setting.
