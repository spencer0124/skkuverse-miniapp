/*
 * A FIXTURE, not a game: an entry module that waits 90 s of page time on a
 * timer at its top level, past the runner's load cap. The contract's tests
 * assert that the runner gives up on it.
 */
await new Promise((resolve) => setTimeout(resolve, 90_000));
