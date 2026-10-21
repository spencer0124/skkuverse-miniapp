# __ID__

What this game is, in one or two sentences.

```sh
pnpm --filter ./games/__ID__ dev       # → http://localhost:5173
pnpm check __ID__                      # after a build
pnpm ship __ID__ --preview
```

## How it reaches the app

The page boots through `bootGame` from `@skkuverse/miniapp/game` and talks to
the app only through it (spec G2). It has no backend (G3) and ships no headers
of its own: `ship` writes the game headers (G4).

## Deployment

`pnpm ship __ID__` from a clean `main`. The Pages project (`game-__ID__`) and
the host (`__ID__.game.skkuverse.com`) are in the root `deploy.config.json`
under `games`; the registry entry is in skkuverse-server's games dataset.
