---
title: "@skkuverse/ui BottomCTASingleProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: BottomCTASingleProps

## Extends

- [`BottomCTABaseProps`](BottomCTABaseProps.md)
- `Omit`\<[`ButtonProps`](ButtonProps.md), `"display"` \| `"style"`\>

## Properties

### as?

> `optional` **as?**: `"button"` \| `"a"`

Renders an anchor instead of a button.

#### Default

`'button'`

#### Inherited from

`Omit.as`

***

### children

> **children**: `ReactNode`

#### Inherited from

[`ButtonProps`](ButtonProps.md).[`children`](ButtonProps.md#children)

***

### color?

> `optional` **color?**: [`ButtonColor`](../README.md#buttoncolor)

#### Default

`'primary'`

#### Inherited from

[`ButtonProps`](ButtonProps.md).[`color`](ButtonProps.md#color)

***

### containerStyle?

> `optional` **containerStyle?**: [`Style`](../README.md#style)

#### Inherited from

[`ButtonProps`](ButtonProps.md).[`containerStyle`](ButtonProps.md#containerstyle)

***

### disabled?

> `optional` **disabled?**: `boolean`

#### Default

`false`

#### Inherited from

[`ButtonProps`](ButtonProps.md).[`disabled`](ButtonProps.md#disabled)

***

### fixed?

> `optional` **fixed?**: `boolean`

Pins to the viewport bottom.

#### Default

`false`

#### Inherited from

[`BottomCTABaseProps`](BottomCTABaseProps.md).[`fixed`](BottomCTABaseProps.md#fixed)

***

### leftAccessory?

> `optional` **leftAccessory?**: `ReactNode`

#### Inherited from

[`ButtonProps`](ButtonProps.md).[`leftAccessory`](ButtonProps.md#leftaccessory)

***

### loading?

> `optional` **loading?**: `boolean`

#### Default

`false`

#### Inherited from

[`ButtonProps`](ButtonProps.md).[`loading`](ButtonProps.md#loading)

***

### size?

> `optional` **size?**: [`ButtonSize`](../README.md#buttonsize)

#### Default

`'xlarge'`

#### Inherited from

[`ButtonProps`](ButtonProps.md).[`size`](ButtonProps.md#size)

***

### style?

> `optional` **style?**: [`Style`](../README.md#style)

#### Inherited from

[`BottomCTABaseProps`](BottomCTABaseProps.md).[`style`](BottomCTABaseProps.md#style)

***

### textColor?

> `optional` **textColor?**: `string`

Overrides the resolved text colour.

#### Inherited from

[`ButtonProps`](ButtonProps.md).[`textColor`](ButtonProps.md#textcolor)

***

### textStyle?

> `optional` **textStyle?**: [`Style`](../README.md#style)

#### Inherited from

[`ButtonProps`](ButtonProps.md).[`textStyle`](ButtonProps.md#textstyle)

***

### variant?

> `optional` **variant?**: [`ButtonVariant`](../README.md#buttonvariant)

#### Default

`'fill'`

#### Inherited from

[`ButtonProps`](ButtonProps.md).[`variant`](ButtonProps.md#variant)
