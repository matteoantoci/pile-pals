// The hint hop: the card of the hint (or the deck) jumps a little, and then lands with a smaller second jump.
// The hop is on `.card-face`, because the drag owns the transform of `.card`. Ticket 16 tunes the values.

import { facePose, REST_SCALE, settle, stop } from '../motion';
import { cardOf, deckOf } from './parts';
import type { Hint } from '../../model';
import type { Frame } from '../motion';

const HOP_MS = 520;
/** The height of the first jump (px). The second jump is a third of it. */
const HOP_Y = -18;

/** The frames of the hop for a face that rests at `scale`. */
const hopFrames = (scale: number): readonly Frame[] => [
  { offset: 0, transform: facePose({ scale }) },
  { offset: 0.35, transform: facePose({ y: HOP_Y, scale }) },
  { offset: 0.6, transform: facePose({ scale }) },
  { offset: 0.8, transform: facePose({ y: HOP_Y / 3, scale }) },
  { offset: 1, transform: facePose({ scale }) },
];

/** Hops the card of the hint move, or the deck when the hint is a tap on the deck. */
export const hop = (move: Hint): void => {
  const deck = move.type === 'tapDeck';
  const el = deck ? deckOf() : cardOf(move.cardId)?.querySelector<HTMLElement>('.card-face');
  if (!el) {
    return;
  }
  stop(el);
  settle(el, hopFrames(deck ? 1 : REST_SCALE), { duration: HOP_MS, easing: 'ease-out' });
};
