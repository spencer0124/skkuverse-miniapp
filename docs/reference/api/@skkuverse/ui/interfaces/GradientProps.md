---
title: "@skkuverse/ui GradientProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: GradientProps

## Properties

### children?

> `optional` **children?**: `ReactNode`

***

### colors

> **colors**: `string`[]

Two or more CSS colours.

***

### degree?

> `optional` **degree?**: `number`

Linear only. CSS angle: 180 points downward.

#### Default

`180`

***

### locations?

> `optional` **locations?**: `number`[]

Stop positions 0–1, one per colour. Evenly spaced when omitted.

***

### position?

> `optional` **position?**: `string`

Radial only.

#### Default

`'center'`

***

### style?

> `optional` **style?**: [`Style`](../README.md#style)

***

### type?

> `optional` **type?**: [`GradientType`](../README.md#gradienttype)

#### Default

`'linear'`
