---
title: "@skkuverse/ui SDSProvider (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: SDSProvider()

> **SDSProvider**(`__namedParameters`): `Element`

Web build of the SKKU Design System.

Ported from skkuverse-app `packages/sds/src`. The theming layer here is the
part of that library that never depended on React Native: five providers of
pure React context, plus two token foundations.

Five of the seven files are byte-identical to their upstream originals, so
they can be registered as `mode: copy` contracts when the component layer
settles. Two differ by one line each — `foundation/colors.ts` and
`core/ThemeProvider.tsx` import `SdsColors` from `@skkuverse/tokens` rather
than `@skkuverse/shared`, since the app's shared package cannot be evaluated
in a browser. Until they are registered, keeping them in step with upstream
is manual.

Not ported: `foundation/easings.ts`, which is a Reanimated bezier tuple with
no browser meaning, and every component under `sds/src/components`, all of
which import `react-native` directly.

## Parameters

### \_\_namedParameters

`PropsWithChildren`\<[`SDSProviderProps`](../interfaces/SDSProviderProps.md)\>

## Returns

`Element`
