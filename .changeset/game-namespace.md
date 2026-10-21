---
"@skkuverse/miniapp": minor
---

Add the `game.*` namespace for hosted games, beside the mini-app methods on the same envelope.

- `./protocol` adds the `game.ready`, `game.start`, `game.phase`, `game.layout`, `game.haptic` and `game.over` notifications with their validators, the `game.init`, `game.pause`, `game.resume`, `game.sound`, `game.reset`, `game.restart` and `game.revive` events with `parseGameEvent`, `GAME_PROTOCOL` (delivered to the page in `game.init`) and `GAME_NOTIFY_METHODS`, the grant list for a game origin. `NOTIFY_METHODS`, the mini-app grant list, is unchanged and holds no game method, and `haptic.impact` keeps its three styles.
