---
title: "@skkuverse/ui TextButtonProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: TextButtonProps

## Extends

- `Omit`\<`ButtonHTMLAttributes`\<`HTMLButtonElement`\>, `"style"` \| `"color"`\>

## Properties

### children

> **children**: `ReactNode`

#### Overrides

`Omit.children`

***

### color?

> `optional` **color?**: `string`

#### Default

`adaptive.grey800`

***

### disabled?

> `optional` **disabled?**: `boolean`

#### Overrides

`Omit.disabled`

***

### fontWeight?

> `optional` **fontWeight?**: [`ParagraphFontWeight`](../README.md#paragraphfontweight)

#### Default

`'regular'`

***

### size

> **size**: [`TextButtonSize`](../README.md#textbuttonsize)

***

### style?

> `optional` **style?**: [`Style`](../README.md#style)

***

### typography?

> `optional` **typography?**: [`TypographyKeys`](../README.md#typographykeys)

Overrides the typography implied by `size`.

***

### variant?

> `optional` **variant?**: [`TextButtonVariant`](../README.md#textbuttonvariant)

#### Default

`'clear'`
