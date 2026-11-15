---
"@skkuverse/miniapp": patch
---

`@skkuverse/miniapp/protocol` loads with `require`. A CommonJS consumer, such as a server that parses a manifest, got `ERR_PACKAGE_PATH_NOT_EXPORTED` because the exports map listed only the `import` condition. `import` and bundlers resolve as before. `require` needs Node 22.12 or later, where it loads an ES module that has no top-level `await`.
