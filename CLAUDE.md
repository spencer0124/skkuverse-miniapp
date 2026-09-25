# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

Documents follow the Diátaxis structure (`docs/how-to|reference|explanation|decisions`). **Before writing or editing any document, read `docs/README.md`**, which is the index and holds the writing rules. `pnpm lint:md` runs markdownlint with rules vendored from the umbrella (`.markdownlint.jsonc`, contract `conventions.markdownlint`), and `docs/_template.md` is vendored the same way. Edit both upstream, never here. Everything under `docs/`, plus `README.md` and this file, is English. Korean product copy carries a `conventions:allow-korean` marker on its line.

## What this repository is

The shared code every skkuverse miniapp imports, published to public npm:

- `packages/tokens` → `@skkuverse/tokens`. Four files (`colors`, `typography`, `spacing`, `radius`) are hash-checked copies of skkuverse-app's token files, under the umbrella contracts `design.*`. Never edit them here. `css.ts` is local.
- `packages/ui` → `@skkuverse/ui`, the web port of the SKKU Design System.
- `packages/miniapp` → `@skkuverse/miniapp`.
  - `src/protocol/` is **the contract with the app**. It has no DOM, no React and no dependencies. skkuverse-app imports it, and skkuverse-server keeps a tested copy of the manifest parser.
  - `src/sdk/` and `src/transport.ts` are the page-side SDK.
  - `src/react/` holds `MiniappRoot` and the hooks. It must never import `@skkuverse/ui`.
  - `src/react/ui/` holds the SDS-styled components.

Read `docs/explanation/architecture.md` for how these meet the app's mini-app shell and the server registry.

## Commands

```bash
pnpm install
pnpm build          # tsup, every package (turbo)
pnpm typecheck
pnpm test           # vitest in packages/miniapp
pnpm lint           # publint + are-the-types-wrong per package
pnpm lint:md        # markdownlint
python3 ../skkuverse/exported/lint_conventions.py --root .
python3 ../skkuverse/exported/sync_contracts.py check --repo miniapp --root .
```

## Constraints

- **The protocol is shared with the app.** Adding a method means an entry in `protocol/messages.ts`, a wrapper in `sdk/`, and a handler in skkuverse-app. See `docs/how-to/add-a-bridge-method.md`. Anything that grants value must be verified by a server, never trusted from a message.
- **Every SDK function is safe outside the app.** Each one is a no-op or a browser fallback, never a throw. The hooks are the exception: they throw outside `MiniappRoot`, on purpose.
- **Entry boundaries are tested.** `./protocol` and `.` import no package, and `./react` never reaches `@skkuverse/ui`. `test/entry-boundaries.test.ts` walks each entry's import graph, so a stray import fails CI.
- **Releases go through Changesets.** Every user-visible change carries a `.changeset/*.md`. CI only opens the Version Packages PR. Publishing is a human running `node scripts/publish.mjs` locally, because npm trusted publishing rejects this repository's OIDC tokens (npm/cli#9969). An agent cannot publish: npm needs an interactive two-factor login. See `docs/how-to/release-packages.md`.
- **Ship order across repositories.** An SDK change ships before the app handles it. The app's OTA with a new shell ships before miniapps that depend on it are merged to production, or the installed app shows them the browser gate.
- **Branches.** Work on `dev`; `main` is merge-only, through a PR. Never put a Claude session link or `Claude-Session:` trailer in commits or PRs.
