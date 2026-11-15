---
title: "@skkuverse/ui TextFieldProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: TextFieldProps

## Extends

- `NativeInputProps`

## Properties

### disabled?

> `optional` **disabled?**: `boolean`

#### Default

`false`

#### Overrides

`NativeInputProps.disabled`

***

### format?

> `optional` **format?**: `object`

#### reset?

> `optional` **reset?**: (`formattedValue`) => `string`

##### Parameters

###### formattedValue

`string`

##### Returns

`string`

#### transform

> **transform**: (`value`) => `string`

##### Parameters

###### value

`string`

##### Returns

`string`

***

### hasError?

> `optional` **hasError?**: `boolean`

#### Default

`false`

***

### help?

> `optional` **help?**: `ReactNode`

***

### label?

> `optional` **label?**: `string`

***

### labelOption?

> `optional` **labelOption?**: [`TextFieldLabelOption`](../README.md#textfieldlabeloption)

#### Default

`'appear'`

***

### onBlur?

> `optional` **onBlur?**: (`event`) => `void`

#### Parameters

##### event

`FocusEvent`\<`HTMLInputElement`\>

#### Returns

`void`

#### Overrides

`NativeInputProps.onBlur`

***

### onChange?

> `optional` **onChange?**: (`event`) => `void`

#### Parameters

##### event

`ChangeEvent`\<`HTMLInputElement`\>

#### Returns

`void`

#### Overrides

`NativeInputProps.onChange`

***

### onFocus?

> `optional` **onFocus?**: (`event`) => `void`

#### Parameters

##### event

`FocusEvent`\<`HTMLInputElement`\>

#### Returns

`void`

#### Overrides

`NativeInputProps.onFocus`

***

### paddingBottom?

> `optional` **paddingBottom?**: `string` \| `number`

***

### paddingTop?

> `optional` **paddingTop?**: `string` \| `number`

***

### prefix?

> `optional` **prefix?**: `string`

***

### right?

> `optional` **right?**: `ReactNode`

***

### style?

> `optional` **style?**: [`Style`](../README.md#style)

***

### suffix?

> `optional` **suffix?**: `string`

***

### variant

> **variant**: [`TextFieldVariant`](../README.md#textfieldvariant)
