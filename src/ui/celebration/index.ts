// The celebration layer (spec Module 7). The board plays a parade after each completed group and the
// confetti after each completed level. The sticker book page (src/ui/book) comes in the after hook.
// The fanfare is the `level` sound of src/ui/sounds.ts: it plays with the drop that finishes the level.

import { canceled } from '../motion';
import { fireConfetti } from './confetti';
import { wait } from './wait';

export { animationLimiter } from './limits';
export { parade } from './parade';
export { wait } from './wait';

/** From the confetti to the next step of the reward flow. The confetti keeps falling over that step. */
const CELEBRATION_MS = 1600;

/** Runs when the celebration of a completed level is done. The board shows the sticker book page here. */
export type AfterCelebration = () => void;

/** The celebration of a completed level: the confetti burst, then one step after it (the sticker book page). */
export const celebrateLevel = (afterCelebration: AfterCelebration): void => {
  fireConfetti();
  wait(CELEBRATION_MS).then(afterCelebration).catch(canceled);
};
