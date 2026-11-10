import type {
  Card,
  CardId,
  GameEvent,
  GameState,
  GroupId,
  LevelAction,
  Outcome,
  PileId,
  Stack,
  TableCard,
} from './types';

/** The Child drops the card on the pile. */
export const dropCard = (cardId: CardId, pileId: PileId): LevelAction => ({ type: 'dropCard', cardId, pileId });

/** The Child taps the deck for the next card. */
export const tapDeck = (): LevelAction => ({ type: 'tapDeck' });

/** The Child puts the category card on the empty slot. */
export const placeAnchor = (cardId: CardId, slotId: PileId): LevelAction => ({ type: 'placeAnchor', cardId, slotId });

/**
 * The cards that are not on a pile yet: the cards of the stacks, the deck, and the dealt card.
 * It includes the category cards that are not on a slot yet.
 */
export const cardsLeft = (state: GameState): readonly Card[] => [
  ...state.table.flatMap((stack) => stack.cards),
  ...state.deck,
  ...(state.dealt ? [state.dealt] : []),
];

/** The events after a snap: `groupComplete` when no card of the group is left, `levelComplete` when no card is left. */
const completions = (state: GameState, group: GroupId, pileId: PileId): readonly GameEvent[] => {
  const left = cardsLeft(state);
  if (left.some((card) => card.group === group)) {
    return [];
  }
  const groupComplete: GameEvent = { type: 'groupComplete', pileId };
  return left.length > 0 ? [groupComplete] : [groupComplete, { type: 'levelComplete' }];
};

/** A card that the Child can pick up, and the stack that holds it. The dealt card has no stack. */
type Found = { readonly card: Card; readonly stack: Stack | undefined };

/** Finds the card by its id, only when it is on top of its stack or it is the dealt card. */
const found = (state: GameState, cardId: CardId): Found | undefined => {
  const stack = state.table.find((item) => item.cards.at(-1)?.id === cardId);
  const top = stack?.cards.at(-1);
  if (stack && top) {
    return { card: top, stack };
  }
  return state.dealt?.id === cardId ? { card: state.dealt, stack: undefined } : undefined;
};

/** The state after the card left the table, and the id of the card that this move turns over. */
const take = (state: GameState, taken: Found): { readonly state: GameState; readonly flipped: CardId | undefined } => {
  if (!taken.stack) {
    return { state: { ...state, dealt: null }, flipped: undefined };
  }
  const cards = taken.stack.cards.slice(0, -1);
  const below = cards.at(-1);
  const turned: TableCard | undefined = below?.faceDown ? { ...below, faceDown: false } : undefined;
  const turnedCards = turned ? [...cards.slice(0, -1), turned] : cards;
  return {
    state: {
      ...state,
      table: state.table.map((stack) => (stack === taken.stack ? { ...stack, cards: turnedCards } : stack)),
    },
    flipped: turned?.id,
  };
};

/**
 * Drops the card on the pile. A card goes only on the pile of its group, and only from the top of its stack.
 * An empty slot has no group, so it accepts no card.
 */
const drop = (state: GameState, cardId: CardId, pileId: PileId): Outcome => {
  const taken = found(state, cardId);
  const target = state.piles.find((pile) => pile.id === pileId);
  if (!taken || target?.group !== taken.card.group) {
    return { state, events: [{ type: 'rejected', cardId }] };
  }
  const moved = take(state, taken);
  const card: Card = { id: taken.card.id, group: taken.card.group, picture: taken.card.picture, anchor: false };
  const next: GameState = {
    ...moved.state,
    piles: moved.state.piles.map((pile) => (pile === target ? { ...pile, cards: [...pile.cards, card] } : pile)),
  };
  const flip: readonly GameEvent[] = moved.flipped ? [{ type: 'flipped', cardId: moved.flipped }] : [];
  return {
    state: next,
    events: [
      { type: 'snapped', cardId, pileId, noteIndex: target.cards.length },
      ...flip,
      ...completions(next, card.group, pileId),
    ],
  };
};

/**
 * Puts the category card on the empty slot. The slot then shows the picture of the card and accepts the cards of its
 * group. Any empty slot accepts any category card, so a category card always has a free slot.
 */
const place = (state: GameState, cardId: CardId, slotId: PileId): Outcome => {
  const taken = found(state, cardId);
  const slot = state.piles.find((pile) => pile.id === slotId);
  if (!taken?.card.anchor || slot?.group !== null) {
    return { state, events: [{ type: 'rejected', cardId }] };
  }
  const moved = take(state, taken);
  const { group, picture } = taken.card;
  const flip: readonly GameEvent[] = moved.flipped ? [{ type: 'flipped', cardId: moved.flipped }] : [];
  return {
    state: {
      ...moved.state,
      piles: moved.state.piles.map((pile) =>
        pile === slot ? { id: slot.id, group, picture, cards: slot.cards } : pile
      ),
    },
    events: [{ type: 'anchorPlaced', cardId, pileId: slotId }, ...flip],
  };
};

/**
 * Gives the next card of the deck. The face-up card of the last tap goes back to the bottom of the deck, so the
 * deck starts again after its last card and it never runs out. A tap on an empty deck changes nothing.
 */
const tap = (state: GameState): Outcome => {
  const top = state.deck.at(-1);
  if (!top) {
    return { state, events: [] };
  }
  const deck = state.dealt ? [state.dealt, ...state.deck.slice(0, -1)] : state.deck.slice(0, -1);
  return { state: { ...state, deck, dealt: top }, events: [{ type: 'dealt' }] };
};

/** Plays one move of the level. A rejected move returns the same state object. `apply` (game.ts) adds the sticker. */
export const playMove = (state: GameState, action: LevelAction): Outcome => {
  switch (action.type) {
    case 'dropCard':
      return drop(state, action.cardId, action.pileId);
    case 'tapDeck':
      return tap(state);
    case 'placeAnchor':
      return place(state, action.cardId, action.slotId);
    default: {
      // A new member of the `Action` union must get its case above. This line keeps the switch complete.
      const unhandled: never = action;
      return unhandled;
    }
  }
};
