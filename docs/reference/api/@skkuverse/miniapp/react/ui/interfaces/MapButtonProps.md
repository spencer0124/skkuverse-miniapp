---
title: "@skkuverse/miniapp/react/ui MapButtonProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: MapButtonProps

SDS-styled components. Needs `@skkuverse/ui`.

## Extends

- `Omit`\<`ButtonProps`, `"onClick"` \| `"children"`\>

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

***

### color?

> `optional` **color?**: `ButtonColor`

#### Default

`'primary'`

#### Inherited from

`Omit.color`

***

### containerStyle?

> `optional` **containerStyle?**: `Style`

#### Inherited from

`Omit.containerStyle`

***

### disabled?

> `optional` **disabled?**: `boolean`

#### Default

`false`

#### Inherited from

`Omit.disabled`

***

### display?

> `optional` **display?**: `ButtonDisplay`

#### Default

`'inline'`

#### Inherited from

`Omit.display`

***

### leftAccessory?

> `optional` **leftAccessory?**: `ReactNode`

#### Inherited from

`Omit.leftAccessory`

***

### loading?

> `optional` **loading?**: `boolean`

#### Default

`false`

#### Inherited from

`Omit.loading`

***

### place

> **place**: `string`

`[<kind>:]<placeId>`, as `openMapPlace` takes it.

***

### size?

> `optional` **size?**: `ButtonSize`

#### Default

`'xlarge'`

#### Inherited from

`Omit.size`

***

### style?

> `optional` **style?**: `Style`

#### Inherited from

`Omit.style`

***

### textColor?

> `optional` **textColor?**: `string`

Overrides the resolved text colour.

#### Inherited from

`Omit.textColor`

***

### textStyle?

> `optional` **textStyle?**: `Style`

#### Inherited from

`Omit.textStyle`

***

### variant?

> `optional` **variant?**: `ButtonVariant`

#### Default

`'fill'`

#### Inherited from

`Omit.variant`
