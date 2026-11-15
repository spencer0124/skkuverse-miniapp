---
title: "@skkuverse/miniapp/protocol GameNotifyMethods (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: GameNotifyMethods

Methods a game page sends and forgets.

## Extended by

- [`NotifyMethods`](NotifyMethods.md)

## Properties

### game.haptic

> **game.haptic**: `object`

#### style

> **style**: [`GameHapticStyle`](../README.md#gamehapticstyle)

***

### game.layout

> **game.layout**: `object`

A rectangle the host draws over moved, after a resize for example.

#### rect

> **rect**: [`GameRect`](GameRect.md)

***

### game.over

> **game.over**: [`GameOver`](GameOver.md)

***

### game.phase

> **game.phase**: `object`

#### phase

> **phase**: [`GamePhase`](../README.md#gamephase)

***

### game.ready

> **game.ready**: `object`

The page can be shown. `rect` is where the host may anchor its title.

#### rect?

> `optional` **rect?**: [`GameRect`](GameRect.md)

***

### game.start

> **game.start**: `Record`\<`string`, `never`\>

A run began. Never before `game.init`.
