import { cardsLeft, dropCard, placeAnchor, playMove, tapDeck } from './apply';
import type { GameState, LevelAction } from './types';

// The dead-end check of the level generator (spec, Module 2 "Dead-end check").
// A move never makes the table worse: a card only leaves the table, a wrong drop changes nothing, the deck
// gives its cards again, and a category card always has a free slot. So the check plays every legal move until no
// move is left. When cards stay, the generator rejects the deal and deals again with the next seed.

/** The moves that the game allows in this state: the drops first, then the category cards, then the deck. */
export const legalMoves = (state: GameState): readonly LevelAction[] => {
  const open = [...state.table.flatMap((stack) => stack.cards.slice(-1)), ...(state.dealt ? [state.dealt] : [])];
  const drops = open.flatMap((card) =>
    state.piles.filter((pile) => pile.group === card.group).map((pile) => dropCard(card.id, pile.id))
  );
  const slots = state.piles.filter((pile) => pile.group === null);
  const places = open
    .filter((card) => card.anchor)
    .flatMap((card) => slots.map((slot) => placeAnchor(card.id, slot.id)));
  return state.deck.length > 0 ? [...drops, ...places, tapDeck()] : [...drops, ...places];
};

/**
 * Plays one legal move after the other until no move is left, and gives the state at the end.
 * A tap of the deck that gives no new card stops the play: after one turn of the deck, the cards repeat.
 */
const playOut = (state: GameState, taps = 0): GameState => {
  const move = taps <= state.deck.length + 1 && cardsLeft(state).length > 0 ? legalMoves(state)[0] : undefined;
  return move ? playOut(playMove(state, move).state, move.type === 'tapDeck' ? taps + 1 : 0) : state;
};

/** True when the deal can be finished: the check plays every legal move and no card stays. */
export const canFinish = (state: GameState): boolean => cardsLeft(playOut(state)).length === 0;
