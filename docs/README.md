---
title: Docs Index & Conventions
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-26
audience: public
---

# Docs Index & Conventions

> The index of skkuverse-miniapp's documentation, and how to write it. Read this before starting a new document.

## Folder structure (Diátaxis)

Documents are filed under the [Diátaxis](https://diataxis.fr/) categories, the same way skkuverse-app and skkuverse-server file theirs. **The category follows the reader's need, not the subject matter.**

| Folder | Need | Contents |
| --- | --- | --- |
| `tutorials/` | Learning | A guided first run for someone with no context. None yet |
| `how-to/` | Doing | A runbook for one goal |
| `reference/` | Looking up | Contracts and specs |
| `explanation/` | Understanding | Why something is shaped this way |
| `decisions/` | — | ADRs, `NNNN-kebab-title.md` |

A document serves one need. When a procedure and its background start sharing a page, split them and link the halves.

Knowledge local to one package belongs in that package's `README.md`, which is also its npm page.

## Writing rules

- **Frontmatter.** Start from [`_template.md`](_template.md). The keys are `title`, `type`, `status` (`draft`, `accepted`, `superseded`, `deprecated`), `owner`, `last-updated` (ISO date) and `audience` (`internal`, `public`).
- **Language.** Everything under `docs/`, plus `README.md` and `CLAUDE.md`, is English. Korean that is product copy carries a `<!-- conventions:allow-korean: reason -->` marker on its line.
- **Names.** Use kebab-case file names.
- **No copied values.** Point at the file that owns a value rather than copying it. For example, point at `packages/miniapp/src/protocol/messages.ts` rather than restating a limit.
- **Checks.** `pnpm lint:md` runs markdownlint with the fleet's rules. CI also runs the umbrella's `lint_conventions.py` (frontmatter, language, folder names).
- **Vendored files.** `_template.md` and `../.markdownlint.jsonc` are vendored from the umbrella by the `conventions.docs-template` and `conventions.markdownlint` contracts. Edit them upstream, never here.

## Index

### how-to

| Document | Summary |
| --- | --- |
| [create-a-miniapp.md](how-to/create-a-miniapp.md) | From an empty folder to a tile in the app: scaffold, repository, Pages, domain, server registry |
| [lay-out-for-safe-areas.md](how-to/lay-out-for-safe-areas.md) | Padding with `--sv-inset-*` so content clears the device and the app's UI |
| [add-a-bridge-method.md](how-to/add-a-bridge-method.md) | Adding a feature a page asks the app for, and the release order |
| [release-packages.md](how-to/release-packages.md) | Changesets, the local publish, and bumping the miniapps |

### reference

| Document | Summary |
| --- | --- |
| [protocol.md](reference/protocol.md) | The miniapp ↔ app contract: messages, methods, the host object, the shell manifest and the viewport |

### explanation

| Document | Summary |
| --- | --- |
| [architecture.md](explanation/architecture.md) | How the packages, the app's mini-app shell and the server registry fit together, and why |

### decisions

| Document | Status |
| --- | --- |
| [0001-sdk-distribution.md](decisions/0001-sdk-distribution.md) | accepted (amended 2026-09-26: local publishing) |
| [0002-miniapp-protocol-shell-viewport.md](decisions/0002-miniapp-protocol-shell-viewport.md) | accepted |

## Elsewhere

- skkuverse-app: the mini-app shell (`docs/explanation/miniapp-shell.md`) and ADR 0006
- skkuverse-server: the registry API (`docs/reference/miniapps-api.md`) and registering a mini app (`docs/how-to/register-a-miniapp.md`)
- The umbrella, [spencer0124/skkuverse](https://github.com/spencer0124/skkuverse): fleet-wide conventions and the contracts manifest
