import type { Card, GameState, GroupId, Pile, Progress } from './types';

// One fixed level with 2 piles and placeholder emoji pictures.
// The level generator (ticket 03) replaces this level. Ticket 02 replaces the pictures.

const FRUIT: GroupId = 'fruit';
const ANIMALS: GroupId = 'animals';

const card = (id: string, group: GroupId, picture: string): Card => ({ id, group, picture });

const pile = (group: GroupId, picture: string): Pile => ({ id: group, group, picture, cards: [] });

const TABLE: readonly Card[] = [
  card('banana', FRUIT, '🍌'),
  card('cat', ANIMALS, '🐱'),
  card('grapes', FRUIT, '🍇'),
  card('rabbit', ANIMALS, '🐰'),
  card('pear', FRUIT, '🍐'),
  card('bear', ANIMALS, '🐻'),
];

const PILES: readonly Pile[] = [pile(FRUIT, '🍎'), pile(ANIMALS, '🐶')];

/** Deals the level for the progress. The state keeps the seed for the level generator. */
export const start = (progress: Progress, seed: number): GameState => ({
  level: progress.level,
  seed,
  table: TABLE,
  piles: PILES,
});
