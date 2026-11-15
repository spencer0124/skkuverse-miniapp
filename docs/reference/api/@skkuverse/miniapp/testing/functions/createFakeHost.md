---
title: "@skkuverse/miniapp/testing createFakeHost (function)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Function: createFakeHost()

> **createFakeHost**(`options?`): [`FakeHost`](../interfaces/FakeHost.md)

A stand-in for the app's game host, for SDK and contract tests. It uses
the scope's `window` (a browser, jsdom, or a test's own stub) and its
`document`, or a recording one where the scope has none.

It runs the real bootstrap with `new Function`, so a page under a CSP that
forbids `unsafe-eval` cannot host it; run tests without the production
headers.

## Parameters

### options?

[`FakeHostOptions`](../interfaces/FakeHostOptions.md) = `{}`

## Returns

[`FakeHost`](../interfaces/FakeHost.md)
