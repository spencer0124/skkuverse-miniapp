# @skkuverse/game-contract

Plays a built skkuverse game against the fake host from `@skkuverse/miniapp/testing` and
fails when the page breaks a rule of the game protocol contract. It needs Node 22.13 or later
in the 22 line, Node 24, or Node 26 or later. It does not support Node 23 or 25, because
vitest, which runs the pages, does not.

Run it from the repository root, the folder that holds `deploy.config.json`, after the games are built:

```sh
pnpm add -Dw @skkuverse/game-contract
pnpm exec game-contract                 # every game under games/
pnpm exec game-contract <id>...         # the games named
pnpm exec game-contract --entry <module> --html <index.html> [--player <module>] [--name <name>]
```

Each page is played twice, in vitest with a happy-dom window. The first run has the host
there at once. The second has a host that appears only after the page gave up its search
and called `onNoHost`.

The command ends with one of three exit codes:

- `0` when every page keeps the contract, and after `--help` or `-h`.
- `1` when a page breaks a rule of the contract. The command names each rule the page
  broke, such as `one-over-per-run`, and prints `broke the game contract`. The runner's own
  rules, `host-found`, `run-starts`, `run-ends` and `revive-capped`, are verdicts too, so a
  game without the player it needs reads as a broken contract. It also exits 1 on a usage
  error, before any page is played: no `deploy.config.json` in the folder, a game that is not
  built, a built `index.html` that loads no module script, `--entry` without a value, `--entry` without `--html`, an option it
  does not know, or a `GAME_CONTRACT_SESSION_TIMEOUT_MS` that is not a whole number above 0.
- `2` when a run ends without a verdict. The command prints `runner error, contract not
  checked`, and the error printed above that line says what went wrong. That happens when
  vitest fails to start, or when the page or its player fails to load or throws. A throw in
  an event listener or a timer counts, and so does a promise rejection that nothing handles.
  It also happens when a run passes the two-minute test timeout, and when a session still
  runs after three minutes, as one with a page stuck in a loop does. The command kills that
  session. To change the limit, set `GAME_CONTRACT_SESSION_TIMEOUT_MS` to a number of
  milliseconds.

When one page breaks a rule and another ends without a verdict, the command exits 2: a
runner error wins over a broken contract, because the page with no verdict may break one too.

A game whose runs end only when someone plays them ships a `contract.player.ts` beside its
page. The file plays the runs, and its type is `ContractPlayer` in
[`src/harness.ts`](https://github.com/spencer0124/skkuverse-miniapp/blob/main/packages/game-contract/src/harness.ts).

The package depends on vitest and happy-dom, so it installs far more than
`@skkuverse/miniapp-cli` does. That is why the two are separate packages.
