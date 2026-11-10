import type { Action, CardId, GameState, Outcome, PileId } from './types';

/** The Child drops the card on the pile. */
export const dropCard = (cardId: CardId, pileId: PileId): Action => ({ type: 'dropCard', cardId, pileId });

/**
 * Applies one action. A rejected action returns the same state object.
 * `dropCard` is the only action now. When the Action union gets a second member, switch on `action.type` here.
 */
export const apply = (state: GameState, action: Action): Outcome => {
  const { cardId, pileId } = action;
  const card = state.table.find((c) => c.id === cardId);
  const target = state.piles.find((p) => p.id === pileId);
  if (!card || target?.group !== card.group) {
    return { state, events: [{ type: 'rejected', cardId }] };
  }
  return {
    state: {
      ...state,
      table: state.table.filter((c) => c !== card),
      piles: state.piles.map((p) => (p === target ? { ...p, cards: [...p.cards, card] } : p)),
    },
    events: [{ type: 'snapped', cardId, pileId, noteIndex: target.cards.length }],
  };
};
