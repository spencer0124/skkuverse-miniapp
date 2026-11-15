---
title: Miniapp Spec
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-14
audience: public
---

# Miniapp spec (v2)

> What a miniapp or a game has to be before skkuverse hosts it: its identity, its package, its build output, its page and its manifest. For anyone building one, first-party or a club's.

## Summary

skkuverse hosts every miniapp and every game itself. Each hands over a package, and the operator ships its static build to Cloudflare Pages: a miniapp at `https://<id>.mini.skkuverse.com`, a game at `https://<id>.game.skkuverse.com`. The only path to either host is `ship`, which builds the package, checks it against this spec, writes the platform's own files into the build, and deploys. A package that fails the check does not deploy.

Each rule has an ID, a kind and the packages it applies to. The kind says who enforces it:

- **checked**: a tool enforces it, and each failure prints the rule ID and the heading of this document that defines it (`--json` adds it as `spec`). `check` reads a package's files, in `packages/cli/src/check.ts`. `miniapp-contract` loads the built miniapp in Chromium and watches what the page does, in `packages/miniapp-contract/src/`, and it enforces N1 to N4. What each tool cannot see is in its own README, and a checked rule is held only as far as its tool observes it.
- **review**: the operator reads the code for it before a first release and when a release touches it.

The **For** column says which packages a rule applies to: `app` for a miniapp, `game` for a game, `both` for either. A rule for one is never checked against the other.

<!-- docs-gen:begin spec-rule-count -->The spec holds 26 rules: 24 are checked and 2 are for review.<!-- docs-gen:end spec-rule-count -->

Numeric limits are not repeated here. Each rule names the file that owns its value.

## Kinds

The folder is the kind. In a repository of miniapps, a package under `apps/<id>/` is a miniapp, and one under `games/<id>/` is a game. The two share the id namespace, the message envelope, the CLI and this document. Everything that grants trust is separate: the folder, the domain, the Pages project (`miniapp-<id>` or `game-<id>`), the server registry and its origin list, and the methods the app grants. A game page is granted only the `game.*` methods, and a miniapp page none of them ([protocol](protocol.md#games)).

## Identity

| Rule | Kind | For | Requirement |
| --- | --- | --- | --- |
| R1 | checked | both | The id matches `ID_PATTERN` in `check.ts`, the same pattern the server registry enforces. The package directory is named after the id. An id never changes once registered |
| R2 | checked | app | `src/main.tsx` renders `<MiniappRoot id="<id>">` with the id as a string literal |
| R3 | checked | app | `<MiniappRoot>` says `browser="block"` or `browser="allow"` explicitly |
| R4 | checked | both | The operator's `deploy.config.json` has an entry for the id. The host is `<id>.mini.skkuverse.com` for a miniapp and `<id>.game.skkuverse.com` for a game. Any other host is an exception, listed below with its reason |
| G1 | checked | game | The id is unique across `apps/` and `games/`. `/m/<id>` links and analytics ids name either kind, so a game and a miniapp never share one |

## Package

A miniapp is one package directory, `apps/<id>/`:

```text
apps/<id>/
  package.json          scripts: dev, build, typecheck (test optional)
  index.html
  vite.config.ts        base: '/'
  tsconfig.json
  public/skkuverse.json the shell manifest
  src/main.tsx          renders <MiniappRoot>
  README.md             what it is, where its data comes from, how it deploys
```

`miniapp-cli new <id>` creates one from `packages/cli/templates/miniapp/`. A game is `games/<id>/`, created by `miniapp-cli new --kind game <id>` from `packages/cli/templates/game/`, which is also where its file tree is defined.

| Rule | Kind | For | Requirement |
| --- | --- | --- | --- |
| S1 | checked | app | Every file in the tree above exists (`REQUIRED_FILES`), and `package.json` is a JSON object |
| S2 | checked | app | The stack is Vite, React and TypeScript: the package depends on `REQUIRED_DEPENDENCIES`. The templates take versions from the workspace catalog (`pnpm-workspace.yaml`) of the repository they are scaffolded into, rather than per package |
| S3 | checked | both | `package.json` defines `REQUIRED_SCRIPTS` |
| S4 | checked | both | The **installed** `@skkuverse/miniapp` is at least `SDK_FLOOR`. The check reads the installed copy rather than the declared range, because a `0.x` caret never crosses a minor and `^0.2.1` silently stays below `0.3.0` |

## Build output

`build` writes a static site to `dist/`. Server-side rendering is not accepted.

| Rule | Kind | For | Requirement |
| --- | --- | --- | --- |
| O1 | checked | both | `dist/` holds `index.html`, and a miniapp's also holds `skkuverse.json` |
| O2 | checked | both | `dist/` holds none of `PLATFORM_FILES` (`_headers`, `_redirects`, `_routes.json`, `_worker.js`, `functions/`) and no `404.html` at any depth. The platform writes the first two. The others would run server code or replace the single-page fallback |
| O3 | checked | both | Every file under `dist/assets/` carries a content hash in its name. The platform serves that folder as immutable |
| O4 | checked | both | File count and file size stay within the [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) (`MAX_FILES`, `MAX_FILE_BYTES`) |

## Page

`miniapp-contract` judges a miniapp only. N1 and N2 hold for a game too, and N6 is the operator's review of them.

| Rule | Kind | For | Requirement |
| --- | --- | --- | --- |
| H1 | checked | both | `index.html` has `<html lang>` and a viewport `<meta>` with `viewport-fit=cover`. Every executable `<script>` has a same-origin, root-absolute `src`. No inline script and no `on*=` handler attribute, since the platform's CSP blocks both |
| N1 | checked | app | Inside the app, a page leaves its own origin only through the SDK's `link.open` (`openUrl()`, `handleLinkClick()`). `miniapp-contract` clicks every link and button in DOM order on each same-origin route it reaches, and fails when the page, or a popup it opens, navigates to another origin with no `link.open` post for that URL. It does not click a `<div onClick>`, and it misses a navigation a timer fires after the click settles |
| N2 | checked | app | A debug switch, such as a clock override read from the query string, works only under `import.meta.env.DEV`. `miniapp-contract` finds each query key a built script reads through a literal `.get`, `.getAll` or `.has` call and loads `/` with it set to `1` and to `true`. It fails when a load shows other text, posts other messages or requests other addresses than the plain load. A key read any other way, such as a loop over `URLSearchParams`, is not found, and neither is a switch read only in a lazily loaded route, because the runner loads `/` alone, and a key the miniapp uses on purpose is listed in its `queryParams` in `deploy.config.json` |
| N3 | checked | app | Every user-facing route renders inside `<MiniappRoot>`. `miniapp-contract` loads every route its crawl found with no host, and fails when `<MiniappRoot>` has not marked `<html>` with `data-sv-chrome`. A route it cannot reach by a link or a click, and a hash route, is not judged. The operator pages listed in `operatorPaths` in `deploy.config.json` are skipped and named in a warning, and N5 covers them |
| N5 | review | app | An operator page, such as `/admin`, may sit outside `<MiniappRoot>` and must require a token. It is listed in `operatorPaths`, and the operator reads that it asks for the token |
| N6 | review | game | A game leaves its origin only through `link.open` and keeps each debug switch behind `import.meta.env.DEV`, as N1 and N2 ask of a miniapp. `miniapp-contract` does not load a game, so the operator reads the game's source for both |
| G2 | checked | game | The page boots through `bootGame` from `@skkuverse/miniapp/game`, which installs the page guard and speaks the `game.*` protocol. Its source never posts to `window.ReactNativeWebView` itself and never reads, defines or replaces the host globals (`window.skkuverse`, `window.__host`) |

## Manifest

`public/skkuverse.json` declares the shell the app draws around the miniapp. Its fields are in [protocol.md](protocol.md#shell). A game has no manifest: the app draws its screen natively.

| Rule | Kind | For | Requirement |
| --- | --- | --- | --- |
| M1 | checked | app | The file has exactly one key, `shell`, holding all four shell fields with valid values and nothing else. It stays within the server's fetch cap (skkuverse-server `src/miniapps/miniapps.manifest.ts`) |

The SDK's `parseShellFields` drops a bad field and the default takes its place, so a broken manifest still opens. The check runs the same parser and reports every field it would have dropped, so the shell that ships is the one the author wrote.

## Backend

A miniapp may call a backend of its own. skkuverse hosts the static page, not the club's server. A game may not.

| Rule | Kind | For | Requirement |
| --- | --- | --- | --- |
| N4 | checked | app | The backend URL is absolute and comes from a `VITE_*` variable in a committed `.env.production`, which holds public values only. The backend allows the miniapp's origin through CORS. Authentication uses a token, not a cookie, because the iOS web view blocks third-party cookies. `miniapp-contract` records each `fetch`, XHR, EventSource and WebSocket to another origin in every load it makes, and fails on an origin that no `VITE_*` value names, on a request that asks to send cookies, and on a backend whose answer to the CORS preflight a browser on the miniapp's origin sends (or to a simple `GET` or `HEAD` itself) does not allow the request. It sends no `POST`, `PUT`, `PATCH` or `DELETE`, and warns about a simple `POST` instead. It does not read the code, so that the URL comes from a `VITE_*` variable, that `.env.production` is committed and that it holds public values only are the operator's to review: the runner takes the origins from that file when it exists. It judges a `fetch` or XHR a Worker makes, but its cookie check runs only in the top window, so it misses a Worker's request that asks for cookies, and it refuses and warns about a WebSocket a Worker opens without judging it. It does not judge a beacon or an image, and it reaches a backend over the network |
| B1 | checked | app | **First-party only.** A miniapp whose `deploy.config.json` entry declares `"backend": "functions"` keeps a Pages Functions backend in `functions/` with its `wrangler.toml`, served on its own origin under `/api/*` and deployed in the same `ship`. A `functions/` directory without that declaration fails the check |
| G3 | checked | game | **No backend.** A game has no `functions/` directory and no `backend` declaration, and calls no server. A ranked result is verified outside the page, never by anything the game ships |

## What the platform writes

`ship` copies `dist/` to a staging folder and adds two files, defined in `packages/cli/src/platform.ts`:

- `_headers`: a Content Security Policy restricting scripts to the miniapp's own origin, and an immutable cache rule for `/assets/*`.
- `_redirects`: the single-page fallback to `index.html`.

The CSP restricts scripts only. Styles stay open because miniapps load the Tossface stylesheet from a CDN and `@skkuverse/ui` injects an inline `<style>`. The risk worth closing is code that changes after review, and that means scripts.

A game gets the game headers instead, from the same file:

| Rule | Kind | For | Requirement |
| --- | --- | --- | --- |
| G4 | checked | game | A game is served only with the game headers `ship` writes: scripts, connections and media from the game's own origin alone, images and media also as inline data, no frames at all (`frame-src 'none'`), and an immutable cache rule for `/assets/*`. The game ships no headers of its own (O2) |
| G5 | checked | game | The built `dist/` loads only what the game headers allow. Its HTML has no inline `<style>`, no `style=` attribute and no `<iframe>`, `<object>` or `<embed>`. Every `<link>`, `<img>`, `<audio>`, `<video>` and `<source>` URL is on the game's own origin, or inline data where the headers allow it: images, media and an icon `<link>`. Its CSS loads fonts only as files on its own origin, never as inline data, and imports and images from its own origin, with images also as inline data. A page that decodes sound through `fetch` inlines no `data:audio`, because `connect-src 'self'` blocks fetching a `data:` URI. Scripts are H1's |

A game's CSP is defence in depth, not the boundary against whoever can deploy its Pages project. The boundary is what the app grants a game origin, plus the server's check of every ranked result. Its game host also passes the game's origin to `hostBootstrapScript`, so the host object is defined only in the top window of that origin, never in a subframe or a document the web view reached by navigating ([protocol](protocol.md#the-host-object)).

## Exceptions

| Miniapp | Rule | Exception | Reason |
| --- | --- | --- | --- |
| `eskara-2026` | R4 | Host `eskara.miniapp.skkuverse.com` | It predates the `*.mini.skkuverse.com` rule, and released builds, map data and festival links name it. Moving it gains nothing the miniapp uses |

## Changing the spec

A new rule lands here and in the tool that enforces it, together, and the existing miniapps are brought into line in the same change. A rule `miniapp-cli check` raises goes in `RULE_SECTIONS` in `check.ts`. A rule the `miniapp-contract` browser runner raises goes in `CONTRACT_RULES` in `packages/miniapp-contract/src/rules.ts`. A rule only a reviewer can judge is marked review rather than left out.

`packages/cli/test/spec-coverage.test.ts` fails when this document and the checker disagree. Every checked rule has to be raised by one of the two tools, asserted by a test, and listed in `RULE_SECTIONS` or `CONTRACT_RULES` (never both) under the heading its table sits in. A rule `miniapp-contract` enforces is `app` here. A rule marked review is in neither tool, and a rule in either is marked checked here. Renaming a heading that holds a rule means updating whichever record holds it, because `check --json` and the runner's findings link to the heading.

## Related

- [protocol.md](protocol.md): the messages, the host object, the shell manifest and the viewport
- [lay-out-for-safe-areas.md](../how-to/lay-out-for-safe-areas.md): padding with `--sv-inset-*`
