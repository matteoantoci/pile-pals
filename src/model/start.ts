import type { Card, GameState, GroupId, PictureId, Pile, Progress } from './types';

// One fixed level with 2 piles: fruit and birds. The pictures are Noto 2D stills from the content catalog.
// The level generator (ticket 03) replaces this level.
// Each card here is a member of its own group and fits no other group of this level (content-model.md §5).

const FRUIT: GroupId = 'fruit';
const BIRDS: GroupId = 'birds';

const card = (picture: PictureId, group: GroupId): Card => ({ id: picture, group, picture });

const pile = (group: GroupId, picture: PictureId): Pile => ({ id: group, group, picture, cards: [] });

const TABLE: readonly Card[] = [
  card('cherries', FRUIT),
  card('baby-chick', BIRDS),
  card('grapes', FRUIT),
  card('dove', BIRDS),
  card('blueberries', FRUIT),
  card('blackbird', BIRDS),
];

const PILES: readonly Pile[] = [pile(FRUIT, 'red-apple'), pile(BIRDS, 'bird')];

/** Deals the level for the progress. The state keeps the seed for the level generator. */
export const start = (progress: Progress, seed: number): GameState => ({
  level: progress.level,
  seed,
  table: TABLE,
  piles: PILES,
});
