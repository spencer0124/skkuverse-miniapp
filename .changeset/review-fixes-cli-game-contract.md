---
"@skkuverse/miniapp-cli": patch
"@skkuverse/game-contract": patch
---

`check` holds every `<MiniappRoot>` outside a comment to R2 and R3, fails G2 for a game with no `src/` or one that never calls the `bootGame` it imports, and checks only the named packages' entries for R4. Every command looks up a `deploy.config.json` entry by its own id only, and refuses a Pages project outside its section's prefix (`miniapp-` or `game-`) or one two entries name. `game-contract` finds a built page's module script by its attributes with a relative `src`, sets each session's host and player itself whatever the caller exported, counts a `game.over` sent while a run was being started, sends the final `game.revive` even when no revive was offered, and lets page time pass while an entry module awaits a timer at its top level.
