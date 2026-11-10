import { deal } from './generator';
import { EMPTY_BOOK } from './stickers';
import type { GameState, Progress } from './types';

/**
 * Deals the level for the progress. `seed` is the seed of the game: the deal of level L comes from the seed
 * and L together, so the state keeps the same seed from level to level. The book is empty and no demo is seen;
 * `go` carries the book and the seen demos of the Child to the next level.
 */
export const start = (progress: Progress, seed: number): GameState => ({
  level: progress.level,
  seed,
  ...deal(progress.level, seed),
  book: EMPTY_BOOK,
  demos: [],
});
