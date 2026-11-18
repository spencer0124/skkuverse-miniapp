/**
 * The page's sound: 8-bit tones rendered in the page by ZzFX, so no audio file
 * rides in the bundle. The original runner has three sounds — a jump, a chirp
 * every 100 points, a thud on the crash — and those three lead here too; the
 * rest are for what this game adds (the second jump and the dive).
 *
 * Played through Web Audio in the page rather than by the app: a jump sound has
 * to land with the tap, and a bridge round trip would make it late.
 *
 * iOS opens audio only inside a tap, so nothing plays until `unlockSound()` is
 * called from one. The session is `ambient`: the ring/silent switch silences
 * it, and music the player has on keeps playing underneath.
 */
import { createSoundBank, type Cue } from '../kit/sound';
import type { Tone } from './zzfx';

type ToneName = keyof typeof TONES;
export type CueName = keyof typeof CUES;

// ZzFX order: volume, randomness, frequency, attack, sustain, release, shape,
// shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise,
// modulation, bitCrush. Shape 0 with shapeCurve 0 is a square wave.
const TONES = {
  /** The jump: a square blip bending up, like the original's press. */
  blip: [0.5, 0, 420, 0, 0.03, 0.05, 0, 0, 6],
  /** One short square note, for chimes. */
  note: [0.35, 0, 880, 0, 0.05, 0.07, 0, 0],
  /** The same note held, to end a phrase on. */
  chime: [0.35, 0, 880, 0, 0.12, 0.22, 0, 0],
  /** A triangle falling away: the dive. */
  sweep: [0.4, 0, 760, 0, 0.03, 0.09, 1, 1, -8],
  /** A low sine drop with some grit: a dive hitting the ground. */
  thud: [0.9, 0, 90, 0, 0.02, 0.12, 0, 1, -0.4, 0, 0, 0, 0, 0.2],
  /** A breath of noise: the wave slapping up under the runner. */
  spray: [0.2, 0, 2000, 0, 0.005, 0.07, 4, 1, 0, 0, 0, 0, 0, 1],
  /** The crash: a burst of noise over a crushed square falling away. */
  crunch: [0.6, 0, 500, 0, 0.04, 0.2, 4, 1, -2],
  buzz: [0.5, 0, 220, 0, 0.08, 0.2, 0, 0, -0.6, 0, 0, 0, 0, 0, 0, 0.1],
} satisfies Record<string, Tone>;

const CUES = {
  jump: { notes: [{ tone: 'blip' }], jitter: 0.04 },
  doubleJump: { notes: [{ tone: 'blip', semitones: 5 }], jitter: 0.04 },
  dive: { notes: [{ tone: 'sweep' }], jitter: 0.05 },
  land: { notes: [{ tone: 'thud' }], jitter: 0.06 },
  splash: { notes: [{ tone: 'spray' }], jitter: 0.15 },
  /** Every 100 points, as the original chirps. */
  milestone: { notes: [{ tone: 'note' }, { tone: 'note', semitones: 7, at: 0.08 }] },
  /** Every 1000: the chirp carried up to the octave. */
  thousand: {
    notes: [
      { tone: 'note' },
      { tone: 'note', semitones: 4, at: 0.07 },
      { tone: 'note', semitones: 7, at: 0.14 },
      { tone: 'chime', semitones: 12, at: 0.21 },
    ],
  },
  crash: { notes: [{ tone: 'crunch' }, { tone: 'buzz' }] },
} satisfies Record<string, Cue<ToneName>>;

/** The bank renders each tone once when audio is unlocked, and spreads a cue's pitch on every play. */
const bank = createSoundBank(TONES, CUES);

/** Open audio. Call from inside a tap; calling again is harmless. */
export const unlockSound = (): void => bank.unlockSound();

/** The setting from the host's `game.init`. */
export const setSoundOn = (value: boolean): void => bank.setSoundOn(value);

export const playSound = (name: CueName): void => bank.playSound(name);
