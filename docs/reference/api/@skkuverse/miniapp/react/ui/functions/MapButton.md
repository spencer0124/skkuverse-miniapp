---
title: "@skkuverse/miniapp/react/ui MapButton (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: MapButton()

> **MapButton**(`__namedParameters`): `Element` \| `null`

Opens the app's campus map on `place`, closing this page. Renders nothing
unless the host app says it can: in a plain browser there is no map to open,
and a button that does nothing is worse than none.

Defaults to a full-width weak primary button. Every `Button` prop overrides
them; for a different element altogether, use `useCanOpenMap` and
`openMapPlace` directly.

## Parameters

### \_\_namedParameters

[`MapButtonProps`](../interfaces/MapButtonProps.md)

## Returns

`Element` \| `null`
