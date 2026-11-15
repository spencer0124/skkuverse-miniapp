---
title: "@skkuverse/ui BottomSheet (variable)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Variable: BottomSheet

> `const` **BottomSheet**: ((`__namedParameters`) => `ReactPortal` \| `null`) & `object`

## Type Declaration

### CTA

> **CTA**: (`props`) => `Element` = `BottomSheetCTA`

#### Parameters

##### props

`Omit`\<[`ButtonProps`](../interfaces/ButtonProps.md), `"display"`\>

#### Returns

`Element`

### DoubleCTA

> **DoubleCTA**: (`__namedParameters`) => `Element` = `BottomSheetDoubleCTA`

#### Parameters

##### \_\_namedParameters

###### leftButton

`ReactNode`

###### rightButton

`ReactNode`

#### Returns

`Element`

### Header

> **Header**: (`__namedParameters`) => `Element` = `BottomSheetHeader`

#### Parameters

##### \_\_namedParameters

[`BottomSheetHeaderProps`](../interfaces/BottomSheetHeaderProps.md)

#### Returns

`Element`
