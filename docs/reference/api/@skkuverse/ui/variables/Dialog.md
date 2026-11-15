---
title: "@skkuverse/ui Dialog (variable)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Variable: Dialog

> `const` **Dialog**: `object`

## Type Declaration

### Alert

> **Alert**: (`__namedParameters`) => `Element` = `AlertDialog`

#### Parameters

##### \_\_namedParameters

[`AlertDialogProps`](../interfaces/AlertDialogProps.md)

#### Returns

`Element`

### AlertButton

> **AlertButton**: (`__namedParameters`) => `Element` = `DialogButton`

The single button of an Alert.

#### Parameters

##### \_\_namedParameters

[`DialogButtonProps`](../interfaces/DialogButtonProps.md)

#### Returns

`Element`

### CancelButton

> **CancelButton**: (`__namedParameters`) => `Element` = `DialogButton`

The left button of a Confirm. Labelled 닫기 rather than 취소 by convention:
"취소" reads as cancelling the user's work rather than dismissing the box.

#### Parameters

##### \_\_namedParameters

[`DialogButtonProps`](../interfaces/DialogButtonProps.md)

#### Returns

`Element`

### Confirm

> **Confirm**: (`__namedParameters`) => `Element` = `ConfirmDialog`

#### Parameters

##### \_\_namedParameters

[`ConfirmDialogProps`](../interfaces/ConfirmDialogProps.md)

#### Returns

`Element`

### ConfirmButton

> **ConfirmButton**: (`__namedParameters`) => `Element` = `DialogButton`

#### Parameters

##### \_\_namedParameters

[`DialogButtonProps`](../interfaces/DialogButtonProps.md)

#### Returns

`Element`

### Description

> **Description**: (`__namedParameters`) => `Element` = `DialogDescription`

#### Parameters

##### \_\_namedParameters

`DialogTextProps`

#### Returns

`Element`

### Title

> **Title**: (`__namedParameters`) => `Element` = `DialogTitle`

#### Parameters

##### \_\_namedParameters

`DialogTextProps`

#### Returns

`Element`
