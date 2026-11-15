---
title: "@skkuverse/ui SearchFieldProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: SearchFieldProps

## Extends

- `Omit`\<`InputHTMLAttributes`\<`HTMLInputElement`\>, `"style"` \| `"size"` \| `"type"`\>

## Properties

### hasClearButton?

> `optional` **hasClearButton?**: `boolean`

#### Default

`false — matches the design system's default.`

***

### onChange?

> `optional` **onChange?**: (`event`) => `void`

#### Parameters

##### event

`ChangeEvent`\<`HTMLInputElement`\>

#### Returns

`void`

#### Overrides

`Omit.onChange`

***

### onClear?

> `optional` **onClear?**: () => `void`

#### Returns

`void`

***

### style?

> `optional` **style?**: [`Style`](../README.md#style)
