import { cardsLeft } from './apply';
import type { GameState, PileId } from './types';

/** The progress of one pile: `done` cards are on the pile, of `total` cards of its group in the level. */
export type PileProgress = { readonly done: number; readonly total: number };

/**
 * The progress of the pile, for the dots of its category card (spec, "Pile progress"). `total` counts the cards of
 * the group on the pile, on the table, in the deck, and the dealt card, but not the category card. An empty slot
 * has no group, so it gives undefined.
 */
export const pileProgress = (state: GameState, pileId: PileId): PileProgress | undefined => {
  const pile = state.piles.find((item) => item.id === pileId);
  if (pile?.group === null || pile === undefined) {
    return undefined;
  }
  const left = cardsLeft(state).filter((card) => card.group === pile.group && !card.anchor).length;
  return { done: pile.cards.length, total: pile.cards.length + left };
};
