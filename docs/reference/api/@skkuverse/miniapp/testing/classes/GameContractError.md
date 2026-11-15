---
title: "@skkuverse/miniapp/testing GameContractError (class)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Class: GameContractError

Thrown by `assertGameContract`, naming every rule the page broke.

## Extends

- `Error`

## Constructors

### Constructor

> **new GameContractError**(`violations`): `GameContractError`

#### Parameters

##### violations

readonly [`ContractViolation`](../interfaces/ContractViolation.md)[]

#### Returns

`GameContractError`

#### Overrides

`Error.constructor`

## Properties

### violations

> `readonly` **violations**: readonly [`ContractViolation`](../interfaces/ContractViolation.md)[]
