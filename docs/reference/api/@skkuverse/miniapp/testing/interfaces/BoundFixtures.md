---
title: "@skkuverse/miniapp/testing BoundFixtures (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: BoundFixtures

The points that pin each ranked game's score bound, shared by the game's
bound tests and the server's validator tests so a bound moved on one side
fails the other's suite. The values live in `fixtures/bounds.json`, which
is also published as `@skkuverse/miniapp/fixtures/bounds.json` for a
consumer that cannot import this entry.

## Properties

### subway-typing

> **subway-typing**: `object`

#### minRunMs

> **minRunMs**: `number`

The fastest time a run may have, in ms.

#### totalKeys

> **totalKeys**: `number`

Keys to type the whole route.

***

### wave-run

> **wave-run**: `object`

#### maxScoreAfterSeconds

> **maxScoreAfterSeconds**: readonly `object`[]

`maxScoreAfter(seconds)`: the highest score a run can reach that long after its start.
