# @skkuverse/miniapp-cli

Checks a skkuverse miniapp or game against the
[miniapp spec](https://github.com/spencer0124/skkuverse-miniapp/blob/main/docs/reference/miniapp-spec.md),
scaffolds new ones, and deploys them to Cloudflare Pages. It needs <!-- docs-gen:begin engines package=cli -->Node 22.13 or later<!-- docs-gen:end engines -->.

```sh
pnpm add -Dw @skkuverse/miniapp-cli
pnpm exec miniapp-cli check
```

The CLI works on a repository with a `deploy.config.json` at its root and one entry in it
for each package under `apps/` (miniapps) and `games/` (games). It finds the repository by
walking up from the working directory. Every command also takes `--root <path>`.

<!-- docs-gen:begin cli-commands -->

| Command | What it does |
| --- | --- |
| `miniapp-cli check [<id>...] [--kind app\|game] [--json]` | Check every package, or the ones named. |
| `miniapp-cli check --dir <path> --id <id> [--kind game] [--json]` | Check a package outside `apps/` and `games/`. |
| `miniapp-cli new [--kind game] <id>` | Scaffold `apps/<id>`, or `games/<id>` for a game. |
| `miniapp-cli ship <id> [--preview]` | Build, check and deploy. |

<!-- docs-gen:end cli-commands -->

`check` exits 1 when a package breaks a rule. `ship` runs the repository's `wrangler pages deploy`, and a production deploy needs a clean `main` that matches `origin/main`.

The spec marks each rule `checked` or `review`. The CLI enforces the `checked` rules, and
`src/check.ts` holds them. `test/spec-coverage.test.ts` fails when the spec and the checker
disagree about which rules are checked, or when a checked rule has no test.

## Read the findings as JSON

`--json` makes `check` print one JSON array on stdout, a finding to a line, and nothing
else. The array is `[]` when nothing is wrong. The exit code is the one `check` gives without
the flag, 1 when any finding has the level `error`. An error such as an unknown package goes
to stderr, leaves stdout empty and exits 1. `new` and `ship` refuse `--json`.

```sh
pnpm exec miniapp-cli check club --json
```

```json
[
  {"id":"club","kind":"app","rule":"S2","level":"error","message":"package.json does not depend on react","spec":"docs/reference/miniapp-spec.md#package"}
]
```

| Field | Value |
| --- | --- |
| `id` | The package the finding is about. With `--dir`, the `--id` you gave. |
| `kind` | `app` for a miniapp under `apps/`, `game` for a game under `games/`. The two can share an id until G1 reports it, so `id` alone does not name a folder. With `--dir`, the kind the package was checked as, and the folder is the one `--dir` names. |
| `rule` | The rule ID, such as `S2`. |
| `level` | `error` fails the check. `warn` is an exception the spec allows, such as a host exception with a reason (R4). |
| `message` | What is wrong, as the check prints it without `--json`. |
| `spec` | The heading of the spec that defines the rule, as a path in the [skkuverse-miniapp repository](https://github.com/spencer0124/skkuverse-miniapp) and an anchor. The row with the `rule` ID is in that section's table. |

## What `new` and `ship` need from the repository

`new` and `ship` expect the repository to be a pnpm workspace laid out like this:

- `pnpm-workspace.yaml` lists `apps/*` and `games/*` as packages. `pnpm install` then links
  a new package, and `ship` builds it with `pnpm --filter ./apps/<id>` or `./games/<id>`.
- The same file has a `catalog` entry for every dependency that the
  [miniapp template](https://github.com/spencer0124/skkuverse-miniapp/blob/main/packages/cli/templates/miniapp/package.json)
  and the [game template](https://github.com/spencer0124/skkuverse-miniapp/blob/main/packages/cli/templates/game/package.json)
  take as `catalog:`.
- With pnpm 11, the same file allows esbuild's install script, which vite brings in:
  `allowBuilds: { esbuild: true }`. Without it, `pnpm install` stops with
  `ERR_PNPM_IGNORED_BUILDS` after `new`.
- The root has a `tsconfig.base.json`, which the `tsconfig.json` of each template extends.
- For `ship`, the root has `wrangler` installed, so that `node_modules/.bin/wrangler`
  exists, and wrangler can deploy to the Pages projects that `deploy.config.json` names.
  Every command refuses a `deploy.config.json` whose `project` does not start with
  `miniapp-` under `apps` or `game-` under `games`, or that names one project twice.

The README that `new` writes runs `pnpm check`, `pnpm ship` and, in a game,
`pnpm contract`. Define them as scripts in the root `package.json`, such as
`"check": "miniapp-cli check"` and `"contract": "game-contract"`.
