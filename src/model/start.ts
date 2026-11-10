import { cardsLeft } from './apply';
import { deal } from './generator';
import type { GameState, Progress } from './types';

/**
 * Deals the level for the progress. `seed` is the seed of the game: the deal of level L comes from the seed
 * and L together, so the state keeps the same seed from level to level.
 */
export const start = (progress: Progress, seed: number): GameState => ({
  level: progress.level,
  seed,
  ...deal(progress.level, seed),
});

/** Deals the level after a finished level, with the same game seed. A level that is not finished stays. */
export const nextLevel = (state: GameState): GameState =>
  cardsLeft(state).length > 0 ? state : start({ level: state.level + 1 }, state.seed);
