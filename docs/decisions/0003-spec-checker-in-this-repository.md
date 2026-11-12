---
title: The Spec Checker and the Game Contract Live Beside the Spec
type: adr
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-12
audience: public
---

# ADR 0003. The spec checker and the game contract live beside the spec

> The miniapp spec, the CLI that enforces it, the runner that holds a game to the protocol contract and the templates `new` scaffolds all live in this repository. They ship as two npm packages of built JavaScript, `@skkuverse/miniapp-cli` and `@skkuverse/game-contract`.

## Status

accepted (2026-11-10)

## Context

The [miniapp spec](../reference/miniapp-spec.md) was public in this repository, and every `checked` rule in it pointed at `check.ts`. That file, the game contract runner and the scaffold templates lived in skkuverse-mini, the private repository of the first-party miniapps. Three problems followed.

1. **A reader could not see what a rule meant in code.** The spec said a rule was enforced, and the enforcing file returned 404 to anyone outside the team.
2. **A rule change touched two repositories.** The spec says a new rule lands together with its check. With the spec here and the check there, "together" meant two pull requests that nothing tied to each other.
3. **The contract rules and the runner were split the same way.** `checkGameContract` and its rules are in `@skkuverse/miniapp/testing`, here. The runner that plays every game against them was in the private repository, so nobody outside it could run the contract on a game.

## Decision

**One repository holds the spec, its checker and its tests.** `packages/cli` holds `check`, `new` and `ship`, with `src/check.ts` implementing the `checked` rules and `templates/` holding what `new` scaffolds. `packages/game-contract` plays a built game against `createFakeHost` and holds it to `checkGameContract`. A spec rule, its check and its test now change in one pull request. The code moved with its history: `git log -- packages/cli packages/game-contract` starts at the first CLI commit of 2026-10-05, with the original dates.

**Two packages, not one.** Installed, `@skkuverse/miniapp-cli` is 320 KiB across 3 packages. `@skkuverse/game-contract` is 58,772 KiB across 57 packages, because it runs each page in vitest with happy-dom. A miniapp that is not a game never runs the game contract, so the runner is a package of its own rather than a subcommand of `check`.

**Both packages ship built JavaScript.** Node refuses to strip types from a `.ts` file under `node_modules`. Running the CLI's source from an install failed with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` on Node 22.23.4 and 26.12.1. `tsup` builds each package to `dist/`, and the CLI ships `templates/` beside it.

## Consequences

- **The move kept the behavior.** On 12 healthy packages, and on about 20 planted violations (142 normalized lines of output), the packed CLI printed byte-identical output to the private copy. `new` produced byte-identical folders, and `ship` passed the same arguments to a stub `wrangler`.
- **The built CLI starts faster.** A `check` took 105 ms where the TypeScript source took 126 ms on Node 26.12.1, and 79 ms against 94 ms on Node 22.23.4 (medians of 9 and 7 interleaved runs).
- **The CLI follows each SDK minor.** It depends on `@skkuverse/miniapp` with a caret on a `0.x` version, and such a caret never crosses a minor. Each minor release of the SDK therefore needs a CLI release.
- **An unrelated `miniapp-cli` exists on npm.** Run the scoped name, `npx @skkuverse/miniapp-cli`, or `pnpm exec miniapp-cli` inside an install. A bare `npx miniapp-cli` outside an install runs the other package.

## Alternatives considered

**Move all of skkuverse-mini into this repository.** Rejected. It would publish the products, borrowed assets and history that was never meant to be public, along with the tools.

**Point at the private repository with a git submodule.** Rejected. GitHub shows a submodule as a link to its repository, and a private one returns 404 to a reader.

**Keep the CLI in the private repository and link to it.** Rejected. The spec would keep pointing at a file nobody outside the team can open.

**One package, with the game contract as a subcommand.** Rejected. Every user of `check` would install about 57 MiB of vitest, vite and happy-dom.

**An "Enforced by" column in the spec.** Rejected. It copies a value that `check.ts` owns, which [docs/README.md](../README.md) forbids.

## Related

- [miniapp-spec](../reference/miniapp-spec.md): the rules `check` enforces
- [protocol](../reference/protocol.md): the game protocol contract the runner holds a page to
- [0001-sdk-distribution](0001-sdk-distribution.md): why the shared code is on npm
- [release-packages](../how-to/release-packages.md): how the two packages are versioned and published
