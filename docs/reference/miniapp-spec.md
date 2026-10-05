---
title: Miniapp Spec
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-10-05
audience: public
---

# Miniapp spec (v1)

> What a miniapp has to be before skkuverse hosts it: its identity, its package, its build output, its page and its manifest. For anyone building a miniapp, first-party or a club's.

## Summary

skkuverse hosts every miniapp itself. A miniapp hands over a package, and the operator ships its static build to Cloudflare Pages at `https://<id>.mini.skkuverse.com`. The only path to that host is `ship`, which builds the package, checks it against this spec, writes the platform's own files into the build, and deploys. A miniapp that fails the check does not deploy.

Each rule has an ID and a kind:

- **checked**: `check` enforces it. The implementation is `tools/miniapp-cli/src/check.ts` in [spencer0124/skkuverse-mini](https://github.com/spencer0124/skkuverse-mini), and each failure prints the rule ID.
- **review**: the operator reads the code for it before a first release and when a release touches it.

Numeric limits are not repeated here. Each rule names the file that owns its value.

## Identity

| Rule | Kind | Requirement |
| --- | --- | --- |
| R1 | checked | The id matches `ID_PATTERN` in `check.ts`, the same pattern the server registry enforces. The package directory is named after the id. An id never changes once registered |
| R2 | checked | `src/main.tsx` renders `<MiniappRoot id="<id>">` with the id as a string literal |
| R3 | checked | `<MiniappRoot>` says `browser="block"` or `browser="allow"` explicitly |
| R4 | checked | The operator's `deploy.config.json` has an entry for the id. The host is `<id>.mini.skkuverse.com`. Any other host is an exception, listed below with its reason |

## Package

A miniapp is one package directory, `apps/<id>/` in skkuverse-mini:

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

`pnpm new <id>` creates one from `templates/miniapp/`.

| Rule | Kind | Requirement |
| --- | --- | --- |
| S1 | checked | Every file in the tree above exists (`REQUIRED_FILES`) |
| S2 | checked | The stack is Vite, React and TypeScript: the package depends on `REQUIRED_DEPENDENCIES`. In skkuverse-mini, versions come from the workspace catalog (`pnpm-workspace.yaml`) rather than per package |
| S3 | checked | `package.json` defines `REQUIRED_SCRIPTS` |
| S4 | checked | The **installed** `@skkuverse/miniapp` is at least `SDK_FLOOR`. The check reads the installed copy rather than the declared range, because a `0.x` caret never crosses a minor and `^0.2.1` silently stays below `0.3.0` |

## Build output

`build` writes a static site to `dist/`. Server-side rendering is not accepted.

| Rule | Kind | Requirement |
| --- | --- | --- |
| O1 | checked | `dist/` holds `index.html` and `skkuverse.json` |
| O2 | checked | `dist/` holds none of `PLATFORM_FILES` (`_headers`, `_redirects`, `_routes.json`, `_worker.js`, `functions/`) and no `404.html` at any depth. The platform writes the first two. The others would run server code or replace the single-page fallback |
| O3 | checked | Every file under `dist/assets/` carries a content hash in its name. The platform serves that folder as immutable |
| O4 | checked | File count and file size stay within the [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) (`MAX_FILES`, `MAX_FILE_BYTES`) |

## Page

| Rule | Kind | Requirement |
| --- | --- | --- |
| H1 | checked | `index.html` has `<html lang>` and a viewport `<meta>` with `viewport-fit=cover`. Every executable `<script>` has a same-origin, root-absolute `src`. No inline script and no `on*=` handler attribute, since the platform's CSP blocks both |
| N1 | review | Inside the app, a page leaves its own origin only through the SDK's `link.open` (`openUrl()`, `handleLinkClick()`). A plain `<a href>` or `location` change to another site is for browser-only code paths |
| N2 | review | A debug switch, such as a clock override read from the query string, works only under `import.meta.env.DEV` |
| N3 | review | Every user-facing route renders inside `<MiniappRoot>`. An operator page, such as `/admin`, may sit outside it and must require a token |

## Manifest

`public/skkuverse.json` declares the shell the app draws around the miniapp. Its fields are in [protocol.md](protocol.md#shell).

| Rule | Kind | Requirement |
| --- | --- | --- |
| M1 | checked | The file has exactly one key, `shell`, holding all four shell fields with valid values and nothing else. It stays within the server's fetch cap (skkuverse-server `src/miniapps/miniapps.manifest.ts`) |

The SDK's `parseShellFields` drops a bad field and the default takes its place, so a broken manifest still opens. The check runs the same parser and reports every field it would have dropped, so the shell that ships is the one the author wrote.

## Backend

A miniapp may call a backend of its own. skkuverse hosts the static page, not the club's server.

| Rule | Kind | Requirement |
| --- | --- | --- |
| N4 | review | The backend URL is absolute and comes from a `VITE_*` variable in a committed `.env.production`, which holds public values only. The backend allows the miniapp's origin through CORS. Authentication uses a token, not a cookie, because the iOS web view blocks third-party cookies |
| B1 | checked | **First-party only.** A miniapp whose `deploy.config.json` entry declares `"backend": "functions"` keeps a Pages Functions backend in `functions/` with its `wrangler.toml`, served on its own origin under `/api/*` and deployed in the same `ship`. A `functions/` directory without that declaration fails the check |

## What the platform writes

`ship` copies `dist/` to a staging folder and adds two files, defined in `tools/miniapp-cli/src/platform.ts`:

- `_headers`: a Content Security Policy restricting scripts to the miniapp's own origin, and an immutable cache rule for `/assets/*`.
- `_redirects`: the single-page fallback to `index.html`.

The CSP restricts scripts only. Styles stay open because miniapps load the Tossface stylesheet from a CDN and `@skkuverse/ui` injects an inline `<style>`. The risk worth closing is code that changes after review, and that means scripts.

## Exceptions

| Miniapp | Rule | Exception | Reason |
| --- | --- | --- | --- |
| `eskara-2026` | R4 | Host `eskara.miniapp.skkuverse.com` | It predates the `*.mini.skkuverse.com` rule, and released builds, map data and festival links name it. Moving it gains nothing the miniapp uses |

## Changing the spec

A new rule lands here and in `check.ts` together, and the existing miniapps are brought into line in the same change. A rule only a reviewer can judge is marked review rather than left out.

## Related

- [protocol.md](protocol.md): the messages, the host object, the shell manifest and the viewport
- [create-a-miniapp.md](../how-to/create-a-miniapp.md): from an empty folder to a tile in the app
- [lay-out-for-safe-areas.md](../how-to/lay-out-for-safe-areas.md): padding with `--sv-inset-*`
