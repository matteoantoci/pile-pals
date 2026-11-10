import { playSound } from '../sound';
import type { GameEvent } from '../model';
import type { SoundSlot } from '../sound';

/**
 * The sound slot of each model event, or null for an event with no own sound. A new event type must get its key
 * here (the Record type checks it). A category card on its slot sounds like the first card on a pile. The sticker
 * award and the complete book come with the level fanfare; the book page plays the pal of the new sticker.
 */
const SLOTS: Readonly<Record<GameEvent['type'], SoundSlot | null>> = {
  snapped: 'snap',
  anchorPlaced: 'snap',
  rejected: 'wrong',
  flipped: 'flip',
  dealt: 'deck',
  groupComplete: 'group',
  levelComplete: 'level',
  stickerAwarded: null,
  stickerPlaced: 'snap',
  bookComplete: null,
};

/** Plays the sound slot of one model event. A snap plays the note of its place on the pile. */
const playEventSound = (event: GameEvent): void => {
  const slot = SLOTS[event.type];
  if (slot !== null) {
    playSound(slot, event.type === 'snapped' ? event.noteIndex : 0);
  }
};

/** Plays the events of one action. Call it in the input handler (for example the drop):
 * the input is a user gesture, so it can also start the audio. */
export const playEventSounds = (events: readonly GameEvent[]): void => {
  for (const event of events) {
    playEventSound(event);
  }
};
