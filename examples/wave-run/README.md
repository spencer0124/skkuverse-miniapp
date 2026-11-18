# Wave run example

A playable runner on the published `@skkuverse/miniapp`, which runs in a plain browser.
It is a copy of the game 초록의 파도 that keeps only what the demo needs: it has no ranking, no comeback and no play statistics. <!-- conventions:allow-korean -->

[Open the live demo](https://spencer0124.github.io/skkuverse-miniapp/examples/wave-run/), which the docs site serves as static files. To run it here instead:

```sh
npm ci
npm run dev
```

## What it shows

- `src/main.ts` installs the fake host from `@skkuverse/miniapp/testing` and then boots the page through `bootGame` from `@skkuverse/miniapp/game`.
  The fake host answers `game.ready` with `game.init`, and the game starts no run before it.
- The panel beside the phone frame lists every message in both directions, as `host.log` records them. `examples/shared/host-panel.ts` draws it.
- Press Space or tap the right half to jump, and hold the left half or press the down arrow to duck.
  A crash sends `game.over` with zero counts, and the retry screen is drawn by the host side, not by the game. Its button calls `host.restart()`, so `game.restart` comes back.
- The Pause and Resume buttons call `host.pause()` and `host.resume()`.
- `?host=none` leaves the fake host out. The game then never starts a run, because it waits for the host's `game.init`.

The example pins exact versions in `package-lock.json`. It is not a workspace package, so `pnpm install` at the repository root leaves it alone. The docs site's build runs `npm ci` and `npm run build` here, through `packages/site/scripts/build-examples.mjs`.

The skyline art and the game code come from the owner's own game. `THIRD_PARTY_NOTICES.txt` holds the licence of the borrowed ZzFX tone renderer.
