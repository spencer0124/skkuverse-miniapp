# @skkuverse/game-contract

Plays a built skkuverse game against the fake host from `@skkuverse/miniapp/testing` and
fails when the page breaks a rule of the game protocol contract. It needs Node 22.13 or later.

Run it from the repository root, the folder that holds `deploy.config.json`, after the games are built:

```sh
pnpm add -D @skkuverse/game-contract
pnpm exec game-contract                 # every game under games/
pnpm exec game-contract <id>...         # the games named
pnpm exec game-contract --entry <module> --html <index.html> [--player <module>] [--name <name>]
```

Each page is played twice, in vitest with a happy-dom window. The first run has the host
there at once. The second has a host that appears only after the page gave up its search
and called `onNoHost`. The command exits 1 and names each rule a page broke, such as
`one-over-per-run`. It exits 2 and prints `runner error, contract not checked` when a run
ends without a verdict, for example when the page fails to load. The error printed above
that line says why.

A game whose runs end only when someone plays them ships a `contract.player.ts` beside its
page. The file plays the runs, and its type is `ContractPlayer` in
[`src/harness.ts`](https://github.com/skkuverse/skkuverse-miniapp/blob/main/packages/game-contract/src/harness.ts).

The package depends on vitest and happy-dom, so it installs far more than
`@skkuverse/miniapp-cli` does. That is why the two are separate packages.
