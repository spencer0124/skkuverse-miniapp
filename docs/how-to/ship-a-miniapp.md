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

- A repository laid out as the [CLI README](../../packages/cli/README.md) describes, with a `deploy.config.json` at its root.
- For `ship`, `wrangler` installed at the repository root.

## Steps

1. **Start the folder.** `npx @skkuverse/miniapp-cli new <id>` writes `apps/<id>` from the miniapp template. Add `--kind game` for a game under `games/<id>`.
2. **Declare the shell.** `public/skkuverse.json` says how the app frames the page. It holds one key, `shell`, with all four fields:

   ```json
   { "shell": { "bar": "top", "header": "opaque", "statusBar": "dark", "background": "#FFFFFF" } }
   ```

   The fields and their values are in [protocol.md](../reference/protocol.md#shell).
3. **Check it against the spec.** Build the page, then run `check`:

   ```sh
   npx @skkuverse/miniapp-cli check --dir . --id <id>   # one miniapp folder, no repository needed
   pnpm exec miniapp-cli check                          # every package in a repository
   ```

   `check` enforces each rule the [miniapp spec](../reference/miniapp-spec.md) marks `checked`. The rules are in `packages/cli/src/check.ts`. Each failure prints its rule ID, and the command exits 1.
4. **Ship it.** `pnpm exec miniapp-cli ship <id>` builds the package, checks it again and deploys it with the repository's `wrangler`. `--preview` deploys a preview. A production deploy needs a clean `main` that matches `origin/main`.
5. **Register it.** A maintainer adds the id to the server's registry. The server then fetches the page's `skkuverse.json` and merges its shell into `GET /miniapps/:id`, so the app knows the frame before it opens the page. The server is CommonJS, and `@skkuverse/miniapp/protocol` can be `require`d, but the server does not import it yet. It keeps a hand-copied manifest parser and copies this repository's test vectors by hand. Nothing compares the two copies automatically (skkuverse-server's `docs/reference/miniapps-api.md`, section 3.3).
6. **Talk to the app.** The app injects `window.skkuverse` before the page's script runs. The SDK talks to it over the bridge protocol in `@skkuverse/miniapp/protocol`, described in [protocol.md](../reference/protocol.md). The app imports that same module. `./protocol` imports no package, and `packages/miniapp/test/entry-boundaries.test.ts` fails CI if it ever does.

## Troubleshooting

- `check` prints `no dist/ (run the build first)` under rule `O1`. Build the package, then run `check` again.
- `ship` refuses a production deploy from a branch other than `main`, or from a `main` that differs from `origin/main`. Use `--preview`, or merge first.

## Related

- [Test a miniapp without the app](test-without-the-app.md), for the fake host and the game contract
- [architecture.md](../explanation/architecture.md), for how the packages, the app and the server fit
