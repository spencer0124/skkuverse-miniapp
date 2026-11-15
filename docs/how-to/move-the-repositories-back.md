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

The check reads links only. Eight things stay manual: the `source` field of each file under `.github/rulesets/`, the maintainer account in `.github/CODEOWNERS`, `.github/owner-gate-owners` and `.github/owner-gate/test.sh`, enabling Pages, pushing the release tags, installing the apps and CodeQL that the `main` ruleset requires, creating the `owner-approved` label, recreating the rulesets, and publishing each package once so that npm shows the new `repository.url`.

## Prerequisites

- The new repository exists, is empty, and you can push to it.
- Every repository on the `public` list of `repo-links.json`, including `skkuverse-server` and `skkuverse-app`, exists under the new owner. The rewrite points links at all of them. A repository that stays behind cannot be linked: a link to a repository outside `public` fails under every owner, so remove that link.
- Perl and Git are on your `PATH`. The rewrite command uses both.
- A clean working tree on a branch cut from `main`.

## Steps

1. Change `owner` in `repo-links.json` to the new account name. Leave `public` as it is unless a repository joined or left the public set.
2. Run `pnpm --filter repo-checks test`. The test fails. Each failure line names a `path:line`. Find the line that starts with `Rewrite each link to a public repository with:`. Other lines can follow it.
3. Copy the command after that prefix and run it from the repository root. It rewrites the https, `git@`, `raw.githubusercontent.com`, `api.github.com/repos` and `github.io` forms and leaves a link to any repository outside `public` alone.
4. Run `pnpm test`. It passes when no link is left at the old owner. If it still fails with `is not in public`, remove the link, or add the repository to `public` when the repository is public.
5. Search for the old account name outside links with `git ls-files -z | xargs -0 grep -n -i '<old-owner>'`. The `source` field of each file under `.github/rulesets/` holds `<owner>/<repo>`, and `.github/CODEOWNERS`, `.github/owner-gate-owners` and the `owner=` line of `.github/owner-gate/test.sh` (line 28) name the maintainer account. Change each of these by hand when the account that owns them changes, then run `bash scripts/check-ci.sh`, which runs the owner-gate test against the new account.
6. Commit the change and merge it into `main` through a pull request.
7. Push the merged `main` to the new repository, then make it the default branch. The pull request merges on GitHub, so your local `main` does not hold the rewrite until you fetch. Push `origin/main`, not `main`. Replace `<new-owner>` with the new account name:

   ```sh
   git fetch origin
   git push https://github.com/<new-owner>/skkuverse-miniapp.git origin/main:refs/heads/main
   gh repo edit <new-owner>/skkuverse-miniapp --default-branch main
   gh repo view <new-owner>/skkuverse-miniapp --json defaultBranchRef --jq .defaultBranchRef.name
   gh api repos/<new-owner>/skkuverse-miniapp/contents/repo-links.json --jq .content | base64 -d | grep '"owner"'
   ```

   The third command prints `main`, and the last prints the `owner` line with `<new-owner>`. If it prints the old owner, you pushed a `main` without the rewrite.

8. If a workflow publishes a Pages site, enable GitHub Pages on the new repository and set the source to GitHub Actions.
9. Push the release tags to the new repository. The `release-tags` ruleset blocks moving or deleting a tag, so push each tag once. `git fetch origin` alone can leave release tags out of your clone, so fetch the old remote's tags explicitly, push them, and compare the counts. Replace `<new-owner>` with the new account name:

   ```sh
   git fetch origin --tags
   git push https://github.com/<new-owner>/skkuverse-miniapp.git 'refs/tags/@skkuverse/*:refs/tags/@skkuverse/*'
   git ls-remote --tags origin '@skkuverse/*' | grep -vc '\^{}'
   git ls-remote --tags https://github.com/<new-owner>/skkuverse-miniapp.git '@skkuverse/*' | grep -vc '\^{}'
   ```

   The two counts must match. If the second is lower, rerun the push after `git fetch origin --tags`.

10. Point `origin` at the new repository:

    ```sh
    git remote set-url origin https://github.com/<new-owner>/skkuverse-miniapp.git
    ```

11. Install what the `main` ruleset requires, so release pull requests are not blocked. Read the requirements from the file, not from memory:

    ```sh
    jq -r '.rules[] | select(.type == "required_status_checks") | .parameters.required_status_checks[] | "\(.context)\t\(.integration_id)"' .github/rulesets/main.json
    jq -r '.rules[] | select(.type == "code_scanning") | .parameters.code_scanning_tools[].tool' .github/rulesets/main.json
    ```

    The first command lists each required check and the id of the GitHub App that reports it. The id `15368` is GitHub Actions, which needs Actions enabled on the new repository. Install every other app on the new repository (the ruleset names GitGuardian and CodeRabbit today). The second command lists the code scanning tools. For `CodeQL`, enable default setup, and for each secret or environment that `.github/workflows/` uses, such as the `claude` environment and its `CLAUDE_CODE_OAUTH_TOKEN`, create it too:

    ```sh
    gh api -X PATCH repos/<new-owner>/skkuverse-miniapp/code-scanning/default-setup -f state=configured
    gh api repos/<new-owner>/skkuverse-miniapp/code-scanning/default-setup --jq .state
    ```

    The last command prints `configured`. Then open a test pull request from a throwaway branch and list what reports on its head commit:

    ```sh
    gh api repos/<new-owner>/skkuverse-miniapp/commits/<test-pr-head-sha>/check-runs --jq '.check_runs[] | "\(.name)\t\(.app.id)"'
    ```

    Every context and id from the first command must appear in this output, and the CodeQL analysis must finish. A check that never appears would block every pull request once the ruleset exists. Close the test pull request.

12. Create the `owner-approved` label, which the required `gate` check reads (`.github/owner-gate/gate.sh`). Copy the description and colour from the live label:

    ```sh
    gh label list -R <old-owner>/skkuverse-miniapp --search owner-approved --json name,description,color
    gh label create owner-approved -R <new-owner>/skkuverse-miniapp --description "<description>" --color "<color>"
    ```

    Then confirm that an account listed in `.github/owner-gate-owners` can apply it: that account adds the label to a throwaway test pull request, and the `gate` check on that pull request turns green. Close the pull request afterwards.
13. Recreate the rulesets on the new repository. Nothing in this repository applies the files under `.github/rulesets/` for you, so until you create each ruleset there from its file, `main` is unprotected and the daily drift job fails on the new repository. Create each one, then compare the live rulesets with the files:

    ```sh
    for f in .github/rulesets/*.json; do
      jq 'del(.source, .source_type)' "$f" | gh api -X POST repos/<new-owner>/skkuverse-miniapp/rulesets --input -
    done
    bash .github/rulesets/compare.sh <new-owner>/skkuverse-miniapp --keep-bypass
    ```

    When the live rulesets match the files, the comparison prints `compare.sh: the 3 live rulesets of <new-owner>/skkuverse-miniapp match .github/rulesets (--keep-bypass)` and exits 0.
14. Release each package once. npm shows the `repository.url` of a package's latest version, so a package keeps the old URL until its next release. Follow [release-packages.md](release-packages.md).

## Troubleshooting

- **The check names a file you did not expect.** It reads every file that `git ls-files` lists. Run `git ls-files -z | xargs -0 grep -n -i '<old-owner>/skkuverse'` to see the same lines.
- **The rewrite changed nothing.** The command rewrites only a repository on `public`. A repository outside that list needs a manual edit.
- **A link to a private repository fails under every owner.** A public repository must not send its readers to a private one. Remove the link.

## Related

- [release-packages.md](release-packages.md) — how a change becomes a published version
- [docs/README.md](../README.md) — writing rules
