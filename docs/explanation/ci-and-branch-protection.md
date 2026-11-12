---
title: CI and Branch Protection
type: explanation
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-12
audience: public
---

# CI and branch protection

> What checks a change before it reaches `main` and npm, which repository settings back those checks, and what is still checked only on a maintainer's machine. Read it before you change a workflow, a ruleset or the release path.

## Context

This repository is public and publishes five npm packages that every skkuverse miniapp imports or builds with. One person maintains it. So the guards have two jobs. They stop a mistake before it reaches npm, and they keep a stranger's pull request, or a compromised dependency, from reaching a token that can write.

Work lands on `dev`, by a maintainer's push or an invited pull request. `main` is the release branch and takes only the `dev` to `main` pull request. No workflow publishes. A maintainer publishes from a local checkout of `main`.

## Structure

```text
 push to dev ──────────────┐
 pull request to dev ──────┼──▶ ci.yml: build, test (node 22.13.0), ci / *
 pull request to main ─────┘         + CodeQL, GitGuardian, CodeRabbit
          │                          + owner-gate.yml (to main only)
          ▼
 main ruleset: required checks, merge commit only, threads resolved
          │
          ▼
 maintainer's terminal: node scripts/publish.mjs ──▶ npm
```

### Workflows

| Workflow | Runs on | Token | Secret | Does |
| --- | --- | --- | --- | --- |
| [`ci.yml`](../../.github/workflows/ci.yml) | Pull requests to `dev` or `main`, and pushes to `dev` | `contents: read` | None | Jobs `build`, `test (node 22.13.0)` and `ci`, below |
| [`claude.yml`](../../.github/workflows/claude.yml) | An issue or pull request comment that mentions `@claude` from an owner, member or collaborator | `contents: read`, `pull-requests: write`, `issues: write`, `actions: read` | `CLAUDE_CODE_OAUTH_TOKEN`, in the `claude` environment | Answers in the thread, read-only |
| [`owner-gate.yml`](../../.github/workflows/owner-gate.yml) | Pull requests to `main` (`pull_request_target`) | `pull-requests: write` | None | Fails when a listed file changed without the `owner-approved` label |

`ci.yml` has these jobs:

- `build` installs with `pnpm install --frozen-lockfile`, then runs `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint` (publint, and are-the-types-wrong on the three packages that ship types), `pnpm lint:md` and `pnpm knip`.
- `test (node 22.13.0)` runs `pnpm test` on Node 22.13.0 and the npm it bundles. That is the lowest Node any package's `engines.node` admits, so the game contract's installed-package test runs with the oldest npm a user can have.
- `ci` calls the organization's shared workflow, [`checks.yml`](https://github.com/skkuverse/.github/blob/285b8226d57b25c620521056c52cc0d7c685a917/.github/workflows/checks.yml), pinned to a commit. Its node toolchain runs `npm ci`, which a pnpm workspace cannot, so this repository passes `toolchain: none` and `check-cmd: "true"`. `ci / check` therefore checks out the code and runs nothing else. `ci / workflows` runs actionlint and zizmor over `.github/`, after checking each downloaded archive against a pinned sha256. zizmor runs online, so it also checks that each pinned commit belongs to its action and matches its version comment. `ci / dependency-review` fails a pull request that adds a dependency with a known vulnerability of high severity or worse. `ci / gate` passes only when each of the other three succeeded or was skipped.

### Rulesets

| Ruleset | Applies to | Rules |
| --- | --- | --- |
| `creation-window` | Every branch except `dependabot/**` | Nobody can create a branch in this repository. Dependabot can. A contributor works from a fork |
| `dev` | `dev` | No deletion, no force push |
| `main` | `main` | No deletion, no force push. A pull request is required, merged with a merge commit only, with every review thread resolved. Required checks are `build`, `ci / gate`, `GitGuardian Security Checks` and `CodeRabbit`, and the branch must be up to date with `main`. CodeQL results gate the merge: an error alert, or a security alert of high severity or worse |
| `owner-updates` | `dev` and `main` | Blocks every update to either branch. The repository admin role bypasses it, so only an admin pushes to `dev` or merges into `main` |

### Repository settings

- **Actions.** Every action must be pinned to a full commit SHA. The default workflow token is read-only and cannot approve pull requests. A pull request from any external contributor waits for a maintainer to approve its workflow runs.
- **Code scanning.** CodeQL default setup scans the JavaScript and TypeScript code and the workflows, on each pull request and weekly.
- **Secrets.** Secret scanning is on, with push protection. The repository holds no Actions secret of its own. The one secret lives in the `claude` environment, which admits only `main`.
- **Vulnerabilities.** Private vulnerability reporting is on ([SECURITY.md](../../SECURITY.md)). Dependabot alerts and Dependabot security updates are on.
- **Owners.** `.github/CODEOWNERS` names the maintainer for every path. The `main` ruleset requires no approving review, so the required checks and the resolved threads are what gate a merge.

### The owner gate

A pull request to `main` that changes a file listed in [`.github/owner-gate-paths`](../../.github/owner-gate-paths), such as a workflow, `scripts/publish.mjs` or `pnpm-workspace.yaml`, needs the maintainer's `owner-approved` label. [`owner-gate.yml`](../../.github/workflows/owner-gate.yml) checks it. It runs on `pull_request_target`, so the definition comes from `main` and the pull request cannot change the check that judges it. It checks out nothing and runs no code from the pull request. It reads the changed files, the labels and the list through the API. A pushed commit that changes a listed file removes the label, and the maintainer adds it again after reading that commit.

## Supply chain

- **Release age.** `pnpm-workspace.yaml` sets `minimumReleaseAge` to 7200 minutes, so an install takes no release younger than 5 days. `@skkuverse/*` is excluded, so a release of these packages installs as soon as it is published. Dependabot's version updates for actions wait the same 5 days (`cooldown` in `.github/dependabot.yml`).
- **Install scripts.** pnpm runs a dependency's install script only when `allowBuilds` names it. Only `esbuild` is named.
- **Advisories.** `overrides` in `pnpm-workspace.yaml` holds `esbuild`, `katex` and `re2js` on fixed releases, each with the advisory it closes and the condition for removing it.
- **Dependabot.** Action pins get one grouped pull request a month into `dev`. npm gets security updates only, which GitHub opens against `main`. Dependencies are otherwise bumped by hand, with a changeset when a published package changes.
- **Unused code.** knip fails CI on a file nothing imports, or a dependency nothing uses or nothing declares. `knip.json` turns off the export, type and duplicate rules.
- **Audit.** `pnpm audit` is not a CI step. Dependency review covers what a pull request adds, and Dependabot alerts cover what is already in the lockfile.

## Releases

Releases go through [Changesets](https://github.com/changesets/changesets), all from a local checkout. A maintainer runs `pnpm changeset version` on `dev`, commits the result and merges `dev` into `main` through the usual pull request. Then a maintainer runs `node scripts/publish.mjs` from `main`. The script packs each package with pnpm, which rewrites `workspace:` ranges, and publishes every version npm does not have yet with npm.

Publishing stays with a person for two reasons. npm trusted publishing rejects this repository's OIDC tokens ([npm/cli#9969](https://github.com/npm/cli/issues/9969)). Without it, `npm publish` needs an interactive two-factor login. The steps are in [release-packages](../how-to/release-packages.md).

## What CI does not check

- **The vendored contract files.** `.contracts.lock.json` pins the hash of each file this repository vendors from outside it, such as `.markdownlint.jsonc`, `docs/_template.md` and four token files. CI does not compare those hashes. A maintainer runs `sync_contracts.py check` from a sibling checkout of the umbrella repository.
- **The docs conventions.** `lint_conventions.py`, which checks frontmatter, language and folder names, also runs only from that sibling checkout. `pnpm lint:md` does run in CI.
- **The Node floor as a merge gate.** `test (node 22.13.0)` runs on every pull request, but the `main` ruleset does not list it as a required check.

## Rationale and trade-offs

**A fork's pull request runs the same CI as the maintainer's.** No job in `ci.yml` holds a secret and its token only reads. So the checks need no second, trusted path, and a contributor sees the same failures the maintainer would. The cost is that CI cannot run anything that needs a credential, which is one reason publishing is local.

**The secret sits behind four locks.** An issue comment runs in this repository's context even on a fork's pull request. So `claude.yml` checks the commenter's association on the job, keeps the token in an environment that admits only `main`, gives Claude the job's own read-only token and no `id-token` permission, and blocks every tool that writes or pushes. A prompt injection in a pull request can make Claude say something, but it cannot make Claude push.

**`pull_request_target` is used once, and with no checkout.** The trigger runs with the base repository's token, so a workflow that checks out and runs a pull request's code under it hands that code the token. The owner gate needs the token only to read the pull request and remove a label, and it never runs the pull request's code. zizmor flags the trigger, and the workflow records why it is suppressed.

**The contract hashes stay local for now.** Checking them in CI needs the umbrella repository's manifest, which is private, or a generated public slice of it. CI cloned the umbrella with a deploy key until 2026-11-10, and that job was removed with the key. Until a public slice exists, a drifted vendored file is caught only when a maintainer runs the check.

## Related

- [CONTRIBUTING.md](../../CONTRIBUTING.md): how changes flow, and the checks to run before an invited pull request
- [SECURITY.md](../../SECURITY.md): how to report a vulnerability
- [release-packages](../how-to/release-packages.md): the release steps
- [0001-sdk-distribution](../decisions/0001-sdk-distribution.md): why the packages are on npm and why publishing is local
