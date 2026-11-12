/*
 * A FIXTURE, not a game: the game template, booted only after its entry
 * module waits on a timer at its top level. The contract's tests assert that
 * it keeps the contract.
 */
await new Promise((resolve) => setTimeout(resolve, 1_000));
await import('../../../cli/templates/game/src/main.ts');
