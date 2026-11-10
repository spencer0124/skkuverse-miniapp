# @skkuverse/miniapp-cli

Checks a skkuverse miniapp or game against the
[miniapp spec](https://github.com/spencer0124/skkuverse-miniapp/blob/main/docs/reference/miniapp-spec.md),
scaffolds new ones, and deploys them to Cloudflare Pages. It needs Node 22.13 or later.

```sh
pnpm add -Dw @skkuverse/miniapp-cli
pnpm exec miniapp-cli check
```

The CLI works on a repository with a `deploy.config.json` at its root and one entry in it
for each package under `apps/` (miniapps) and `games/` (games). It finds the repository by
walking up from the working directory. Every command also takes `--root <path>`.

| Command | What it does |
| --- | --- |
| `miniapp-cli check [<id>...] [--kind app\|game] [--json]` | Checks every package, or the ones named, and exits 1 when one breaks a rule. |
| `miniapp-cli check --dir <path> --id <id> [--kind game] [--json]` | Checks one package outside `apps/` and `games/`. A miniapp needs no repository. |
| `miniapp-cli new [--kind game] <id>` | Scaffolds `apps/<id>` from the miniapp template, or `games/<id>` from the game template. |
| `miniapp-cli ship <id> [--preview]` | Builds the package, checks it, and runs the repository's `wrangler pages deploy`. A production deploy needs a clean `main` that matches `origin/main`. |

The spec marks each rule `checked` or `review`. The CLI enforces the `checked` rules, and
`src/check.ts` holds them. `test/spec-coverage.test.ts` fails when the spec and the checker
disagree about which rules are checked, or when a checked rule has no test.

## Read the findings as JSON

`miniapp-cli check --json` prints one JSON array on stdout, a finding to a line, and nothing
else. The array is `[]` when nothing is wrong. The exit code is the one `check` gives without
the flag, 1 when any finding has the level `error`. An error such as an unknown package goes
to stderr, leaves stdout empty and exits 1. `new` and `ship` refuse `--json`.

```json
[
  {"id":"club","rule":"S2","level":"error","message":"package.json does not depend on react","spec":"docs/reference/miniapp-spec.md#package"}
]
```

| Field | Value |
| --- | --- |
| `id` | The package the finding is about. |
| `rule` | The rule ID, such as `S2`. |
| `level` | `error` fails the check. `warn` is an exception the spec allows, such as a host exception with a reason (R4). |
| `message` | What is wrong, as the check prints it without `--json`. |
| `spec` | The heading of the spec that defines the rule, as a path in the [skkuverse-miniapp repository](https://github.com/skkuverse/skkuverse-miniapp) and an anchor. The row with the `rule` ID is in that section's table. |

## What `new` and `ship` need from the repository

`new` and `ship` expect the repository to be a pnpm workspace laid out like this:

- `pnpm-workspace.yaml` lists `apps/*` and `games/*` as packages. `pnpm install` then links
  a new package, and `ship` builds it with `pnpm --filter ./apps/<id>` or `./games/<id>`.
- The same file has a `catalog` entry for every dependency that the
  [miniapp template](https://github.com/spencer0124/skkuverse-miniapp/blob/main/packages/cli/templates/miniapp/package.json)
  and the [game template](https://github.com/spencer0124/skkuverse-miniapp/blob/main/packages/cli/templates/game/package.json)
  take as `catalog:`.
- The root has a `tsconfig.base.json`, which the `tsconfig.json` of each template extends.
- For `ship`, the root has `wrangler` installed, so that `node_modules/.bin/wrangler`
  exists, and wrangler can deploy to the Pages projects that `deploy.config.json` names.
  Every command refuses a `deploy.config.json` whose `project` does not start with
  `miniapp-` under `apps` or `game-` under `games`, or that names one project twice.

The README that `new` writes runs `pnpm check`, `pnpm ship` and, in a game,
`pnpm contract`. Define them as scripts in the root `package.json`, such as
`"check": "miniapp-cli check"` and `"contract": "game-contract"`.
