---
title: "@skkuverse/miniapp/react MiniappRoot (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: MiniappRoot()

> **MiniappRoot**(`__namedParameters`): `Element`

The root every miniapp renders inside. Outside the app it blocks by default
(see `browser`). It also guarantees the `--sv-*` CSS variables exist: the
app sets them before the page loads, and outside it they are set here, to
the browser's `env(safe-area-inset-*)` or to `mockViewport`, so
`var(--sv-inset-top)` never falls through.

## Parameters

### \_\_namedParameters

[`MiniappRootProps`](../interfaces/MiniappRootProps.md)

## Returns

`Element`
