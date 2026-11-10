---
title: Miniapp Spec
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-11
audience: public
---

# Miniapp spec (v2)

> What a miniapp or a game has to be before skkuverse hosts it: its identity, its package, its build output, its page and its manifest. For anyone building one, first-party or a club's.

## Summary

skkuverse hosts every miniapp and every game itself. Each hands over a package, and the operator ships its static build to Cloudflare Pages: a miniapp at `https://<id>.mini.skkuverse.com`, a game at `https://<id>.game.skkuverse.com`. The only path to either host is `ship`, which builds the package, checks it against this spec, writes the platform's own files into the build, and deploys. A package that fails the check does not deploy.

Each rule has an ID, a kind and the packages it applies to. The kind says who enforces it:

- **checked**: `check` enforces it. The implementation is `packages/cli/src/check.ts` in this repository. Each failure prints the rule ID, and `check --json` adds the heading of this document that defines the rule.
- **review**: the operator reads the code for it before a first release and when a release touches it.

The **For** column says which packages a rule applies to: `app` for a miniapp, `game` for a game, `both` for either. A rule for one is never checked against the other.

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

| Rule | Kind | For | Requirement |
| --- | --- | --- | --- |
| H1 | checked | both | `index.html` has `<html lang>` and a viewport `<meta>` with `viewport-fit=cover`. Every executable `<script>` has a same-origin, root-absolute `src`. No inline script and no `on*=` handler attribute, since the platform's CSP blocks both |
| N1 | review | both | Inside the app, a page leaves its own origin only through the SDK's `link.open` (`openUrl()`, `handleLinkClick()`). A plain `<a href>` or `location` change to another site is for browser-only code paths |
| N2 | review | both | A debug switch, such as a clock override read from the query string, works only under `import.meta.env.DEV` |
| N3 | review | app | Every user-facing route renders inside `<MiniappRoot>`. An operator page, such as `/admin`, may sit outside it and must require a token |
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
| N4 | review | app | The backend URL is absolute and comes from a `VITE_*` variable in a committed `.env.production`, which holds public values only. The backend allows the miniapp's origin through CORS. Authentication uses a token, not a cookie, because the iOS web view blocks third-party cookies |
| B1 | checked | app | **First-party only.** A miniapp whose `deploy.config.json` entry declares `"backend": "functions"` keeps a Pages Functions backend in `functions/` with its `wrangler.toml`, served on its own origin under `/api/*` and deployed in the same `ship`. A `functions/` directory without that declaration fails the check |
| G3 | checked | game | **No backend.** A game has no `functions/` directory and no `backend` declaration, and calls no server. A ranked result is validated by the app's own server functions, never by anything the game ships |

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

A new rule lands here and in `check.ts` together, and the existing miniapps are brought into line in the same change. A rule only a reviewer can judge is marked review rather than left out.

`packages/cli/test/spec-coverage.test.ts` fails when this document and the checker disagree. Every checked rule has to be raised by the checker, asserted by a test, and listed in `RULE_SECTIONS` in `check.ts` under the heading its table sits in. A rule marked review is not in the checker, and a rule in the checker is marked checked here. Renaming a heading that holds a rule means updating `RULE_SECTIONS`, because `check --json` links to the heading.

## Related

- [protocol.md](protocol.md): the messages, the host object, the shell manifest and the viewport
- [lay-out-for-safe-areas.md](../how-to/lay-out-for-safe-areas.md): padding with `--sv-inset-*`
