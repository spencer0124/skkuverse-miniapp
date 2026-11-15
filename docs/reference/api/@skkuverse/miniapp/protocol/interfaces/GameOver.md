---
title: "@skkuverse/miniapp/protocol GameOver (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: GameOver

A run's result, as the page reports it in `game.over`.

## Properties

### hit

> **hit**: `string` \| `null`

What ended the run, in the game's own vocabulary.

***

### revives

> **revives**: `number`

***

### revivesLeft

> **revivesLeft**: `number`

How many more times the page would accept `game.revive` for this run.

***

### score

> **score**: `number`

A safe non-negative integer: for a ranked game it is what gets submitted.

***

### stats?

> `optional` **stats?**: `Readonly`\<`Record`\<`string`, `number`\>\>

Figures the result card shows beside the score. Display only, never submitted.

***

### telemetry?

> `optional` **telemetry?**: `Readonly`\<`Record`\<`string`, `number`\>\>

How the run was played. Never shown or submitted.

***

### ticks

> **ticks**: `number`

***

### validator?

> `optional` **validator?**: `string`

The validator a ranked page was built for, `<gameId>@<n>`. Ranked results
are verified outside the page.
