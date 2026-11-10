// The data of the game model. All data is read-only: `apply` returns a new state.

export type CardId = string;
export type PileId = string;
export type GroupId = string;
/** The id of a picture in the content catalog. `pictureOf(id)` gives the files. */
export type PictureId = string;

/** A picture card. `group` is the one pile of the level that accepts the card. */
export type Card = {
  readonly id: CardId;
  readonly group: GroupId;
  readonly picture: PictureId;
};

/** A category pile. `cards` holds the cards on the pile, the first card at the bottom. */
export type Pile = {
  readonly id: PileId;
  readonly group: GroupId;
  readonly picture: PictureId;
  readonly cards: readonly Card[];
};

/** What the Child finished so far. `start` deals the level for this progress. */
export type Progress = {
  readonly level: number;
};

/**
 * The level that the Child plays. It is plain data (no Map, no class, no function), so a save can keep it whole.
 * `seed` is the seed of the game: the same seed and level number always give the same deal.
 */
export type GameState = {
  readonly level: number;
  readonly seed: number;
  readonly table: readonly Card[];
  readonly piles: readonly Pile[];
};

/** Each action is one input from the Child. Add new actions to this union. */
export type Action = {
  readonly type: 'dropCard';
  readonly cardId: CardId;
  readonly pileId: PileId;
};

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
  /** The last card of the group is on its pile. */
  | {
      readonly type: 'groupComplete';
      readonly pileId: PileId;
    }
  /** The last card of the level is on its pile. `nextLevel` then deals the next level. */
  | {
      readonly type: 'levelComplete';
    };

export type Outcome = {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
};
