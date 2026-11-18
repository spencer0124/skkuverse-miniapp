/**
 * A game page's sound: short tones rendered in the page by ZzFX, so no audio
 * file rides in the bundle, played as cues — one or more tones, shifted in
 * pitch and time. A game passes its own tone table and cues.
 *
 * Played through Web Audio in the page rather than by the app: a sound has to
 * land with the tap, and a bridge round trip would make it late.
 *
 * iOS opens audio only inside a tap, so nothing plays until `unlockSound()` is
 * called from one. The session is `ambient`: the ring/silent switch silences
 * it, and music the player has on keeps playing underneath.
 */
import { renderTone, type Tone } from './zzfx';

/** One tone in a cue, shifted in pitch and time. */
export interface Note<ToneName extends string = string> {
  tone: ToneName;
  semitones?: number;
  /** Seconds after the cue starts. */
  at?: number;
  level?: number;
}

export interface Cue<ToneName extends string = string> {
  notes: readonly Note<ToneName>[];
  /** Random pitch spread per play (0.04 = ±4%), so a sound heard often is not one copy. */
  jitter?: number;
}

export interface SoundBank<CueName extends string> {
  /** Open audio. Call from inside a tap; calling again is harmless. */
  unlockSound(): void;
  /** The player's setting, from the host. */
  setSoundOn(value: boolean): void;
  /** Play a cue, shifted by `semitones`. */
  playSound(name: CueName, semitones?: number): void;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
  interface Navigator {
    audioSession?: { type: string };
  }
}

/**
 * One game's sound. Each tone renders once, when audio is unlocked; a page
 * makes one bank and keeps it for its lifetime.
 */
export function createSoundBank<
  const Tones extends Record<string, Tone>,
  const Cues extends Record<string, Cue<Extract<keyof Tones, string>>>,
>(tones: Tones, cues: Cues): SoundBank<Extract<keyof Cues, string>> {
  type ToneName = Extract<keyof Tones, string>;
  let ctx: AudioContext | null = null;
  let out: GainNode | null = null;
  let on = true;
  const buffers = new Map<ToneName, AudioBuffer>();

  return {
    unlockSound(): void {
      try {
        if (!ctx) {
          if (navigator.audioSession) navigator.audioSession.type = 'ambient';
          const Ctx = window.AudioContext ?? window.webkitAudioContext;
          if (!Ctx) return;
          ctx = new Ctx();
          out = ctx.createGain();
          out.connect(ctx.destination);
          for (const [name, tone] of Object.entries(tones) as [ToneName, Tone][]) {
            const samples = renderTone(tone, ctx.sampleRate);
            const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
            buffer.getChannelData(0).set(samples);
            buffers.set(name, buffer);
          }
        }
        if (ctx.state !== 'running') void ctx.resume().catch(() => {});
      } catch {
        // No sound is a quieter game, never a broken one.
      }
    },

    setSoundOn(value: boolean): void {
      on = value;
    },

    playSound(name: Extract<keyof Cues, string>, semitones = 0): void {
      if (!on || !ctx || !out) return;
      // iOS suspends the context when the app goes to the background.
      if (ctx.state !== 'running') void ctx.resume().catch(() => {});
      const cue: Cue<ToneName> | undefined = cues[name];
      if (!cue) return;
      const spread = cue.jitter ? 1 + (Math.random() * 2 - 1) * cue.jitter : 1;
      const now = ctx.currentTime;
      try {
        for (const note of cue.notes) {
          const buffer = buffers.get(note.tone);
          if (!buffer) continue;
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = 2 ** (((note.semitones ?? 0) + semitones) / 12) * spread;
          const gain = ctx.createGain();
          gain.gain.value = note.level ?? 1;
          source.connect(gain).connect(out);
          source.start(now + (note.at ?? 0));
        }
      } catch {
        // A lost note, never a broken run.
      }
    },
  };
}
