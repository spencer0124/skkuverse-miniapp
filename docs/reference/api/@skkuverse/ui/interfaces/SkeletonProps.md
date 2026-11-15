---
title: "@skkuverse/ui SkeletonProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: SkeletonProps

## Properties

### background?

> `optional` **background?**: [`SkeletonBackground`](../type-aliases/SkeletonBackground.md)

#### Default

`'grey'`

***

### custom?

> `optional` **custom?**: [`SkeletonModule`](../type-aliases/SkeletonModule.md)[]

***

### height?

> `optional` **height?**: `string` \| `number`

***

### pattern?

> `optional` **pattern?**: [`SkeletonPattern`](../type-aliases/SkeletonPattern.md)

#### Default

`'topList'`

***

### play?

> `optional` **play?**: `"hide"` \| `"show"`

#### Default

`'show'`

***

### repeatLastItemCount?

> `optional` **repeatLastItemCount?**: `number` \| `"infinite"`

`'infinite'` repeats the last module 30 times.

#### Default

`3`

***

### style?

> `optional` **style?**: [`Style`](../type-aliases/Style.md)
