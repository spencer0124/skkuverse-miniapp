---
title: Release The Packages
type: how-to
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-10
audience: internal
---

# Release the packages

> How a change here becomes a new `@skkuverse/*` version on npm and reaches the miniapps. For whoever merges a change that miniapps need.

## Overview

Versions are managed by [Changesets](https://github.com/changesets/changesets), entirely from a local checkout. A maintainer versions the packages on `dev`, merges to `main` through the usual PR, and publishes from `main`. No workflow versions or publishes: a PR that a workflow opens with its own token starts no checks, so it could never meet `main`'s required checks. Publishing stays local because npm trusted publishing rejects this repository's OIDC tokens ([npm/cli#9969](https://github.com/npm/cli/issues/9969)), and without it npm needs a person at a web two-factor login.

```text
change + changeset ──▶ dev
                        │ local: pnpm changeset version, commit
                        ▼
                       dev ──PR──▶ main
                                    │
                                    ▼
                local: node scripts/publish.mjs ──▶ npm
                                    │
                      miniapps bump their dependency
```

## Prerequisites

- An npm account with publish rights on the `@skkuverse` scope and two-factor authentication.
- Your own terminal. `npm publish` needs an interactive web login, which a script or an agent's shell cannot complete.

## Steps

1. **Add a changeset with the change.** Run `pnpm changeset`, pick the packages and the bump, and commit the generated `.changeset/*.md` with the code.
   - `patch` is for fixes.
   - `minor` is for anything new, and for breaking changes while the packages are 0.x.
   - A protocol change is at least a `minor` of `@skkuverse/miniapp`.
   - A `minor` of `@skkuverse/miniapp` also needs a changeset for `@skkuverse/miniapp-cli`. The CLI depends on the SDK with a `0.x` caret, which never crosses a minor, so the CLI keeps the old copy until it is released.
2. **Version on `dev`.** When the pending changesets should ship, run this on an up-to-date `dev`:

   ```sh
   pnpm changeset version
   ```

   It bumps each package's version, writes its `CHANGELOG.md` and deletes the consumed changesets. Review the diff, which should be only versions, changelogs and the deleted changesets, and commit it as `chore: version packages`.
3. **Merge to `main`.** Open a PR from `dev`. CI runs build, typecheck, tests, publint, are-the-types-wrong and markdownlint, and lints the workflows. Merge when green.
4. **Publish.** From a clean checkout of `main` that matches `origin/main`:

   ```sh
   git checkout main && git pull
   pnpm install && pnpm build && node scripts/publish.mjs
   ```

   `scripts/publish.mjs` publishes, in dependency order, every package whose version npm does not have yet, and skips the rest. It packs with pnpm, which rewrites `workspace:` ranges, and publishes with npm. Expect one browser prompt per package.
5. **Check.** `npm view` can serve a stale local cache, so ask the registry directly:

   ```sh
   curl -s https://registry.npmjs.org/@skkuverse%2Fminiapp | grep -o '"latest":"[^"]*"'
   ```

6. **Bump the miniapps.** In skkuverse-mini, raise the range in the catalog (`pnpm-workspace.yaml`) once for every miniapp, raise `@skkuverse/miniapp-cli` and `@skkuverse/game-contract` in its `package.json`, run `pnpm install`, then `pnpm typecheck && pnpm test && pnpm build && pnpm check`, and push `dev`. The workspace excludes `@skkuverse/*` from pnpm's release-age delay, so the new version installs at once. A new minor needs the catalog bump: a `0.x` caret never crosses one. Ship each miniapp that should pick it up.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `ERR_PNPM_OTP_NON_INTERACTIVE` | Publishing from a non-interactive shell | Run it in your own terminal |
| `publish.mjs` skips every package | The versions on `main` are already on npm: step 2 was skipped, or its commit has not reached `main` | Version on `dev` and merge it first |
| `pnpm install` in a miniapp gets `404` right after a publish | npm's install metadata (`application/vnd.npm.install-v1+json`) lags the full document by a few minutes | Wait and retry |

## Related

- [0001-sdk-distribution](../decisions/0001-sdk-distribution.md) — why npm, and why versioning and publishing are local
- [add-a-bridge-method](add-a-bridge-method.md) — the release order for a protocol change
