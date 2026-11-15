---
title: Ship A Miniapp
type: how-to
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Ship a miniapp

> The path one miniapp takes from a folder on disk to a screen in the skkuverse app, and the command that checks each step. For anyone building a miniapp or a game.

## Overview

`@skkuverse/miniapp-cli` writes the folder, checks it against the [miniapp spec](../reference/miniapp-spec.md) and deploys it. A maintainer then registers it, and the app opens it.

## Prerequisites

- A repository laid out as the [CLI README](../../packages/cli/README.md) describes, with a `deploy.config.json` at its root and `@skkuverse/miniapp-cli` installed (`pnpm add -Dw @skkuverse/miniapp-cli`).
- For `ship`, `wrangler` installed at the repository root.

## Steps

1. **Start the folder.** `pnpm exec miniapp-cli new <id>` writes `apps/<id>` from the miniapp template, with a `public/skkuverse.json`. Add `--kind game` for a game under `games/<id>`.
2. **Add it to `deploy.config.json`.** Every command needs the entry, and `check` fails rule R4 without it. A miniapp goes under `apps` and deploys to the Pages project `miniapp-<id>`. A game goes under `games` with the project `game-<id>`:

   ```json
   { "apps": { "<id>": { "project": "miniapp-<id>" } }, "games": {} }
   ```

   Add `host` and `hostReason` only for a host that is an exception to rule R4.
3. **Install it.** `pnpm install` links the new package and installs `@skkuverse/miniapp`, which rule S4 needs.
4. **Declare the shell.** `public/skkuverse.json` says how the app frames the page. It holds one key, `shell`, with all four fields:

   ```json
   { "shell": { "bar": "top", "header": "opaque", "statusBar": "dark", "background": "#FFFFFF" } }
   ```

   The fields and their values are in [protocol.md](../reference/protocol.md#shell).
5. **Check it against the spec.** Build the page, then run `check`:

   ```sh
   pnpm --filter ./apps/<id> build                          # write apps/<id>/dist, or ./games/<id> for a game
   pnpm exec miniapp-cli check <id>                         # one package in the repository
   pnpm exec miniapp-cli check                              # every package in the repository
   npx @skkuverse/miniapp-cli check --dir <path> --id <id>  # one miniapp folder, no deploy.config.json needed
   ```

   `check` reads files, and enforces the `checked` rules of the [miniapp spec](../reference/miniapp-spec.md) that are about files. The rules are in `packages/cli/src/check.ts`. N1 to N4 are about what the page does, so `check` does not hold them. `pnpm exec miniapp-contract <id>` does, in Chromium, against the built `dist/` (see `packages/miniapp-contract/README.md`). Run both before you ship. Each failure prints its rule ID, and the command exits 1.
6. **Ship it.** `pnpm exec miniapp-cli ship <id>` builds the package, checks it again and deploys it with the repository's `wrangler`. `--preview` deploys a preview. A production deploy needs a clean `main` that matches `origin/main`.
7. **Register it.** A maintainer adds the id to the server's registry. The server then fetches the page's `skkuverse.json` and merges its shell into `GET /miniapps/:id`, so the app knows the frame before it opens the page. The server is CommonJS, and `@skkuverse/miniapp/protocol` can be `require`d, but the server does not import it yet. It keeps a hand-copied manifest parser and copies this repository's test vectors by hand. Nothing compares the two copies automatically (skkuverse-server's `docs/reference/miniapps-api.md`, section 3.3).
8. **Talk to the app.** The app injects `window.skkuverse` before the page's script runs. The SDK talks to it over the bridge protocol in `@skkuverse/miniapp/protocol`, described in [protocol.md](../reference/protocol.md). The app imports that same module. `./protocol` imports no package, and `packages/miniapp/test/entry-boundaries.test.ts` fails CI if it ever does.

## Troubleshooting

- `check` prints `no dist/ (run the build first)` under rule `O1`. Build the package, then run `check` again.
- `ship` refuses a production deploy from a branch other than `main`, or from a `main` that differs from `origin/main`. Use `--preview`, or merge first.

## Related

- [Test a miniapp without the app](test-without-the-app.md), for the fake host and the game contract
- [architecture.md](../explanation/architecture.md), for how the packages, the app and the server fit
