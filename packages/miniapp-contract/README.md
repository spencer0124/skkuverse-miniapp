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
writes, so the page runs under the production CSP. The page reaches no other origin. A
navigation to another origin gets an empty 204 answer, so the page stays where it is. Any
other request to another origin is aborted, and every WebSocket is closed before it
connects. Each page the runner opens gets its own proxy, a server inside the runner that
refuses every connection, and only the served origin bypasses it, so a connection the
routing cannot see, such as a WebSocket a Worker opens, is refused too. Chromium sends
WebRTC's UDP only through a proxy, and this one carries none, so a STUN or TURN server
receives no packet.

The only requests that leave the runner are its own N4 checks, sent from Node. For each
backend that `.env.production` names and the page called, it sends the CORS preflight a
browser would send, or, for a simple `GET` or `HEAD`, that request itself, to the exact
production URL the page asked for. It sends one for each URL, method and header set, so a
`GET` with side effects runs once in every run, in CI too. No backend receives a
`POST`, `PUT`, `PATCH` or `DELETE`.

| Rule | What the runner does | It fails when |
| --- | --- | --- |
| N1 | Loads `/` with the host, clicks every link and button in DOM order, and repeats that on every same-origin route it reaches. | The page, or a popup it opens, navigates to another origin with no `link.open` post for that URL. |
| N2 | Finds each query key a built script names in `.get("<key>")`, `.getAll("<key>")` or `.has("<key>")`, in a script that reads `URLSearchParams`, `searchParams` or `location.search`. Loads `/` with each key set to `1` and to `true`. | A load with a key shows other text, posts other messages or requests other addresses than the plain load. |
| N3 | Loads every route the crawl found with no host, as a browser does. `<MiniappRoot>` marks `<html>` with `data-sv-chrome` outside the app. | A route leaves `data-sv-chrome` unset, so it renders outside `<MiniappRoot>`. |
| N4 | Records each fetch, XHR, EventSource and WebSocket to another origin, and what the page asked of it, in every load the runner makes, N2's and N3's included. Asks each named backend what a browser on `https://<id>.mini.skkuverse.com` asks it: the CORS preflight for a request that needs one, and the request itself for a simple `GET` or `HEAD`. | The origin is not the origin of a `VITE_*` value in the package's `.env.production`, the page asks to send cookies (`credentials: 'include'`, `withCredentials` or a `Cookie` header), or the backend's answer does not allow the request. |

A request needs a preflight when its method is not `GET`, `HEAD` or `POST`, or when it
sets a header CORS does not allow by default, as the Fetch standard says. A simple `POST`
needs none, and a browser judges CORS on the answer to the write itself, so the runner
does not send it. It prints a `warn` line for that backend instead.

The clock is pinned and `Math.random` is seeded in every load, so two loads of one URL
render the same. The host is the app's real `hostBootstrapScript` with the `granted` preset
of `@skkuverse/miniapp/testing`. It answers every request with `null`.

## What it does not see

A run passes a page it could not watch break a rule. These causes stay out of its reach:

- N1. The runner clicks `<a href>`, `<button>`, `[role="button"]` and `<input>` buttons. A
  `<div onClick>` is never clicked. Controls are clicked by their place in DOM order, so a
  control a click puts in the place of the clicked one, without a navigation, is never
  clicked. A load or click counts as settled when the page has no task above background priority left and
  150 ms pass with no request, message or DOM change, so a navigation a timer fires later,
  such as 1 s after a click, is missed.
- N1 and N3. Routes are tracked by path. A hash route such as `#/settings` is the same
  route as `/`, and a route reached only by typed input is never found.
- N2. A key read any other way, such as `Object.fromEntries(new URLSearchParams(location.search)).debug`
  or a loop over the parameters, is not found. A key the page reads after it settles, such
  as inside a 500 ms timer, changes nothing the runner compares.
- N4. A request a Worker or the browser makes outside the page's routing, such as a
  WebSocket from a Worker, is refused and printed as a `warn` line, not judged. So is an
  `RTCPeerConnection` the page creates: its ICE servers are named in a `warn` line, and
  one created in a frame is not named. A beacon or an image to another origin is aborted
  and not judged. A `Cookie` header the browser adds
  from its own store never appears, because every request to another origin is stopped
  before it is sent.

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
  N3 skips each path and every route under it: `/admin` covers `/admin` and
  `/admin/members`, not `/admin.html`, which is another path to list. Each path starts
  with `/`, names at least one segment, and is a pathname as a browser reports it. So the
  run exits 2 on `/` and the empty string (every route), on `admin`, `/admin*` or `/a/../b`,
  and on a path with a character a browser escapes, which no route can match. Write such
  a path percent-encoded, as `/%EA%B4%80%EB%A6%AC`. The operator still reviews that such a
  page requires a token.
- `queryParams` lists query keys that are part of the miniapp, such as a deep link to a
  tab. N2 does not load the page with them.

Neither field silences a rule without a trace. The run prints a `warn` line for every path
and every key it skips, and the N3 path list names the routes the crawl reached under each
one. `miniapp-cli check` validates both fields with the rest of `deploy.config.json`.

`--dir` reads neither field, because a folder outside a repository has no config entry.

## Read the result

The command ends with one of three exit codes:

- `0` when every miniapp keeps N1 to N4, and after `--help`.
- `1` when a miniapp breaks a rule. Each finding names the rule and what the page did.
- `2` when the runner could not judge, and stderr says why: a usage error, an invalid
  `deploy.config.json`, a folder with no build, no Chromium, a page the production CSP
  blocks, a page that renders or requests differently on two plain loads, or a backend the
  CORS check cannot reach.

With `--json`, stdout holds one JSON object per finding, one to a line, and nothing else,
where `check --json` prints one array. A miniapp that keeps every rule, with no `warn`
line to print, prints nothing. Each object has the fields of
`miniapp-cli check --json`: `id`, `kind` (always `app`), `rule`, `level`, `message` and
`spec`, the heading of the spec that defines the rule.

```json
{"id":"club","kind":"app","rule":"N1","level":"error","message":"a click on <a> \"site\" in / navigated to https://example.org/ with no link.open for it. Inside the app, leave the page through openUrl() or handleLinkClick()","spec":"docs/reference/miniapp-spec.md#page"}
```

A finding with the level `warn` does not fail the run. The runner prints one for each
`operatorPaths` path and `queryParams` key it skipped, for a simple `POST` whose CORS it did
not check, for a connection its proxy refused and an `RTCPeerConnection` it kept from
sending, in any of its loads, and when it stopped early, after
`MAX_CLICKS` clicks in one route or after `MAX_ROUTES` routes, both in
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
