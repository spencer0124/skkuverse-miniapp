---
"@skkuverse/miniapp": patch
---

`hostBootstrapScript` takes an optional `origin`. With it, the script installs nothing unless it runs in the top window of a document on exactly that origin, so a re-injection into a document the web view navigated to, or into an Android subframe, defines no host. A game host must pass it. Without it the script behaves as before, which keeps the mini-app shell's calls working. `HostBootstrapOptions` is exported from `./protocol`.
