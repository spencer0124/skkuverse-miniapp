---
title: "@skkuverse/ui IconButtonProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: IconButtonProps

## Extends

- `Omit`\<`ButtonHTMLAttributes`\<`HTMLButtonElement`\>, `"style"` \| `"color"`\>

## Properties

### aria-label

> **aria-label**: `string`

Required: an icon alone does not convey the action.

#### Overrides

`Omit.aria-label`

***

### bgColor?

> `optional` **bgColor?**: `string`

#### Default

`adaptive.greyOpacity200`

***

### color?

> `optional` **color?**: `string`

Applies to monotype icons only.

***

### disabled?

> `optional` **disabled?**: `boolean`

#### Overrides

`Omit.disabled`

***

### icon?

> `optional` **icon?**: `ReactNode`

A rendered icon element. Not upstream — see the note above.

***

### iconSize?

> `optional` **iconSize?**: `number`

#### Default

`24`

***

### name?

> `optional` **name?**: `string`

Icon name. Mutually exclusive with `src` and `icon`.

#### Overrides

`Omit.name`

***

### src?

> `optional` **src?**: `string`

Icon URL. Mutually exclusive with `name` and `icon`.

***

### style?

> `optional` **style?**: [`Style`](../README.md#style)

***

### variant?

> `optional` **variant?**: [`IconButtonVariant`](../README.md#iconbuttonvariant)

#### Default

`'clear'`
