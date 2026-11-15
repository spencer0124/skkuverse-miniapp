---
"@skkuverse/miniapp-contract": minor
---

New package. `miniapp-contract` opens each built miniapp in headless Chromium, under the headers `ship` deploys and with the app's host installed, and judges the spec's runtime rules N1 to N4 from what the page does. It exits 0 when every miniapp keeps them, 1 when one breaks a rule, and 2 when it could not judge. `--json` prints one finding per line in the fields of `miniapp-cli check --json`. `miniapp-contract install` downloads the browser, and `miniapp-contract serve` serves a build the way a run does. It imports the `deploy.config.json` parser from `@skkuverse/miniapp-cli/config`, which this release adds, so it needs that `@skkuverse/miniapp-cli` release or later.
