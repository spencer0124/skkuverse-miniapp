---
"@skkuverse/vite-plugin-miniapp": minor
"@skkuverse/miniapp-cli": minor
---

`@skkuverse/vite-plugin-miniapp` is new. Its `skkuverseDevHost()` gives `vite dev` the host the app gives a page, so a miniapp or game page runs its in-app code path: `window.skkuverse` exists before the page's script, and each message the page posts prints one terminal line, `[skkuverse] page -> host <method> <params>`. A message the app would drop without a word throws from `postMessage` and names the method. `SKKUVERSE_PRESET` picks the host state (`granted`, `nothing-granted`, `no-host`, `late-host`, `slow-init` or `old-host:<version>`). A default build holds none of the host. `inject: 'always'` emits it as a hashed script for `vite preview` and browser tests. `miniapp-cli new` scaffolds a miniapp and a game that use it, and the miniapp template gains a button that calls `haptic('light')`.
