---
title: Test A Miniapp Without The App
type: how-to
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-18
audience: public
---

# Test a miniapp without the app

> Testing what a miniapp or a game page sends to the app, in vitest or from the command line, with no phone and no app build. For anyone building a miniapp or a game.

## Overview

`@skkuverse/miniapp/testing` stands in for the app. `createFakeHost()` runs the app's real `hostBootstrapScript` in the test's window and records every message both ways. `checkGameContract()` reads that record and names each rule of the game protocol the page broke.

## Prerequisites

- `@skkuverse/miniapp` and `vitest` installed in the package under test.
- For the command-line check, a built game under `games/<id>`.

## Steps

1. **Write a test that installs the fake host.** In this test, the calls to `bootGame`, `start` and `over` stand in for a game page's own code. Replace them with the code that starts your page, so that `host.log` records what the page sends:

   ```ts
   import { afterEach, expect, it, vi } from 'vitest';
   import { bootGame } from '@skkuverse/miniapp/game';
   import { checkGameContract, createFakeHost } from '@skkuverse/miniapp/testing';

   afterEach(() => vi.unstubAllGlobals());

   it('keeps the game contract for one run', async () => {
     vi.stubGlobal('window', new EventTarget());
     const host = createFakeHost();
     host.install();
     const game = bootGame({ onInit: () => {} });
     await host.flush();
     game.start();
     game.over({ score: 120, ticks: 600, hit: null, revives: 0, revivesLeft: 0 });
     expect(checkGameContract(host.log)).toEqual([]);
     game.dispose();
   });
   ```

   The example stubs `window` because the page guard pins the clock and the timers on `window` for good, and the test's node environment has no `window` to pin them on. A miniapp test asserts on `host.log` the same way.
2. **Hold a built game to the contract without a test.** Run `@skkuverse/game-contract` from the repository root after the build:

   ```sh
   pnpm add -Dw @skkuverse/game-contract
   pnpm exec game-contract            # every game under games/
   pnpm exec game-contract <id>       # one game
   ```

   It plays each page twice: once with the host there from the start, and once with a host that appears only after the page gave up looking. It exits 1 and names each rule a page broke, so a games repository can run it in CI to keep every game to the contract.

## Related

- [Wave run demo](https://spencer0124.github.io/skkuverse-miniapp/examples/wave-run/), a playable game on the fake host, with a live panel of every message the page and the app trade
- [game-contract README](../../packages/game-contract/README.md), for the rules and the exit codes of `game-contract`
- [protocol.md](../reference/protocol.md), for the game protocol the contract checks
- [Ship a miniapp](ship-a-miniapp.md), for where a test sits on a miniapp's way to the app
