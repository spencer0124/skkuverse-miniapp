---
title: "@skkuverse/miniapp/game lockGlobals (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: lockGlobals()

> **lockGlobals**(`entries`): `void`

Pins each function or object where it is: it keeps working, and assigning or
redefining it afterwards throws. Something missing, or a plain value, is
skipped rather than created.

## Parameters

### entries

readonly (readonly \[`object`, `string`\])[]

## Returns

`void`
