---
"@skkuverse/miniapp-cli": minor
---

`@skkuverse/miniapp-cli/platform` exports the files `ship` writes into a deploy (`CONTENT_SECURITY_POLICY`, `HEADERS_FILE`, `REDIRECTS_FILE`, `platformFiles` and the game's equivalents), with types, so a tool that serves a build uses the production headers instead of a copy. `@skkuverse/miniapp-cli/config` exports the `deploy.config.json` parser `check` and `ship` use, so a tool that reads the file applies the same rules.

`deploy.config.json` declares two optional fields on a miniapp's entry, which `@skkuverse/miniapp-contract` reads: `operatorPaths` and `queryParams`, each a list of strings. `check` now refuses an operator path that does not start with `/` and name at least one segment, that holds `*`, or that a browser would report as another pathname (`/a/../b`, or a non-ASCII character not percent-encoded), and an empty query key.
