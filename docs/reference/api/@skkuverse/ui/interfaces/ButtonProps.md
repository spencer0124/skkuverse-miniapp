---
title: "@skkuverse/ui ButtonProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: ButtonProps

## Extends

- `NativeButtonProps`
- `Pick`\<`NativeAnchorProps`, `"href"` \| `"target"` \| `"rel"`\>

## Properties

### as?

> `optional` **as?**: `"button"` \| `"a"`

Renders an anchor instead of a button.

#### Default

`'button'`

***

### children

> **children**: `ReactNode`

#### Overrides

`NativeButtonProps.children`

***

### color?

> `optional` **color?**: [`ButtonColor`](../README.md#buttoncolor)

#### Default

`'primary'`

***

### containerStyle?

> `optional` **containerStyle?**: [`Style`](../README.md#style)

***

### disabled?

> `optional` **disabled?**: `boolean`

#### Default

`false`

#### Overrides

`NativeButtonProps.disabled`

***

### display?

> `optional` **display?**: [`ButtonDisplay`](../README.md#buttondisplay)

#### Default

`'inline'`

***

### leftAccessory?

> `optional` **leftAccessory?**: `ReactNode`

***

### loading?

> `optional` **loading?**: `boolean`

#### Default

`false`

***

### size?

> `optional` **size?**: [`ButtonSize`](../README.md#buttonsize)

#### Default

`'xlarge'`

***

### style?

> `optional` **style?**: [`Style`](../README.md#style)

***

### textColor?

> `optional` **textColor?**: `string`

Overrides the resolved text colour.

***

### textStyle?

> `optional` **textStyle?**: [`Style`](../README.md#style)

***

### variant?

> `optional` **variant?**: [`ButtonVariant`](../README.md#buttonvariant)

#### Default

`'fill'`
