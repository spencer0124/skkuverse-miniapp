---
"@skkuverse/miniapp": minor
---

Replace the v1 message set with one envelope for notifications, requests, responses and events, and add the parts every miniapp needs:

- `MiniappRoot` wraps every miniapp. It blocks plain browsers by default with an "open in the skkuverse app" page, and `browser="allow"` opts out. The hooks throw outside it.
- The app injects `window.skkuverse` with capabilities, the viewport and `receive`. `isInApp()` now means that object is present.
- Safe areas come in two layers, `safeArea` and `contentSafeArea`, as `--sv-*` CSS variables and through `getViewport()`, `onViewportChange()` and `useViewport()`.
- Miniapps declare their shell in `public/skkuverse.json`, and `setShell()` changes it mid-session.
- `MapButton` moves to `@skkuverse/miniapp/react/ui`, so `./react` no longer imports `@skkuverse/ui`.
- `./protocol` exports the parser, the manifest parser and the host scripts for the app and the server.

Breaking: the v1 message types, `postToApp` and the `bridge.actions` capability derivation are gone.
