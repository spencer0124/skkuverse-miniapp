---
title: Add A Bridge Method
type: how-to
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-26
audience: internal
---

# Add a bridge method

> Adding a feature a miniapp asks the app for, such as a rewarded ad or a sign-in token, from the protocol entry through to the release order. For whoever extends the SDK.

## Overview

A method is one entry in the protocol, one SDK wrapper, and one handler in the app. The envelope does not change. Names are `<namespace>.<verb>`, for example `ads.showRewarded`.

- **Notification**: the page sends and forgets. Use it when the page never needs to know what happened.
- **Request**: the app answers exactly once. Use it when the page needs a result, a refusal or a failure.

## Prerequisites

- Read the [protocol](../reference/protocol.md), especially its rules.
- Decide what the server must confirm. A page can forge any message, and a page can be told anything by a forged app. Anything that grants value, such as a reward, a ranking or an identity, is verified by a server, never by an app response the page relays.

## Steps

1. **Declare it.** In `packages/miniapp/src/protocol/messages.ts`:
   - For a notification, add an entry to `NotifyMethods`, a validator to `PARAMS`, and the name to `NOTIFY_METHODS`.
   - For a request, add an entry to `RequestMethods` as `{ params; result }`. `parseMessage` passes requests through whatever their method, so the app can answer `unsupported` to one it does not know.
2. **Wrap it.** Add a typed function in `packages/miniapp/src/sdk/` and export it from `src/index.ts`.
   - Check `isGranted(method)` first, and give a browser fallback or a clear `unsupported` path.
   - Requests go through `request(method, params, { timeoutMs })`. Choose a timeout that fits the feature: seconds for data, minutes for anything the user watches or types.
3. **Test it.** Add parser vectors in `test/protocol.test.ts` and a transport case in `test/sdk.test.ts`. Run `pnpm build && pnpm typecheck && pnpm test && pnpm lint`.
4. **Document it.** Add a row to the methods table in [protocol](../reference/protocol.md), with its params and SDK function.
5. **Release the SDK.** Add a `minor` changeset and follow [release-packages](release-packages.md).
6. **Implement it in the app.** In skkuverse-app, handle the method in `apps/mobile/src/features/mini-app/dispatch.ts`.
   - Include it in the capabilities the mini-app shell grants.
   - Answer every request exactly once, including errors.
   - Bump `@skkuverse/miniapp` there so `parseMessage` knows the new method.
7. **Ship the app before relying on it.** A page must check `hasCapability(method)` before offering the feature. An older app lacks the method, and a page built for it still runs, reduced.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| A request always rejects with `unsupported` | The method is missing from the capabilities the app injects | Grant it in the app's mini-app shell |
| A request always rejects with `timeout` | The app never answers it | Every branch of the handler must reply, errors included |
| A notification is silently dropped | Its params fail the validator in `PARAMS`, or the app's `parseMessage` is from an older SDK | Check the params; bump the SDK in the app |

## Related

- [protocol](../reference/protocol.md) — the envelope, rules and method table
- [architecture](../explanation/architecture.md) — where the dispatcher sits
