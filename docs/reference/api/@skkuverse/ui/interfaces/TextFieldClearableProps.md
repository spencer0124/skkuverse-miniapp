---
title: "@skkuverse/ui TextFieldClearableProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: TextFieldClearableProps

## Extends

- `Omit`\<[`TextFieldProps`](TextFieldProps.md), `"right"`\>

## Properties

### disabled?

> `optional` **disabled?**: `boolean`

#### Default

`false`

#### Inherited from

[`TextFieldProps`](TextFieldProps.md).[`disabled`](TextFieldProps.md#disabled)

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

#### Inherited from

`Omit.format`

***

### hasError?

> `optional` **hasError?**: `boolean`

#### Default

`false`

#### Inherited from

[`TextFieldProps`](TextFieldProps.md).[`hasError`](TextFieldProps.md#haserror)

***

### help?

> `optional` **help?**: `ReactNode`

#### Inherited from

[`TextFieldProps`](TextFieldProps.md).[`help`](TextFieldProps.md#help)

***

### label?

> `optional` **label?**: `string`

#### Inherited from

[`TextFieldProps`](TextFieldProps.md).[`label`](TextFieldProps.md#label)

***

### labelOption?

> `optional` **labelOption?**: [`TextFieldLabelOption`](../README.md#textfieldlabeloption)

#### Default

`'appear'`

#### Inherited from

[`TextFieldProps`](TextFieldProps.md).[`labelOption`](TextFieldProps.md#labeloption)

***

### onBlur?

> `optional` **onBlur?**: (`event`) => `void`

#### Parameters

##### event

`FocusEvent`\<`HTMLInputElement`\>

#### Returns

`void`

#### Inherited from

`Omit.onBlur`

***

### onChange?

> `optional` **onChange?**: (`event`) => `void`

#### Parameters

##### event

`ChangeEvent`\<`HTMLInputElement`\>

#### Returns

`void`

#### Inherited from

`Omit.onChange`

***

### onClear?

> `optional` **onClear?**: () => `void`

#### Returns

`void`

***

### onFocus?

> `optional` **onFocus?**: (`event`) => `void`

#### Parameters

##### event

`FocusEvent`\<`HTMLInputElement`\>

#### Returns

`void`

#### Inherited from

`Omit.onFocus`

***

### paddingBottom?

> `optional` **paddingBottom?**: `string` \| `number`

#### Inherited from

`Omit.paddingBottom`

***

### paddingTop?

> `optional` **paddingTop?**: `string` \| `number`

#### Inherited from

`Omit.paddingTop`

***

### prefix?

> `optional` **prefix?**: `string`

#### Inherited from

[`TextFieldProps`](TextFieldProps.md).[`prefix`](TextFieldProps.md#prefix)

***

### style?

> `optional` **style?**: [`Style`](../README.md#style)

#### Inherited from

[`TextFieldProps`](TextFieldProps.md).[`style`](TextFieldProps.md#style)

***

### suffix?

> `optional` **suffix?**: `string`

#### Inherited from

[`TextFieldProps`](TextFieldProps.md).[`suffix`](TextFieldProps.md#suffix)

***

### variant

> **variant**: [`TextFieldVariant`](../README.md#textfieldvariant)

#### Inherited from

[`TextFieldProps`](TextFieldProps.md).[`variant`](TextFieldProps.md#variant)
