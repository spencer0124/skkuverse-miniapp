# @skkuverse/miniapp

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
