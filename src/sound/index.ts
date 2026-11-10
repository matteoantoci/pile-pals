// The public interface of the sound module (spec Module 8). The UI imports only from this file.
// The UI plays a slot for each model event. The game model has no audio.
import { installAudio, playClip } from './engine';
import { SHIPPED } from './levels';

export { loadClip, playClip } from './engine';
export { CLIPS } from './levels';
export type { Clip, ClipLevel } from './levels';

/** A sound slot. scripts/audio/prep.py writes the shipped file of each slot from src/sound/sounds.json. */
export type SoundSlot = keyof typeof SHIPPED;

/** The major scale in semitones. Note 7 is one octave above note 0. */
const SCALE = [0, 2, 4, 5, 7, 9, 11] as const;

/** The playbackRate of snap note n: each card on a pile plays the next note of the major scale. */
export const noteRate = (note: number): number => {
  const octave = Math.floor(note / SCALE.length);
  const step = SCALE[note % SCALE.length] ?? 0;
  return 2 ** ((12 * octave + step) / 12);
};

/** Call one time at start, before the first touch. */
export const installSound = (): void => {
  installAudio(Object.values(SHIPPED));
};

/** Plays the shipped sound of a slot. For the snap, `note` is the noteIndex of the event (0 for the first card). */
export const playSound = (slot: SoundSlot, note = 0): void => {
  playClip(SHIPPED[slot], slot === 'snap' ? noteRate(note) : 1);
};
