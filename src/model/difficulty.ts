// The difficulty table. It is the only place that sets how hard a level is (spec, Module 2).
// Each new kind of difficulty adds a column to `Difficulty` and a value to each row.

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
  /** The cards that start face-down, under the top card of a stack. */
  readonly faceDown: number;
  /** The cards in the deck. The Child taps the deck for them. */
  readonly deck: number;
  /**
   * The category cards that start on the table or in the deck, not on their piles. Each one has an empty slot,
   * and the Child puts it there. A value above the number of groups means all category cards.
   */
  readonly looseAnchors: number;
};

/** A row applies from its `from` level until the next row starts. */
type Row = Difficulty & { readonly from: number };

const FIRST: Row = { from: 1, minGroups: 2, maxGroups: 2, cards: 3, faceDown: 0, deck: 0, looseAnchors: 0 };

/** All category cards of the level start loose. The level has at most 4 groups. */
const ALL = 4;

// Levels 1 to 10 grow one step each 2 levels: first more cards, then one more pile with 3 cards again.
// From level 11, a level shows 2 to 4 piles, and the face-down cards and the deck make it harder.
// From level 13, the Child puts one category card on its slot, and from level 16 all category cards.
// Each new action starts 2 levels after the one before, so the Child learns one action at a time.
const TABLE: readonly Row[] = [
  FIRST,
  { from: 3, minGroups: 2, maxGroups: 2, cards: 4, faceDown: 0, deck: 0, looseAnchors: 0 },
  { from: 5, minGroups: 3, maxGroups: 3, cards: 3, faceDown: 0, deck: 0, looseAnchors: 0 },
  { from: 7, minGroups: 3, maxGroups: 3, cards: 4, faceDown: 0, deck: 0, looseAnchors: 0 },
  { from: 9, minGroups: 4, maxGroups: 4, cards: 3, faceDown: 0, deck: 0, looseAnchors: 0 },
  { from: 11, minGroups: 2, maxGroups: 4, cards: 4, faceDown: 2, deck: 2, looseAnchors: 0 },
  { from: 13, minGroups: 2, maxGroups: 4, cards: 4, faceDown: 2, deck: 2, looseAnchors: 1 },
  { from: 16, minGroups: 2, maxGroups: 4, cards: 5, faceDown: 3, deck: 3, looseAnchors: ALL },
];

/** The difficulty of the level. */
export const difficultyOf = (level: number): Difficulty => TABLE.findLast((row) => row.from <= level) ?? FIRST;
