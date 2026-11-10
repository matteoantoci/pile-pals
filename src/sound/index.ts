// The public interface of the sound module (spec Module 8). The UI imports only from this file.
// The UI plays a slot for each model event. The game model has no audio.
import { installAudio, playClip } from './engine';
import { SHIPPED } from './levels';
import type { PalSize } from '../model';
import type { Clip } from './levels';

export { isAudioRunning, isSoundOn, loadClip, playClip, setSoundOn } from './engine';
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

/** The playbackRate of the pop for each size: a fifth up for a small pal, a fifth down for a large pal. */
export const POP_RATE: Readonly<Record<PalSize, number>> = { S: 1.5, M: 1, L: 2 / 3 };

const shipped: Readonly<Record<string, Clip | undefined>> = SHIPPED;

/**
 * Plays the sound of a pal (title scene, parades, sticker book). The slot of an own sound is "pal-<card id>".
 * A pal with no own sound plays the pop at the rate of its size tag (`palSize` of the game model). A card with no
 * tag plays the middle pop.
 */
export const playPal = (cardId: string, size: PalSize | null): void => {
  const own = shipped[`pal-${cardId}`];
  if (own) {
    playClip(own);
    return;
  }
  playClip(SHIPPED.pop, POP_RATE[size ?? 'M']);
};
