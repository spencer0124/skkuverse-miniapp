---
"@skkuverse/miniapp": minor
---

Add the `game.*` namespace for hosted games, beside the mini-app methods on the same envelope.

- `./protocol` adds the `game.ready`, `game.start`, `game.phase`, `game.layout`, `game.haptic` and `game.over` notifications with their validators, the `game.init`, `game.pause`, `game.resume`, `game.sound`, `game.reset`, `game.restart` and `game.revive` events with `parseGameEvent`, `GAME_PROTOCOL` (delivered to the page in `game.init`) and `GAME_NOTIFY_METHODS`, the grant list for a game origin. `NOTIFY_METHODS`, the mini-app grant list, is unchanged and holds no game method, and `haptic.impact` keeps its three styles.
- `./game` is the client a game page boots through. It exports `installPageGuard`, moved from the app's game channel: synthetic input, the clipboard and drags are dropped, and the clock, the dice and the timers are pinned. It no longer pins a host receiver, since the bootstrap already defines `window.skkuverse` non-writable.
- `bootGame(handlers)` in `./game` installs the guard, looks for the host every 50 ms for up to 10 s (Android can run the first bootstrap on a document it replaces), sends `game.ready`, refuses `start()` until `game.init`, hands the host's events to `onPause`, `onResume`, `onSound`, `onReset`, `onRestart` and `onRevive`, calls `onAudioUnlock` on every real press, and reports through `start`, `phase`, `layout`, `haptic` and `over`. It installs no visibility handler: pausing is the host's call.
