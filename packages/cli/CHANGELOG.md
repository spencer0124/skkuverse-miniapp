# @skkuverse/miniapp-cli

## 0.2.0

### Minor Changes

- ee199f2: `miniapp-cli check --json` prints every finding as a JSON array on stdout, one finding per line, with its rule, message, kind of package and a link to the spec section that defines the rule. Errors still go to stderr, so a script or an editor can read the result without parsing text.

## 0.1.0

### Minor Changes

- 1fb5432: First release. `@skkuverse/miniapp-cli` checks, scaffolds and ships miniapps and games. `@skkuverse/game-contract` plays a built game against the fake host and holds it to the protocol contract.

### Patch Changes

- 1007683: `check` ends an inline or remote `<script>` at an end tag that carries attributes, as a browser does, and no longer joins the text around a removed comment into a tag. `game-contract` drops every script happy-dom parses from the mounted body, instead of cutting them out of the markup by pattern.
- f778204: `check` holds every `<MiniappRoot>` outside a comment to R2 and R3, fails G2 for a game with no `src/` or one that never calls the `bootGame` it imports, and checks only the named packages' entries for R4. Every command looks up a `deploy.config.json` entry by its own id only, and refuses a Pages project outside its section's prefix (`miniapp-` or `game-`) or one two entries name. `game-contract` finds a built page's module script by its attributes with a relative `src`, sets each session's host and player itself whatever the caller exported, counts a `game.over` sent while a run was being started, sends the final `game.revive` even when no revive was offered, and lets page time pass while an entry module awaits a timer at its top level.
- Updated dependencies [0a41995]
- Updated dependencies [f4eb98c]
  - @skkuverse/miniapp@0.4.2
