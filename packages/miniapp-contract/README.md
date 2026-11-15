# @skkuverse/miniapp-contract

Opens a built skkuverse miniapp in Chromium, with the headers `ship` deploys and the app's
host installed, and fails when the page breaks one of the runtime rules N1 to N4 of the
[miniapp spec](https://github.com/spencer0124/skkuverse-miniapp/blob/main/docs/reference/miniapp-spec.md).
`miniapp-cli check` reads files. These four rules are about what the page does, so this
runner loads the page and watches it. It needs <!-- docs-gen:begin engines package=miniapp-contract -->Node 22.13 or later<!-- docs-gen:end engines -->.

```sh
pnpm add -Dw @skkuverse/miniapp-contract
pnpm exec miniapp-contract install      # once: the headless Chromium the runner drives
pnpm exec miniapp-contract              # every built miniapp under apps/
pnpm exec miniapp-contract <id>...      # the miniapps named
pnpm exec miniapp-contract --dir <path> [--id <id>]   # one built folder, no repository needed
```

Build each miniapp first. The runner judges `dist/`, the folder `ship` deploys. In a
repository it reads `deploy.config.json` from the folder that holds it, which it finds by
walking up from the working directory or takes from `--root <path>`.

## What it checks

Each run serves `dist/` on 127.0.0.1 with the `_headers` and `_redirects` that `ship`
writes, so the page runs under the production CSP. The page never leaves 127.0.0.1. A
navigation to another origin gets an empty 204 answer, so the page stays where it is, and
any other request to another origin is aborted, so no backend receives a write.

| Rule | What the runner does | It fails when |
| --- | --- | --- |
| N1 | Loads `/` with the host, clicks every link and button in DOM order, and repeats that on every same-origin route it reaches. | The page, or a popup it opens, navigates to another origin with no `link.open` post for that URL. |
| N2 | Finds the query keys the built scripts read (`URLSearchParams`, `searchParams.get`, `location.search`), then loads `/` with each key set to `1` and to `true`. | A load with a key shows other text, or posts other messages, than the plain load. |
| N3 | Loads every route the crawl found with no host, as a browser does. `<MiniappRoot>` marks `<html>` with `data-sv-chrome` outside the app. | A route leaves `data-sv-chrome` unset, so it renders outside `<MiniappRoot>`. |
| N4 | Records each fetch, XHR and EventSource request to another origin, and what the page asked of it. | The origin is not the origin of a `VITE_*` value in the package's `.env.production`, the page asks to send cookies (`credentials: 'include'`, `withCredentials` or a `Cookie` header), or the backend's CORS preflight from `https://<id>.mini.skkuverse.com` does not allow the request. |

The clock is pinned and `Math.random` is seeded in every load, so two loads of one URL
render the same. The host is the app's real `hostBootstrapScript` with the `granted` preset
of `@skkuverse/miniapp/testing`. It answers every request with `null`.

## Tell it about operator pages and query parameters

Two optional fields of a miniapp's entry in `deploy.config.json` stop a finding that is
not a bug:

```json
{
  "apps": {
    "club": {
      "project": "miniapp-club",
      "operatorPaths": ["/admin"],
      "queryParams": ["tab"]
    }
  }
}
```

- `operatorPaths` lists operator pages, which the spec lets render outside `<MiniappRoot>`.
  N3 skips each path and every route under it. The operator still reviews that such a page
  requires a token.
- `queryParams` lists query keys that are part of the miniapp, such as a deep link to a
  tab. N2 does not load the page with them.

`--dir` reads neither field, because a folder outside a repository has no config entry.

## Read the result

The command ends with one of three exit codes:

- `0` when every miniapp keeps N1 to N4, and after `--help`.
- `1` when a miniapp breaks a rule. Each finding names the rule and what the page did.
- `2` when the runner could not judge, and stderr says why: a usage error, a folder with
  no build, no Chromium, a page the production CSP blocks, a page that renders differently
  on two plain loads, or a backend whose CORS preflight cannot be reached.

With `--json`, stdout holds one JSON object per finding, one to a line, and nothing else.
A miniapp that keeps every rule prints nothing. Each object has the fields of
`miniapp-cli check --json`: `id`, `kind` (always `app`), `rule`, `level`, `message` and
`spec`, the heading of the spec that defines the rule.

```json
{"id":"club","kind":"app","rule":"N1","level":"error","message":"a click on <a> \"site\" in / navigated to https://example.org/ with no link.open for it. Inside the app, leave the page through openUrl() or handleLinkClick()","spec":"docs/reference/miniapp-spec.md#page"}
```

A finding with the level `warn` does not fail the run. The runner prints one when it
stopped early, after `MAX_CLICKS` clicks in one route or after `MAX_ROUTES` routes, both in
[`src/session.ts`](https://github.com/spencer0124/skkuverse-miniapp/blob/main/packages/miniapp-contract/src/session.ts).

## See what the runner sees

`miniapp-contract serve <id>` (or `serve --dir <path>`) serves a build the way a run does
and prints its address. Open it in a browser to click through the page under the
production CSP. Add `--port <n>` to pick the port.

## Why a browser, and what it costs

[ADR 0004](https://github.com/spencer0124/skkuverse-miniapp/blob/main/docs/decisions/0004-run-miniapp-contracts-in-a-browser.md)
explains why these rules run in Chromium while the game contract runs in happy-dom.
`miniapp-contract install` downloads the headless Chromium of the Playwright version this
package pins into Playwright's own cache. pnpm's `minimumReleaseAge` holds back the
`playwright` package, not that download.
