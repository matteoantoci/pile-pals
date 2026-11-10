import { playSound } from '../sound';
import type { GameEvent } from '../model';

/** Plays the sound slot of one model event. A new event type gets its case here (tickets 06 and 08). */
export const playEventSound = (event: GameEvent): void => {
  switch (event.type) {
    case 'snapped':
      playSound('snap', event.noteIndex);
      break;
    case 'rejected':
      playSound('wrong');
      break;
  }
};
