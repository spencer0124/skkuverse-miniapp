/**
 * mulberry32. The state is a plain number held on the game state, not hidden
 * in a closure, so a run is fully described by its seed and its inputs — the
 * property that makes a run replayable.
 */

/** Whatever holds a run's generator state: usually the game state itself. */
export interface RandomHolder {
  rng: number;
}

/** The next number in [0, 1), advancing the holder's state. */
export function nextRandom(holder: RandomHolder): number {
  let t = (holder.rng = (holder.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Inclusive on both ends. */
export function randomInt(holder: RandomHolder, min: number, max: number): number {
  return Math.floor(nextRandom(holder) * (max - min + 1)) + min;
}

/** A fresh 32-bit seed for a new run. */
export function newSeed(): number {
  return (Math.random() * 0x100000000) >>> 0;
}
