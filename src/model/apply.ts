import type { Action, Card, CardId, GameEvent, GameState, GroupId, Outcome, PileId } from './types';

/** The Child drops the card on the pile. */
export const dropCard = (cardId: CardId, pileId: PileId): Action => ({ type: 'dropCard', cardId, pileId });

/** The cards that are not on a pile yet. Ticket 06 adds the cards of the deck here. */
export const cardsLeft = (state: GameState): readonly Card[] => state.table;

/** The events after a snap: `groupComplete` when no card of the group is left, `levelComplete` when no card is left. */
const completions = (state: GameState, group: GroupId, pileId: PileId): readonly GameEvent[] => {
  const left = cardsLeft(state);
  if (left.some((card) => card.group === group)) {
    return [];
  }
  const groupComplete: GameEvent = { type: 'groupComplete', pileId };
  return left.length > 0 ? [groupComplete] : [groupComplete, { type: 'levelComplete' }];
};

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
  const next: GameState = {
    ...state,
    table: state.table.filter((c) => c !== card),
    piles: state.piles.map((p) => (p === target ? { ...p, cards: [...p.cards, card] } : p)),
  };
  return {
    state: next,
    events: [
      { type: 'snapped', cardId, pileId, noteIndex: target.cards.length },
      ...completions(next, card.group, pileId),
    ],
  };
};
