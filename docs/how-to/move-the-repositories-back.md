---
title: Move The Repositories Back
type: how-to
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: internal
---

# Move the repositories back

> How to point every GitHub link in this repository at a new owner, and what to do on GitHub and npm afterwards. For whoever moves skkuverse-miniapp to another account or organization.

## Overview

Every link to a skkuverse repository in a tracked file names the owner that `repo-links.json` holds. A check in `packages/repo-checks` fails when a link names another owner or a repository that is not on the file's `public` list. When the check fails, it prints the command that rewrites the links.

The check reads `package.json` `repository.url` and `homepage`, the badges in `README.md`, the issue template and every other tracked text file. It uses no network.

The check reads links only. Five things stay manual: the `source` field of each file under `.github/rulesets/`, the maintainer account in `.github/CODEOWNERS`, `.github/owner-gate-owners` and `.github/owner-gate/test.sh`, enabling Pages, pushing the release tags, and publishing each package once so that npm shows the new `repository.url`.

## Prerequisites

- The new repository exists, is empty, and you can push to it.
- Perl and Git are on your `PATH`. The rewrite command uses both.
- A clean working tree on a branch cut from `main`.

## Steps

1. Change `owner` in `repo-links.json` to the new account name. Leave `public` as it is unless a repository joined or left the public set.
2. Run `pnpm --filter repo-checks test`. The test fails. Each failure line names a `path:line`, and the last line starts with `Rewrite each link to a public repository with:`.
3. Copy the command on that last line and run it from the repository root. It rewrites the https, `git@`, `raw.githubusercontent.com`, `api.github.com/repos` and `github.io` forms and leaves a link to any repository outside `public` alone.
4. Run `pnpm test`. It passes when no link is left at the old owner. If it still fails with `is not in public`, remove the link, or add the repository to `public` when the repository is public.
5. Search for the old account name outside links with `git ls-files -z | xargs -0 grep -n -i '<old-owner>'`. The `source` field of each file under `.github/rulesets/` holds `<owner>/<repo>`, and `.github/CODEOWNERS`, `.github/owner-gate-owners` and the `owner=` line of `.github/owner-gate/test.sh` (line 28) name the maintainer account. Change each of these by hand when the account that owns them changes, then run `bash scripts/check-ci.sh`, which runs the owner-gate test against the new account.
6. Commit the change and merge it into `main` through a pull request.
7. If a workflow publishes a Pages site, enable GitHub Pages on the new repository and set the source to GitHub Actions.
8. Push the release tags to the new repository. The `release-tags` ruleset blocks moving or deleting a tag, so push each tag once. Replace `<new-owner>` with the new account name:

   ```sh
   git push https://github.com/<new-owner>/skkuverse-miniapp.git 'refs/tags/@skkuverse/*:refs/tags/@skkuverse/*'
   ```

9. Point `origin` at the new repository:

   ```sh
   git remote set-url origin https://github.com/<new-owner>/skkuverse-miniapp.git
   ```

10. Release each package once. npm shows the `repository.url` of a package's latest version, so a package keeps the old URL until its next release. Follow [release-packages.md](release-packages.md).

## Troubleshooting

- **The check names a file you did not expect.** It reads every file that `git ls-files` lists. Run `git ls-files -z | xargs -0 grep -n -i '<old-owner>/skkuverse'` to see the same lines.
- **The rewrite changed nothing.** The command rewrites only a repository on `public`. A repository outside that list needs a manual edit.
- **A link to a private repository fails under every owner.** A public repository must not send its readers to a private one. Remove the link.

## Related

- [release-packages.md](release-packages.md) — how a change becomes a published version
- [docs/README.md](../README.md) — writing rules
