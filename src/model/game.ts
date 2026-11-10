import { cardsLeft, playMove } from './apply';
import { start } from './start';
import { paste, place, rewarded } from './stickers';
import type { Action, GameState, Outcome, Position } from './types';

/** The Child puts the new sticker at this place of the book page. */
export const placeSticker = (position: Position): Action => ({ type: 'placeSticker', position });

/** The Child taps the green arrow button of the book page. */
export const go = (): Action => ({ type: 'go' });

/** True when no card of the level is left: the sticker book page shows, and `go` starts the next level. */
export const isFinished = (state: GameState): boolean => cardsLeft(state).length === 0;

/**
 * The next level after a finished level, with the same game seed and the same seen demos. The new sticker stays
 * on the page: at the place where the Child put it, or at a free spot. A level that is not finished stays.
 */
const goOn = (state: GameState): Outcome => {
  if (!isFinished(state)) {
    return { state, events: [] };
  }
  const pasted = paste(state.book);
  const next = { ...start({ level: state.level + 1 }, state.seed), book: pasted.book, demos: state.demos };
  return { state: next, events: pasted.events };
};

/** Applies one action. A rejected action returns the same state object. */
export const apply = (state: GameState, action: Action): Outcome => {
  switch (action.type) {
    case 'placeSticker':
      return place(state, action.position);
    case 'go':
      return goOn(state);
    case 'dropCard':
    case 'tapDeck':
    case 'placeAnchor':
      return rewarded(playMove(state, action));
    default: {
      // A new member of the `Action` union must get its case above. This line keeps the switch complete.
      const unhandled: never = action;
      return unhandled;
    }
  }
};
