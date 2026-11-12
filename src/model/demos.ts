import { legalMoves } from './moves';
import { DEMO_KINDS } from './types';
import type { DemoKind, GameState, LevelAction } from './types';

// The demo hand and the hint hop (spec, user stories 24 to 29). The model chooses the move that the hand shows
// and the card that hops. The UI shows them, and it starts the time without action (the model has no time).

/** A move that the Child can do now (a move of `legalMoves`): the hint hop and the hand show it. */
export type Hint = LevelAction;

/** A demo of the hand: the action that it teaches, and the move that it shows. */
export type Demo = { readonly kind: DemoKind; readonly move: Hint };

/** The move that each demo shows in this state, or undefined when the state has no such move. */
const SHOWS: Readonly<Record<DemoKind, (moves: readonly Hint[]) => Hint | undefined>> = {
  first: (moves) => moves.find((move) => move.type === 'dropCard'),
  deck: (moves) => moves.find((move) => move.type === 'tapDeck'),
  anchor: (moves) => moves.find((move) => move.type === 'placeAnchor'),
};

/**
 * The demo to show now: the first demo that the Child did not see and that has a move in this state.
 * Undefined when no demo applies. Ask again after each move, because a new action can come with a move.
 */
export const demoFor = (state: GameState): Demo | undefined => {
  const moves = legalMoves(state);
  return DEMO_KINDS.filter((kind) => !state.demos.includes(kind))
    .map((kind) => ({ kind, move: SHOWS[kind](moves) }))
    .find((demo): demo is Demo => demo.move !== undefined);
};

/** The move of the hint: the card that hops, or the deck. A drop comes first. Undefined when the level is finished. */
export const hintFor = (state: GameState): Hint | undefined => legalMoves(state)[0];

/** The state after the Child saw the demo. The save keeps it, so the demo does not show again. */
export const sawDemo = (state: GameState, kind: DemoKind): GameState =>
  state.demos.includes(kind) ? state : { ...state, demos: [...state.demos, kind] };
