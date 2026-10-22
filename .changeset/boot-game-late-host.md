---
"@skkuverse/miniapp": patch
---

`bootGame` no longer leaves the page dead when the host is later than `HOST_WAIT_MS`. It still calls `onNoHost` once at that mark, then keeps looking every `HOST_SLOW_POLL_MS` (new, 1 s, also `slowPollMs` in the options) and on `load` and `pageshow`, and sends `game.ready` when the host appears, after which `onInit` arrives as usual. A host that grants no game method still ends the search, and `onNoHost` is never called twice.
