---
title: "@skkuverse/miniapp/protocol parseShellFields (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: parseShellFields()

> **parseShellFields**(`value`): `Partial`\<[`ShellConfig`](../../interfaces/ShellConfig.md)\>

The valid fields of an untrusted shell object, and nothing else. The result
may be empty; merge it over a base with `mergeShell`.

## Parameters

### value

`unknown`

## Returns

`Partial`\<[`ShellConfig`](../../interfaces/ShellConfig.md)\>
