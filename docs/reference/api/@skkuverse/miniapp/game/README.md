---
title: "@skkuverse/miniapp/game"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# @skkuverse/miniapp/game

## Interfaces

- [BootOptions](interfaces/BootOptions.md)
- [GameClient](interfaces/GameClient.md)
- [GameHandlers](interfaces/GameHandlers.md)

## Variables

### HOST\_POLL\_MS

> `const` **HOST\_POLL\_MS**: `50` = `50`

How often `bootGame` looks for the host while it is not there yet.

***

### HOST\_SLOW\_POLL\_MS

> `const` **HOST\_SLOW\_POLL\_MS**: `1000` = `1_000`

How often `bootGame` keeps looking for the host after `HOST_WAIT_MS`.

***

### HOST\_WAIT\_MS

> `const` **HOST\_WAIT\_MS**: `10000` = `10_000`

How long `bootGame` looks every `HOST_POLL_MS` before it calls `onNoHost`.

## Functions

- [blocksEvent](functions/blocksEvent.md)
- [bootGame](functions/bootGame.md)
- [installGuard](functions/installGuard.md)
- [installPageGuard](functions/installPageGuard.md)
- [lockGlobals](functions/lockGlobals.md)

## References

### GAME\_PROTOCOL

Re-exports [GAME_PROTOCOL](../protocol/README.md#game_protocol)

***

### GameHapticStyle

Re-exports [GameHapticStyle](../protocol/README.md#gamehapticstyle)

***

### GameInit

Re-exports [GameInit](../protocol/interfaces/GameInit.md)

***

### GameOver

Re-exports [GameOver](../protocol/interfaces/GameOver.md)

***

### GamePhase

Re-exports [GamePhase](../protocol/README.md#gamephase)

***

### GameRect

Re-exports [GameRect](../protocol/interfaces/GameRect.md)

***

### GameStats

Re-exports [GameStats](../protocol/README.md#gamestats)

***

### Viewport

Re-exports [Viewport](../interfaces/Viewport.md)
