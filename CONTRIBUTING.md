# Contributing

Thanks for your interest in skkuverse-miniapp.

## Issues are welcome

Open an issue for a bug in a package, the CLI or the game contract, unclear documentation or an idea. Say which package and version, what you expected, what happened, and how to reproduce it. For a security problem, do not open an issue: follow [SECURITY.md](SECURITY.md).

## Pull requests are by invitation

These packages run inside the skkuverse app and are maintained by one person, so we accept pull requests only when a maintainer has asked for one, usually in an issue. A pull request that nobody asked for may be closed without review. If you want to work on something, open an issue first and ask.

Workflows on a pull request from a fork wait for a maintainer's approval before they run.

A maintainer may ask Claude about a pull request with `@claude` in a comment.

## How changes flow

- `main` is the only long-lived branch. Every change reaches it through a pull request, from a branch such as `feat/<topic>` or from a fork.
- An invited pull request targets `main`.
- A maintainer versions and publishes the packages from a local checkout ([docs/how-to/release-packages.md](docs/how-to/release-packages.md)). An invited pull request never bumps a version or edits a `CHANGELOG.md`: that is the maintainer's Version Packages pull request.

## Before you open an invited pull request

Run the same checks as CI's `build` job, on the Node version in `.nvmrc` with the pnpm version in `package.json`:

```bash
pnpm check:ci
```

`pnpm test` in the game contract installs its packed tarball with pnpm and npm, so it needs the npm registry.

CI also runs `pnpm test` on Node 22.13.0, the lowest version any package's `engines.node` admits. If your change touches what runs on Node, such as the CLI or the game contract, run `pnpm test` on that version too.

- Follow [CLAUDE.md](CLAUDE.md), and read [docs/explanation/architecture.md](docs/explanation/architecture.md) for how the packages meet the app and the server.
- Add a changeset for a user-visible change to a published package: run `pnpm changeset`, pick the packages and the bump, and commit the generated `.changeset/*.md` with the change. A change to the app protocol is at least a `minor` of `@skkuverse/miniapp`, and follows [docs/how-to/add-a-bridge-method.md](docs/how-to/add-a-bridge-method.md).
- Give a behavior change a test. Never weaken, skip or delete an existing test to get green.
- Do not edit a vendored file listed in `.contracts.lock.json` by hand, such as the four token files in `packages/tokens`: its owner changes it upstream, and the lock pins its hash.
- Write documentation by the rules in [docs/README.md](docs/README.md).
- Write code, comments, docs and commit messages in English. Use conventional commit subjects, such as `fix(cli): …`.

By contributing, you agree that your contribution is licensed under the [Apache License 2.0](LICENSE).

Throwaway line for the V3 stack probe, upper layer. Do not merge.
