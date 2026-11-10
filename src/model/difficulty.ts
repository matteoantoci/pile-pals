// The difficulty table. It is the only place that sets how hard a level is (spec, Module 2).
// Ticket 06 adds the face-down cards and the deck, and ticket 07 adds the category cards that the Child places:
// each adds a column to `Difficulty` and a value to each row.

/** How hard one level is. */
export type Difficulty = {
  /** The fewest groups (piles) in the level. */
  readonly minGroups: number;
  /**
   * The most groups (piles) in the level. A type with fewer groups shows all its groups, and a type that cannot
   * fill the most piles fairly gets fewer piles. So the small types (for example hot and cold) come in later levels too.
   */
  readonly maxGroups: number;
  /** The cards for each group. The category card is not included. */
  readonly cards: number;
};

/** A row applies from its `from` level until the next row starts. */
type Row = Difficulty & { readonly from: number };

const FIRST: Row = { from: 1, minGroups: 2, maxGroups: 2, cards: 3 };

// Levels 1 to 10 grow one step each 2 levels: first more cards, then one more pile with 3 cards again.
// From level 11, a level shows 2 to 4 piles, and the face-down cards and the deck (ticket 06) make it harder.
const TABLE: readonly Row[] = [
  FIRST,
  { from: 3, minGroups: 2, maxGroups: 2, cards: 4 },
  { from: 5, minGroups: 3, maxGroups: 3, cards: 3 },
  { from: 7, minGroups: 3, maxGroups: 3, cards: 4 },
  { from: 9, minGroups: 4, maxGroups: 4, cards: 3 },
  { from: 11, minGroups: 2, maxGroups: 4, cards: 4 },
  { from: 16, minGroups: 2, maxGroups: 4, cards: 5 },
];

/** The difficulty of the level. */
export const difficultyOf = (level: number): Difficulty => TABLE.findLast((row) => row.from <= level) ?? FIRST;
