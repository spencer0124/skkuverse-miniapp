---
title: "@skkuverse/miniapp MiniappError (class)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Class: MiniappError

Thrown by `request` when the app answers with an error, or never answers.

## Extends

- `Error`

## Constructors

### Constructor

> **new MiniappError**(`error`): `MiniappError`

#### Parameters

##### error

[`ProtocolError`](../protocol/interfaces/ProtocolError.md)

#### Returns

`MiniappError`

#### Overrides

`Error.constructor`

## Properties

### code

> `readonly` **code**: [`ErrorCode`](../protocol/README.md#errorcode)
