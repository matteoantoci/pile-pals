import { legalMoves } from './moves';
import type { DemoKind, GameState, LevelAction } from './types';

// The demo hand and the hint hop (spec, user stories 24 to 29). The model chooses the move that the hand shows
// and the card that hops. The UI shows them, and it starts the time without action (the model has no time).

/** A move that the Child can do now (a move of `legalMoves`): the hint hop and the hand show it. */
export type Hint = LevelAction;

/** A demo of the hand: the action that it teaches, and the move that it shows. */
export type Demo = { readonly kind: DemoKind; readonly move: Hint };

/** The move that each demo shows in this state, or undefined when the state has no such move. */
const SHOWS: Readonly<Record<DemoKind, (state: GameState, moves: readonly Hint[]) => Hint | undefined>> = {
  first: (_state, moves) => moves.find((move) => move.type === 'dropCard'),
  faceDown: (state, moves) => moves.find((move) => 'cardId' in move && coversFaceDown(state, move.cardId)),
  anchor: (_state, moves) => moves.find((move) => move.type === 'placeAnchor'),
  deck: (_state, moves) => moves.find((move) => move.type === 'tapDeck'),
};

/** One action at a time: the order of the demos when two new actions come in the same level. */
const ORDER: readonly DemoKind[] = ['first', 'faceDown', 'anchor', 'deck'];

/** True when the card is on top of a stack and a face-down card is under it, so its move turns that card over. */
const coversFaceDown = (state: GameState, cardId: string): boolean =>
  state.table.some((stack) => stack.cards.at(-1)?.id === cardId && stack.cards.some((card) => card.faceDown));

/**
 * The demo to show now: the first demo that the Child did not see and that has a move in this state.
 * Undefined when no demo applies. Ask again after each move, because a new action can come with a move.
 */
export const demoFor = (state: GameState): Demo | undefined => {
  const moves = legalMoves(state);
  return ORDER.filter((kind) => !state.demos.includes(kind))
    .map((kind) => ({ kind, move: SHOWS[kind](state, moves) }))
    .find((demo): demo is Demo => demo.move !== undefined);
};

/** The move of the hint: the card that hops, or the deck. A drop comes first. Undefined when the level is finished. */
export const hintFor = (state: GameState): Hint | undefined => legalMoves(state)[0];

/** The state after the Child saw the demo. The save keeps it, so the demo does not show again. */
export const sawDemo = (state: GameState, kind: DemoKind): GameState =>
  state.demos.includes(kind) ? state : { ...state, demos: [...state.demos, kind] };
