# skkuverse-miniapp

[![CI](https://github.com/spencer0124/skkuverse-miniapp/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/spencer0124/skkuverse-miniapp/actions/workflows/ci.yml?query=branch%3Amain)
[![@skkuverse/miniapp on npm](https://img.shields.io/npm/v/@skkuverse/miniapp?label=%40skkuverse%2Fminiapp)](https://www.npmjs.com/package/@skkuverse/miniapp)
[![@skkuverse/miniapp-cli on npm](https://img.shields.io/npm/v/@skkuverse/miniapp-cli?label=%40skkuverse%2Fminiapp-cli)](https://www.npmjs.com/package/@skkuverse/miniapp-cli)
[![License](https://img.shields.io/npm/l/@skkuverse/miniapp)](LICENSE)

The SDK, the design system and the tools for skkuverse miniapps, the small Vite and React pages that run inside the skkuverse app.
Each tool ends in a check that can fail, so a person or an LLM can prove that a change works before it ships.

| Package | What it is |
| --- | --- |
| [`@skkuverse/miniapp`](packages/miniapp) | Bridge protocol, SDK, React bindings, and a fake host for tests |
| [`@skkuverse/miniapp-cli`](packages/cli) | `check` against the [miniapp spec](docs/reference/miniapp-spec.md), `new` and `ship` |
| [`@skkuverse/game-contract`](packages/game-contract) | Plays a built game against the fake host and holds it to the game protocol |
| [`@skkuverse/ui`](packages/ui) | SKKU Design System for the web: `SDSProvider` and components |
| [`@skkuverse/tokens`](packages/tokens) | Design tokens, copied from the app and hash-checked |

## In production

<img align="right" width="170" src="./docs/explanation/assets/eskara-2026.png" alt="The skkuverse app's home screen during ESKARA 2026: the festival banner above tiles for the six festival miniapps, the festival guide, festival shuttle, stage timetable, playlist preview, food roulette and booth draw">

Six miniapps built on `@skkuverse/miniapp` ran inside the skkuverse app at ESKARA 2026, Sungkyunkwan University's festival, on 2026-10-01 and 2026-10-02 (KST). The [ESKARA 2026 case study](docs/explanation/case-study-eskara-2026.md) defines each number and lists what the festival changed in the SDK. The app's analytics counted, over those two days:

- 2,118 devices that used the app
- 1,477 devices that used one of the six miniapps or the map's festival layer
- 1,070 devices that used the festival shuttle, the most used miniapp

The miniapps' source lives outside this repository. To watch a miniapp of the same shape run outside the app, open the [stage timetable example in StackBlitz](https://stackblitz.com/github/spencer0124/skkuverse-miniapp/tree/main/examples/stage-timetable?file=src%2FApp.tsx). It runs on the fake host and lists every message it sends to the app.

<br clear="right">

## Get started

Import each part from the entry point that holds it:

```tsx
import { SDSProvider, Button } from '@skkuverse/ui';
import { haptic, openUrl } from '@skkuverse/miniapp';
import { MiniappRoot } from '@skkuverse/miniapp/react';
import { MapButton } from '@skkuverse/miniapp/react/ui';
```

Documentation is indexed in [docs/README.md](docs/README.md). Start with:

- [explanation/architecture.md](docs/explanation/architecture.md), for how the packages, the app and the server fit
- [reference/protocol.md](docs/reference/protocol.md), for the contract with the app
- [reference/miniapp-spec.md](docs/reference/miniapp-spec.md), for what a miniapp or a game must be before skkuverse hosts it
- [explanation/ci-and-branch-protection.md](docs/explanation/ci-and-branch-protection.md), for what CI checks and how `main` and the releases are guarded
- [decisions/0003-spec-checker-in-this-repository.md](docs/decisions/0003-spec-checker-in-this-repository.md), for why the spec, its checker and the game contract live here
- [explanation/case-study-eskara-2026.md](docs/explanation/case-study-eskara-2026.md), for what ran at the festival and what it changed in the SDK

## Check your work

Each command below exits with a non-zero code and names what broke. Run the one that matches your change and read its output, rather than judging the change by eye.

| After you change | Run | It fails when |
| --- | --- | --- |
| A miniapp or a game package | `miniapp-cli check --json` | The package breaks a rule that the [miniapp spec](docs/reference/miniapp-spec.md) marks `checked`. Each finding names its rule ID |
| What a page sends to the app | A test that installs `createFakeHost()` from `@skkuverse/miniapp/testing` | The test's assertions on `host.log` fail. `checkGameContract(host.log)` names each game protocol rule the page broke |
| A built game | `game-contract` | A run breaks the game protocol, with the host there from the start or arriving late |
| This repository | `pnpm check:ci` | A step that CI runs fails: install, build, typecheck, test, package lint, Markdown lint, knip or the owner gate's tests |

The next two sections show where `check` sits on a miniapp's way to the app, and a fake host test in full.

## From a folder to the app

This is the path one miniapp takes from a folder on disk to a screen in the app.

1. **Start the folder.** In a repository laid out as the [CLI README](packages/cli/README.md) describes, `npx @skkuverse/miniapp-cli new <id>` writes `apps/<id>` from the miniapp template. Add `--kind game` for a game under `games/<id>`.
2. **Declare the shell.** `public/skkuverse.json` says how the app frames the page. It holds one key, `shell`, with all four fields:

   ```json
   { "shell": { "bar": "top", "header": "opaque", "statusBar": "dark", "background": "#FFFFFF" } }
   ```

   The fields and their values are in [protocol.md](docs/reference/protocol.md#shell).
3. **Check it against the spec.** Build the page, then run `check`:

   ```sh
   npx @skkuverse/miniapp-cli check --dir . --id <id>   # one miniapp folder, no repository needed
   pnpm exec miniapp-cli check                          # every package in a repository
   ```

   `check` enforces each rule the [miniapp spec](docs/reference/miniapp-spec.md) marks `checked`. The rules are in `packages/cli/src/check.ts`. Each failure prints its rule ID, and the command exits 1.
4. **Ship it.** `pnpm exec miniapp-cli ship <id>` builds the package, checks it again and deploys it with the repository's `wrangler`. `--preview` deploys a preview. A production deploy needs a clean `main` that matches `origin/main`.
5. **Register it.** A maintainer adds the id to the server's registry. The server then fetches the page's `skkuverse.json` and merges its shell into `GET /miniapps/:id`, so the app knows the frame before it opens the page. The server is CommonJS, and `@skkuverse/miniapp/protocol` can be `require`d, but the server does not import it yet. It keeps a hand-copied manifest parser and copies this repository's test vectors by hand. Nothing compares the two copies automatically (skkuverse-server's `docs/reference/miniapps-api.md`, section 3.3).
6. **Talk to the app.** The app injects `window.skkuverse` before the page's script runs. The SDK talks to it over the bridge protocol in `@skkuverse/miniapp/protocol`, described in [protocol.md](docs/reference/protocol.md). The app imports that same module. `./protocol` imports no package, and `packages/miniapp/test/entry-boundaries.test.ts` fails CI if it ever does.

## Test a mini app without the app

`@skkuverse/miniapp/testing` stands in for the app. `createFakeHost()` runs the app's real `hostBootstrapScript` in the test's window and records every message both ways. `checkGameContract()` reads that record and names each rule of the game protocol the page broke.

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

The example stubs `window` because the page guard pins the clock and the timers on `window` for good, and the test's node environment has no `window` to pin them on.

To hold a built game to the same contract without writing a test, run `@skkuverse/game-contract` from the repository root after the build:

```sh
pnpm add -Dw @skkuverse/game-contract
pnpm exec game-contract            # every game under games/
pnpm exec game-contract <id>       # one game
```

It plays each page twice: once with the host there from the start, and once with a host that appears only after the page gave up looking. It exits 1 and names each rule a page broke, so a games repository can run it in CI to keep every game to the contract. The rules and the exit codes are in the [game-contract README](packages/game-contract/README.md).

## Known gaps

- `@skkuverse/ui` and `@skkuverse/tokens` have no tests. CI builds them, type-checks them and runs publint and are-the-types-wrong on them.
- No code linter, such as ESLint, runs on the source. `pnpm lint` is publint and are-the-types-wrong, which check what a package publishes.
- The four token files in `packages/tokens` are copies of skkuverse-app's, and nothing checks that they still match ([why](docs/explanation/ci-and-branch-protection.md#what-ci-does-not-check)).
- `@skkuverse/miniapp-cli` and `@skkuverse/game-contract` depend on `@skkuverse/miniapp` with a caret on a `0.x` version, which never crosses a minor. Each minor release of the SDK therefore needs a release of both.

## Developing

```sh
pnpm install
pnpm check:ci
```

`pnpm check:ci` runs `scripts/check-ci.sh`, the same steps in the same order as CI, and stops at the first one that fails.

To try a change in a miniapp before releasing it, build here, then in the miniapp run
`pnpm link ../../skkuverse-miniapp/packages/<name>`. Never commit the link.

Issues are welcome. Pull requests are by invitation: read [CONTRIBUTING.md](CONTRIBUTING.md) first.
Report a vulnerability privately, as [SECURITY.md](SECURITY.md) describes.
Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md).

## Releasing

Add a changeset with each change (`pnpm changeset`). The release procedure is in
[how-to/release-packages.md](docs/how-to/release-packages.md).

## License

Apache-2.0
