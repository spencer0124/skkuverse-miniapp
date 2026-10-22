# @skkuverse/miniapp

## 0.4.0

### Minor Changes

- 8995255: Add the `game.*` namespace for hosted games, beside the mini-app methods on the same envelope.

  - `./protocol` adds the `game.ready`, `game.start`, `game.phase`, `game.layout`, `game.haptic` and `game.over` notifications with their validators, the `game.init`, `game.pause`, `game.resume`, `game.sound`, `game.reset`, `game.restart` and `game.revive` events with `parseGameEvent`, `GAME_PROTOCOL` (delivered to the page in `game.init`) and `GAME_NOTIFY_METHODS`, the grant list for a game origin. `NOTIFY_METHODS`, the mini-app grant list, is unchanged and holds no game method, and `haptic.impact` keeps its three styles.
  - `./game` is the client a game page boots through. It exports `installPageGuard`, moved from the app's game channel: synthetic input, the clipboard and drags are dropped, and the clock, the dice and the timers are pinned. It no longer pins a host receiver, since the bootstrap already defines `window.skkuverse` non-writable.
  - `bootGame(handlers)` in `./game` installs the guard, looks for the host every 50 ms for up to 10 s (Android can run the first bootstrap on a document it replaces), sends `game.ready`, refuses `start()` until `game.init`, hands the host's events to `onPause`, `onResume`, `onSound`, `onReset`, `onRestart` and `onRevive`, calls `onAudioUnlock` on every real press, and reports through `start`, `phase`, `layout`, `haptic` and `over`. It installs no visibility handler: pausing is the host's call.
  - `./testing` holds `createFakeHost`, a stand-in for the app's game host that runs the real `hostBootstrapScript`, records what the page posts and sends events; `checkGameContract` and `assertGameContract`, which name each rule a page broke (`every-message-parses`, `first-message-ready`, `no-start-before-init`, `start-before-over`, `one-over-per-run`); and `BOUND_FIXTURES`, the pinned bound points of wave-run and subway-typing.
  - `@skkuverse/miniapp/fixtures/bounds.json` publishes the same points as plain JSON, which a CommonJS build can `require` and an ES module imports `with { type: 'json' }`.

## 0.3.0

### Minor Changes

- 4e250d4: Add `share.open` and `share({ url, text })`. In the app it opens the native share sheet. In a browser it uses Web Share, then falls back to copying the link, and resolves `'shared'`, `'copied'`, `'cancelled'` or `'failed'` so the page can say what happened.

## 0.2.1

### Patch Changes

- 61ba9f0: Outside the app, `MiniappRoot` sets `--sv-safe-*` and `--sv-inset-*` to the browser's `env(safe-area-inset-*)` instead of zero, so a page allowed in browsers still clears the notch in Safari.
- Updated dependencies [61ba9f0]
  - @skkuverse/ui@0.1.1

## 0.2.0

### Minor Changes

- daee654: Replace the v1 message set with one envelope for notifications, requests, responses and events, and add the parts every miniapp needs:

  - `MiniappRoot` wraps every miniapp. It blocks plain browsers by default with an "open in the skkuverse app" page, and `browser="allow"` opts out. The hooks throw outside it.
  - The app injects `window.skkuverse` with capabilities, the viewport and `receive`. `isInApp()` now means that object is present.
  - Safe areas come in two layers, `safeArea` and `contentSafeArea`, as `--sv-*` CSS variables and through `getViewport()`, `onViewportChange()` and `useViewport()`.
  - Miniapps declare their shell in `public/skkuverse.json`, and `setShell()` changes it mid-session.
  - `MapButton` moves to `@skkuverse/miniapp/react/ui`, so `./react` no longer imports `@skkuverse/ui`.
  - `./protocol` exports the parser, the manifest parser and the host scripts for the app and the server.

  Breaking: the v1 message types, `postToApp` and the `bridge.actions` capability derivation are gone.
