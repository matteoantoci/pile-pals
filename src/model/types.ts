// The data of the game model. All data is read-only: `apply` returns a new state.

export type CardId = string;
export type PileId = string;
export type StackId = string;
export type GroupId = string;
/** The id of a picture in the content catalog. `pictureOf(id)` gives the files. */
export type PictureId = string;

/**
 * A picture card. `group` is the one pile of the level that accepts the card.
 * A category card (`anchor: true`) shows the picture of its group. The Child puts it on an empty slot with
 * `placeAnchor`, and then the slot accepts the cards of that group.
 */
export type Card = {
  readonly id: CardId;
  readonly group: GroupId;
  readonly picture: PictureId;
  readonly anchor: boolean;
};

/** A card on the table. `faceDown` cards show their back: the card below the top card of a stack. */
export type TableCard = Card & {
  readonly faceDown: boolean;
};

/** A column of cards on the table. `cards` holds the cards, the first card at the bottom and the top card last. */
export type Stack = {
  readonly id: StackId;
  readonly cards: readonly TableCard[];
};

/**
 * A slot for one category pile. `cards` holds the cards on the pile, the first card at the bottom.
 * An empty slot has no category card yet: its `group` and `picture` are null, and it accepts no card.
 * `placeAnchor` puts a category card on it and sets the group and the picture of that card.
 */
export type Pile = {
  readonly id: PileId;
  readonly group: GroupId | null;
  readonly picture: PictureId | null;
  readonly cards: readonly Card[];
};

/** What the Child finished so far. `start` deals the level for this progress. */
export type Progress = {
  readonly level: number;
};

/** A point on a page of the sticker book: x from 0 (left) to 1 (right), y from 0 (top) to 1 (bottom). */
export type Position = {
  readonly x: number;
  readonly y: number;
};

/** A sticker of the book: a pal of the catalog, in its normal or its gold version. */
export type Sticker = {
  /** The picture id of the pal. */
  readonly pal: PictureId;
  readonly gold: boolean;
};

/** A sticker on a page, at the place where the Child put it. */
export type PlacedSticker = Sticker & {
  readonly at: Position;
};

/**
 * The sticker book. It goes with the Child from level to level; the deal of a level does not depend on it.
 * `pages` holds the pages in order, the current page last. The new sticker goes on the current page.
 * `award` is the new sticker of the finished level until `go`. Its `at` is null until the Child drags it.
 */
export type Book = {
  readonly pages: readonly (readonly PlacedSticker[])[];
  readonly award: (Sticker & { readonly at: Position | null }) | null;
};

/**
 * A demo of the hand. Each kind shows one action one time: `first` the first drop of the game, `faceDown` the drop
 * that uncovers a face-down card, `anchor` a category card that goes on an empty slot, and `deck` a tap on the deck.
 */
export type DemoKind = 'first' | 'faceDown' | 'anchor' | 'deck';

/**
 * The level that the Child plays. It is plain data (no Map, no class, no function), so a save can keep it whole.
 * `seed` is the seed of the game: the same seed and level number always give the same deal.
 */
export type GameState = {
  readonly level: number;
  readonly seed: number;
  readonly table: readonly Stack[];
  readonly piles: readonly Pile[];
  /** The face-down deck. The last card is the top card: `tapDeck` gives it. */
  readonly deck: readonly Card[];
  /** The face-up card that the last tap of the deck gave, or null. */
  readonly dealt: Card | null;
  /** The sticker book of the Child. */
  readonly book: Book;
  /** The demos that the Child saw. They go with the Child from level to level, so a demo shows one time only. */
  readonly demos: readonly DemoKind[];
};

/** Each action is one input from the Child. Add new actions to this union. */
export type Action =
  | {
      readonly type: 'dropCard';
      readonly cardId: CardId;
      readonly pileId: PileId;
    }
  /** The Child taps the deck. */
  | {
      readonly type: 'tapDeck';
    }
  /** The Child puts a category card on an empty slot. */
  | {
      readonly type: 'placeAnchor';
      readonly cardId: CardId;
      readonly slotId: PileId;
    }
  /** The Child puts the new sticker at this place of the book page. */
  | {
      readonly type: 'placeSticker';
      readonly position: Position;
    }
  /** The Child taps the green arrow button of the book page: the sticker stays, and the next level starts. */
  | {
      readonly type: 'go';
    };

/** The actions of the play on the table. The sticker actions come after the level. */
export type LevelAction = Exclude<Action, { readonly type: 'placeSticker' | 'go' }>;

/** Each event is one thing that the UI shows or plays. Add new events to this union. */
export type GameEvent =
  | {
      readonly type: 'snapped';
      readonly cardId: CardId;
      readonly pileId: PileId;
      /** 0 for the first card on the pile, 1 for the second card, and so on. */
      readonly noteIndex: number;
    }
  | {
      readonly type: 'rejected';
      readonly cardId: CardId;
    }
  /** The card on top of this card moved away, so this card now shows its picture. */
  | {
      readonly type: 'flipped';
      readonly cardId: CardId;
    }
  /** The deck gave the card that is now face-up on the table. */
  | {
      readonly type: 'dealt';
    }
  /** The category card is on the slot. The slot now accepts the cards of its group. */
  | {
      readonly type: 'anchorPlaced';
      readonly cardId: CardId;
      readonly pileId: PileId;
    }
  /** The last card of the group is on its pile. */
  | {
      readonly type: 'groupComplete';
      readonly pileId: PileId;
    }
  /** The last card of the level is on its pile. The sticker book page comes next. */
  | {
      readonly type: 'levelComplete';
    }
  /** The Child gets a new sticker for the finished level. `stickerId` is the picture id of the pal. */
  | {
      readonly type: 'stickerAwarded';
      readonly stickerId: PictureId;
      readonly gold: boolean;
    }
  /** The new sticker is at this place of the page: the Child put it there, or `go` put it there by itself. */
  | {
      readonly type: 'stickerPlaced';
      readonly at: Position;
    }
  /** The Child has all stickers of the book. */
  | {
      readonly type: 'bookComplete';
    };

export type Outcome = {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
};
