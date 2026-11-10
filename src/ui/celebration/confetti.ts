import confetti from 'canvas-confetti';
import { canceled } from '../motion';
import type { Options } from 'canvas-confetti';

// The confetti of a completed level (research/native-feel/motion.md §6). The default cannon of
// canvas-confetti makes one full-screen canvas above the board, in a worker, and takes no touch.
// It plays no confetti when the Child asks for less motion.

/** One burst: 100 pieces from the lower middle of the screen, above the parade (research §6). */
const BURST: Options = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  ticks: 200,
  zIndex: 1900,
  disableForReducedMotion: true,
};

/** Fires one burst of confetti. The pieces fall over the next step, so the flow does not wait for them. */
export const fireConfetti = (): void => {
  confetti(BURST)?.catch(canceled);
};
