---
"@skkuverse/miniapp": patch
---

Outside the app, `MiniappRoot` sets `--sv-safe-*` and `--sv-inset-*` to the browser's `env(safe-area-inset-*)` instead of zero, so a page allowed in browsers still clears the notch in Safari.
