# skkuverse-miniapp

[![CI](https://github.com/skkuverse/skkuverse-miniapp/actions/workflows/ci.yml/badge.svg?branch=dev&event=push)](https://github.com/skkuverse/skkuverse-miniapp/actions/workflows/ci.yml?query=branch%3Adev)
[![@skkuverse/miniapp on npm](https://img.shields.io/npm/v/@skkuverse/miniapp?label=%40skkuverse%2Fminiapp)](https://www.npmjs.com/package/@skkuverse/miniapp)
[![@skkuverse/miniapp-cli on npm](https://img.shields.io/npm/v/@skkuverse/miniapp-cli?label=%40skkuverse%2Fminiapp-cli)](https://www.npmjs.com/package/@skkuverse/miniapp-cli)
[![License](https://img.shields.io/npm/l/@skkuverse/miniapp)](LICENSE)

The shared code every skkuverse miniapp imports, and the tools that check, test and ship one.
A miniapp is a small Vite and React page that runs inside the skkuverse app.

| Package | What it is |
| --- | --- |
| [`@skkuverse/miniapp`](packages/miniapp) | Bridge protocol, SDK, React bindings, and a fake host for tests |
| [`@skkuverse/miniapp-cli`](packages/cli) | `check` against the [miniapp spec](docs/reference/miniapp-spec.md), `new` and `ship` |
| [`@skkuverse/game-contract`](packages/game-contract) | Plays a built game against the fake host and holds it to the game protocol |
| [`@skkuverse/ui`](packages/ui) | SKKU Design System for the web: `SDSProvider` and components |
| [`@skkuverse/tokens`](packages/tokens) | Design tokens, copied from the app and hash-checked |

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
5. **Register it.** A maintainer adds the id to the server's registry. The server then fetches the page's `skkuverse.json` and merges its shell into `GET /miniapps/:id`, so the app knows the frame before it opens the page. The server is CommonJS and `@skkuverse/miniapp` is ESM-only, so the server keeps a hand-copied manifest parser and copies this repository's test vectors by hand. Nothing compares the two copies automatically ([miniapps-api.md, section 3.3](https://github.com/skkuverse/skkuverse-server/blob/main/docs/reference/miniapps-api.md#33-the-shell-parser-is-a-mirrored-copy-not-an-import)).
6. **Talk to the app.** The app injects `window.skkuverse` before the page's script runs. The SDK talks to it over the bridge protocol in `@skkuverse/miniapp/protocol`, described in [protocol.md](docs/reference/protocol.md). The app imports that same module. `./protocol` imports no package, and `packages/miniapp/test/entry-boundaries.test.ts` fails CI if it ever does.

## Test a mini app without the app

`@skkuverse/miniapp/testing` stands in for the app. `createFakeHost()` runs the app's real `hostBootstrapScript` in the test's window and records every message both ways. `checkGameContract()` reads that record and names each rule of the game protocol the page broke.

```ts
// @vitest-environment happy-dom
import { expect, it } from 'vitest';
import { bootGame } from '@skkuverse/miniapp/game';
import { checkGameContract, createFakeHost } from '@skkuverse/miniapp/testing';

it('keeps the game contract for one run', async () => {
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

To hold a built game to the same contract without writing a test, run `@skkuverse/game-contract` from the repository root after the build:

```sh
pnpm add -D @skkuverse/game-contract
pnpm exec game-contract            # every game under games/
pnpm exec game-contract <id>       # one game
```

It plays each page twice: once with the host there from the start, and once with a host that appears only after the page gave up looking. It exits 1 and names each rule a page broke. The first-party games' CI plays every game through it. The rules and the exit codes are in the [game-contract README](packages/game-contract/README.md).

## Known gaps

- `@skkuverse/ui` and `@skkuverse/tokens` have no tests. CI builds them, type-checks them and runs publint and are-the-types-wrong on them.
- No code linter, such as ESLint, runs on the source. `pnpm lint` is publint and are-the-types-wrong, which check what a package publishes.
- The vendored contract files in `.contracts.lock.json` are checked only on maintainers' machines. CI does not compare their hashes ([why](docs/explanation/ci-and-branch-protection.md#what-ci-does-not-check)).
- `@skkuverse/miniapp-cli` and `@skkuverse/game-contract` depend on `@skkuverse/miniapp` with a caret on a `0.x` version, which never crosses a minor. Each minor release of the SDK therefore needs a release of both.

## Developing

```sh
pnpm install
pnpm build && pnpm typecheck && pnpm test && pnpm lint && pnpm lint:md && pnpm knip
```

To try a change in a miniapp before releasing it, build here, then in the miniapp run
`pnpm link ../../skkuverse-miniapp/packages/<name>`. Never commit the link.

Issues are welcome. Pull requests are by invitation: read [CONTRIBUTING.md](CONTRIBUTING.md) first.
Report a vulnerability privately, as [SECURITY.md](SECURITY.md) describes.
Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md).

## Releasing

Add a changeset with each change (`pnpm changeset`). To release, run `pnpm changeset version`
on `dev`, commit, merge `dev` into `main` through a PR, then publish from `main` with
`node scripts/publish.mjs`. Both steps are local: CI cannot publish
([npm/cli#9969](https://github.com/npm/cli/issues/9969)). The whole procedure is in
[how-to/release-packages.md](docs/how-to/release-packages.md).

## License

Apache-2.0
