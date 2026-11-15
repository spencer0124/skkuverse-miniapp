---
title: "@skkuverse/miniapp request (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: request()

> **request**\<`T`\>(`method`, `params?`, `__namedParameters?`): `Promise`\<`T`\>

Send a request and await the app's answer. Rejects with a `MiniappError`:
`unsupported` outside the app or for a method the app does not grant,
`timeout` when no answer arrives, otherwise whatever code the app sent.

Typed loosely on purpose while `RequestMethods` is empty; the first request
method gets a typed wrapper in `sdk/`.

## Type Parameters

### T

`T` = `unknown`

## Parameters

### method

`string`

### params?

`Record`\<`string`, `unknown`\> = `{}`

### \_\_namedParameters?

#### timeoutMs?

`number` = `10_000`

## Returns

`Promise`\<`T`\>
