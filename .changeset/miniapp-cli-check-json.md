---
"@skkuverse/miniapp-cli": minor
---

`miniapp-cli check --json` prints every finding as a JSON array on stdout, one finding per line, with its rule, message, kind of package and a link to the spec section that defines the rule. Errors still go to stderr, so a script or an editor can read the result without parsing text.
