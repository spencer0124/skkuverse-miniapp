---
"@skkuverse/miniapp-cli": patch
"@skkuverse/game-contract": patch
---

`check` ends an inline or remote `<script>` at an end tag that carries attributes, as a browser does, and no longer joins the text around a removed comment into a tag. `game-contract` drops every script happy-dom parses from the mounted body, instead of cutting them out of the markup by pattern.
