---
title: Release The Packages
type: how-to
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-09-26
audience: internal
---

# Release the packages

> How a change here becomes a new `@skkuverse/*` version on npm and reaches the miniapps. For whoever merges a change that miniapps need.

## Overview

Versions are managed by [Changesets](https://github.com/changesets/changesets). CI opens a "Version Packages" PR. Publishing is done by hand from a local checkout, because CI cannot publish yet (see [Troubleshooting](#troubleshooting)).

```text
change + changeset ──▶ dev ──PR──▶ main ──▶ release.yml opens "Version Packages" PR
                                                   │ merge
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
2. **Merge to `main`.** Open a PR from `dev`. CI runs build, typecheck, tests, publint, are-the-types-wrong, markdownlint, conventions and contract integrity. Merge when green.
3. **Merge the Version PR.** `release.yml` opens or updates "Version Packages", which bumps versions and writes the changelogs. Actions-created PRs run no CI; the diff is only versions and changelogs.
4. **Publish.**

   ```sh
   cd ~/project/skkuverse/skkuverse-miniapp
   git checkout main && git pull
   pnpm install && pnpm build && node scripts/publish.mjs
   ```

   `scripts/publish.mjs` publishes, in dependency order, every package whose version npm does not have yet, and skips the rest. It packs with pnpm, which rewrites `workspace:` ranges, and publishes with npm. Expect one browser prompt per package.
5. **Check.** `npm view` can serve a stale local cache, so ask the registry directly:

   ```sh
   curl -s https://registry.npmjs.org/@skkuverse%2Fminiapp | grep -o '"latest":"[^"]*"'
   ```

6. **Bump the miniapps.** In each miniapp, raise the range in `apps/webview/package.json`, run `pnpm install`, then typecheck, test and build, and push `dev`. Their `pnpm-workspace.yaml` excludes `@skkuverse/*` from pnpm's release-age delay, so the new version installs at once.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| CI publishing fails with `OIDC token exchange error - package not found` | npm trusted publishing rejects the immutable `sub` claim GitHub gives repositories created after 2026-07-15 ([npm/cli#9969](https://github.com/npm/cli/issues/9969)). This repository cannot opt out. | Publish locally. When npm fixes it, add `publish: pnpm release` back to the changesets step in `release.yml`. The trusted publishers are already configured. |
| `ERR_PNPM_OTP_NON_INTERACTIVE` | Publishing from a non-interactive shell | Run it in your own terminal |
| `pnpm install` in a miniapp gets `404` right after a publish | npm's install metadata (`application/vnd.npm.install-v1+json`) lags the full document by a few minutes | Wait and retry |
| "Version Packages" PR is not created | Actions may not create PRs | Repository settings → Actions → allow GitHub Actions to create pull requests (already on) |

## Related

- [0001-sdk-distribution](../decisions/0001-sdk-distribution.md) — why npm, and why publishing is local for now
- [add-a-bridge-method](add-a-bridge-method.md) — the release order for a protocol change
