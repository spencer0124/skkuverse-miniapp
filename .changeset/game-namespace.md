---
"@skkuverse/miniapp": minor
---

Add the `game.*` namespace for hosted games, beside the mini-app methods on the same envelope.

- `./protocol` adds the `game.ready`, `game.start`, `game.phase`, `game.layout`, `game.haptic` and `game.over` notifications with their validators, the `game.init`, `game.pause`, `game.resume`, `game.sound`, `game.reset`, `game.restart` and `game.revive` events with `parseGameEvent`, `GAME_PROTOCOL` (delivered to the page in `game.init`) and `GAME_NOTIFY_METHODS`, the grant list for a game origin. `NOTIFY_METHODS`, the mini-app grant list, is unchanged and holds no game method, and `haptic.impact` keeps its three styles.
- `./game` is the client a game page boots through. It exports `installPageGuard`, moved from the app's game channel: synthetic input, the clipboard and drags are dropped, and the clock, the dice and the timers are pinned. It no longer pins a host receiver, since the bootstrap already defines `window.skkuverse` non-writable.
- `bootGame(handlers)` in `./game` installs the guard, looks for the host every 50 ms for up to 10 s (Android can run the first bootstrap on a document it replaces), sends `game.ready`, refuses `start()` until `game.init`, hands the host's events to `onPause`, `onResume`, `onSound`, `onReset`, `onRestart` and `onRevive`, calls `onAudioUnlock` on every real press, and reports through `start`, `phase`, `layout`, `haptic` and `over`. It installs no visibility handler: pausing is the host's call.
- `./testing` holds `createFakeHost`, a stand-in for the app's game host that runs the real `hostBootstrapScript`, records what the page posts and sends events; `checkGameContract` and `assertGameContract`, which name each rule a page broke (`every-message-parses`, `first-message-ready`, `no-start-before-init`, `start-before-over`, `one-over-per-run`); and `BOUND_FIXTURES`, the pinned bound points of wave-run and subway-typing.
- `@skkuverse/miniapp/fixtures/bounds.json` publishes the same points as plain JSON, which a CommonJS build can `require` and an ES module imports `with { type: 'json' }`.
