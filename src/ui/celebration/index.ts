// The celebration layer (spec Module 7). The board plays a parade after each completed group and the
// confetti after each completed level. Ticket 11 (sticker book) puts its screen in the after hook.
// The fanfare is the `level` sound of src/ui/sounds.ts: it plays with the drop that finishes the level.

import { fireConfetti } from './confetti';
import { wait } from './wait';

export { animationLimiter, createLimiter, MAX_CONCURRENT_ANIMATIONS } from './limits';
export { parade } from './parade';
export type { Limiter } from './limits';

/** From the confetti to the next step of the reward flow. The confetti keeps falling over that step. */
const CELEBRATION_MS = 1600;

/** Runs when the celebration of a completed level is done. Ticket 11 shows the sticker book here. */
export type AfterCelebration = () => void;

const canceled = (): void => undefined;

/**
 * The celebration of a completed level: the confetti burst, then one step after it.
 * Now the step deals the next level; ticket 11 shows the sticker book first, then deals.
 */
export const celebrateLevel = (afterCelebration: AfterCelebration): void => {
  fireConfetti();
  wait(CELEBRATION_MS).then(afterCelebration).catch(canceled);
};
