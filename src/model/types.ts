// The data of the game model. All data is read-only: `apply` returns a new state.

export type CardId = string;
export type PileId = string;
export type GroupId = string;

/** A picture card. `group` is the one pile of the level that accepts the card. */
export type Card = {
  readonly id: CardId;
  readonly group: GroupId;
  readonly picture: string;
};

/** A category pile. `cards` holds the cards on the pile, the first card at the bottom. */
export type Pile = {
  readonly id: PileId;
  readonly group: GroupId;
  readonly picture: string;
  readonly cards: readonly Card[];
};

/** What the Child finished so far. `start` deals the level for this progress. */
export type Progress = {
  readonly level: number;
};

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
    };

export type Outcome = {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
};
