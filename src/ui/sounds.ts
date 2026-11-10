import { playSound } from '../sound';
import type { GameEvent } from '../model';

/** Plays the sound slot of one model event. A new event type gets its case here (ticket 06). */
const playEventSound = (event: GameEvent): void => {
  switch (event.type) {
    case 'snapped':
      playSound('snap', event.noteIndex);
      break;
    case 'rejected':
      playSound('wrong');
      break;
    case 'flipped':
      playSound('flip');
      break;
    case 'dealt':
      playSound('deck');
      break;
    case 'groupComplete':
      playSound('group');
      break;
    case 'levelComplete':
      playSound('level');
      break;
    case 'stickerPlaced':
      playSound('snap');
      break;
    case 'stickerAwarded':
    case 'bookComplete':
      // These come with the level fanfare. The sticker book page plays the pal of the new sticker when it opens.
      break;
  }
};

/** Plays the events of one action. Call it in the input handler (for example the drop):
 * the input is a user gesture, so it can also start the audio. */
export const playEventSounds = (events: readonly GameEvent[]): void => {
  for (const event of events) {
    playEventSound(event);
  }
};
