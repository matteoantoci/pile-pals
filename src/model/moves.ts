import { apply, cardsLeft, dropCard, tapDeck } from './apply';
import type { Action, GameState } from './types';

// The dead-end check of the level generator (spec, Module 2 "Dead-end check").
// A move never makes the table worse: a card only leaves the table, a wrong drop changes nothing, and the deck
// gives its cards again. So the check plays every legal move until no move is left. When cards stay, the generator
// rejects the deal and deals again with the next seed.
// Ticket 07 adds the move of a category card to `legalMoves`. The check then sees that move with no other change.

/** The moves that the game allows in this state. */
export const legalMoves = (state: GameState): readonly Action[] => {
  const open = [...state.table.flatMap((stack) => stack.cards.slice(-1)), ...(state.dealt ? [state.dealt] : [])];
  const drops = open.flatMap((card) =>
    state.piles.filter((pile) => pile.group === card.group).map((pile) => dropCard(card.id, pile.id))
  );
  return state.deck.length > 0 ? [...drops, tapDeck()] : drops;
};

/**
 * Plays one legal move after the other until no move is left, and gives the state at the end.
 * A tap of the deck that gives no new card stops the play: after one turn of the deck, the cards repeat.
 */
const playOut = (state: GameState, taps = 0): GameState => {
  const move =
    taps <= state.deck.length + 1 && cardsLeft(state).length > 0
      ? (legalMoves(state).find((item) => item.type === 'dropCard') ?? (state.deck.length > 0 ? tapDeck() : undefined))
      : undefined;
  return move ? playOut(apply(state, move).state, move.type === 'tapDeck' ? taps + 1 : 0) : state;
};

/** True when the deal can be finished: the check plays every legal move and no card stays. */
export const canFinish = (state: GameState): boolean => cardsLeft(playOut(state)).length === 0;
