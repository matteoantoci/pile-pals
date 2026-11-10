// A player for the tests. It tries every card that the Child can pick up on every pile, and taps the deck when no
// card snaps. It uses only the public interface, so a test shows the game that the Child can play. Not a test file:
// vitest does not collect it, and the app does not import it.

import { apply, dropCard, tapDeck } from './index';
import type { Card, GameEvent, GameState, Outcome } from './index';

/** The result of a full play: the events in order, and the state at the end. */
export type Played = { readonly events: readonly GameEvent[]; readonly end: GameState };

/** The top card of each stack and the dealt card: the cards that the Child can pick up. */
export const openCards = (state: GameState): readonly Card[] => [
  ...state.table.flatMap((stack) => stack.cards.slice(-1)),
  ...(state.dealt ? [state.dealt] : []),
];

/** Plays one move: the first card that snaps, else a tap of the deck. Gives undefined when no move is left. */
const nextPlay = (state: GameState): Outcome | undefined => {
  const snapped = openCards(state)
    .flatMap((card) => state.piles.map((pile) => apply(state, dropCard(card.id, pile.id))))
    .find((outcome) => outcome.events.some((event) => event.type === 'snapped'));
  if (snapped) {
    return snapped;
  }
  return state.deck.length > 0 ? apply(state, tapDeck()) : undefined;
};

/** Plays one move, then plays again, until no move is left or the limit shows a stuck level. */
const playFrom = (play: Played, step: number): Played => {
  const move = step < 200 ? nextPlay(play.end) : undefined;
  return move ? playFrom({ events: [...play.events, ...move.events], end: move.state }, step + 1) : play;
};

/** Plays the level to its end, or until no move is left. */
export const playOut = (state: GameState): Played => playFrom({ events: [], end: state }, 0);
