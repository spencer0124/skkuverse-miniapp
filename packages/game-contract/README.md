# @skkuverse/game-contract

Plays a built skkuverse game against the fake host from `@skkuverse/miniapp/testing` and
fails when the page breaks a rule of the game protocol contract. It needs Node 22.13 or later.

Run it from the repository root, after the games are built:

```sh
pnpm add -D @skkuverse/game-contract
pnpm exec game-contract                 # every game under games/
pnpm exec game-contract <id>...         # the games named
pnpm exec game-contract --entry <module> --html <index.html> [--player <module>] [--name <name>]
```

Each page is played twice, in vitest with a happy-dom window. The first run has the host
there at once. The second has a host that appears only after the page gave up its search
and called `onNoHost`. The command exits 1 and names each rule a page broke, such as
`one-over-per-run`.

A game whose runs end only when someone plays them ships a `contract.player.ts` beside its
page. The file plays the runs, and `src/harness.ts` describes its type.

The package depends on vitest and happy-dom, so it installs far more than
`@skkuverse/miniapp-cli` does. That is why the two are separate packages.
