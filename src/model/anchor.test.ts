import { describe, expect, it } from 'vitest';
import { apply, dropCard, openCards, placeAnchor, start } from './index';
import { playOut } from './test-player';
import type { Card, GameState, Pile } from './index';

// The category cards that the Child places (spec, Module 2). The tests use the public interface only.

const SEEDS = Array.from({ length: 50 }, (_, i) => 6151 * i + 11);
const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);

const states = SEEDS.flatMap((seed) => LEVELS.map((level) => start({ level }, seed)));
const early = states.filter((state) => state.level <= 10);
const later = states.filter((state) => state.level > 12);

/** All cards of the level that are not on a pile: the stacks, the deck, and the dealt card. */
const looseCards = (state: GameState): readonly Card[] => [
  ...state.table.flatMap((stack) => stack.cards),
  ...state.deck,
  ...(state.dealt ? [state.dealt] : []),
];

const emptySlots = (state: GameState): readonly Pile[] => state.piles.filter((pile) => pile.group === null);

const describeLevel = (state: GameState): string => `level ${String(state.level)} seed ${String(state.seed)}`;

/** A level and a category card that the Child can pick up in it. */
type OpenAnchor = { readonly state: GameState; readonly anchor: Card };

/** The first level of the seeds where the Child can pick up a category card at the start, and `need` is true. */
const withOpenAnchor = (level: number, need: (found: OpenAnchor) => boolean = () => true): OpenAnchor => {
  const found = SEEDS.map((seed) => start({ level }, seed))
    .flatMap((state) =>
      openCards(state)
        .filter((card) => card.anchor)
        .map((anchor) => ({ state, anchor }))
    )
    .find(need);
  if (!found) {
    throw new Error(`No seed gives an open category card at level ${String(level)}.`);
  }
  return found;
};

/** True when the Child can also pick up a picture card of the group of the category card. */
const withGroupCard = ({ state, anchor }: OpenAnchor): boolean =>
  openCards(state).some((card) => !card.anchor && card.group === anchor.group);

/** True when the Child can pick up a second category card. */
const withSecondAnchor = ({ state }: OpenAnchor): boolean => openCards(state).filter((card) => card.anchor).length > 1;

/** The first empty slot of the level. */
const slotOf = (state: GameState): Pile => {
  const slot = emptySlots(state)[0];
  if (!slot) {
    throw new Error('The level has no empty slot.');
  }
  return slot;
};

describe('the slots', () => {
  it('gives the level one slot for each group', () => {
    const wrong = states.filter((state) => {
      const groups = new Set(looseCards(state).map((card) => card.group));
      const placed = state.piles.flatMap((pile) => (pile.group === null ? [] : [pile.group]));
      return state.piles.length !== groups.size || placed.some((group) => !groups.has(group));
    });

    expect(wrong.map(describeLevel)).toEqual([]);
  });

  it('gives each group one category card: on its pile, or loose with an empty slot for it', () => {
    const wrong = states.filter((state) => {
      const anchors = looseCards(state).filter((card) => card.anchor);
      const groups = state.piles.flatMap((pile) => (pile.group === null ? [] : [pile.group]));
      const all = [...groups, ...anchors.map((card) => card.group)];
      return anchors.length !== emptySlots(state).length || new Set(all).size !== state.piles.length;
    });

    expect(wrong.map(describeLevel)).toEqual([]);
  });

  it('shows all category cards on their piles at the start of levels 1 to 10', () => {
    const wrong = early.filter(
      (state) =>
        looseCards(state).some((card) => card.anchor) ||
        state.piles.some((pile) => pile.group === null || pile.picture === null)
    );

    expect(wrong.map(describeLevel)).toEqual([]);
  });

  it('mixes category cards into the table and the deck of the later levels', () => {
    const wrong = later.filter((state) => !looseCards(state).some((card) => card.anchor));

    expect(wrong.map(describeLevel)).toEqual([]);
  });

  it('never puts a category card face-down', () => {
    const wrong = states.filter((state) =>
      state.table.some((stack) => stack.cards.some((card) => card.anchor && card.faceDown))
    );

    expect(wrong.map(describeLevel)).toEqual([]);
  });
});

describe('placeAnchor', () => {
  it('puts a category card on an empty slot, and the slot then shows its group', () => {
    const { state, anchor } = withOpenAnchor(16);
    const slot = slotOf(state);

    const result = apply(state, placeAnchor(anchor.id, slot.id));

    expect(result.events).toEqual([{ type: 'anchorPlaced', cardId: anchor.id, pileId: slot.id }]);
    expect(result.state.piles.find((pile) => pile.id === slot.id)).toEqual({
      id: slot.id,
      group: anchor.group,
      picture: anchor.picture,
      cards: [],
    });
    expect(looseCards(result.state).some((card) => card.id === anchor.id)).toBe(false);
  });

  it('rejects a card that is not a category card', () => {
    const { state } = withOpenAnchor(16);
    const card = openCards(state).find((item) => !item.anchor);
    if (!card) {
      throw new Error('The level has no open picture card.');
    }

    const result = apply(state, placeAnchor(card.id, slotOf(state).id));

    expect(result.events).toEqual([{ type: 'rejected', cardId: card.id }]);
    expect(result.state).toBe(state);
  });

  it('rejects a slot that has a category card already', () => {
    const { state, anchor } = withOpenAnchor(16, withSecondAnchor);
    const slot = slotOf(state);
    const placed = apply(state, placeAnchor(anchor.id, slot.id)).state;
    const second = openCards(placed).find((card) => card.anchor);
    if (!second) {
      throw new Error('The level has no second open category card.');
    }

    const result = apply(placed, placeAnchor(second.id, slot.id));

    expect(result.events).toEqual([{ type: 'rejected', cardId: second.id }]);
    expect(result.state).toBe(placed);
  });

  it('rejects a category card with a card on top of it, or one that is not in the level', () => {
    const { state, anchor } = withOpenAnchor(16);
    const slot = slotOf(state);
    const placed = apply(state, placeAnchor(anchor.id, slot.id)).state;

    const result = apply(placed, placeAnchor(anchor.id, slotOf(placed).id));

    expect(result.events).toEqual([{ type: 'rejected', cardId: anchor.id }]);
    expect(result.state).toBe(placed);
  });
});

describe('dropCard with slots', () => {
  it('rejects a card of a group that has no category card on a slot yet', () => {
    // From level 16, all category cards start loose, so no slot has a group yet.
    const { state } = withOpenAnchor(16);
    const card = openCards(state).find((item) => !item.anchor);
    if (!card) {
      throw new Error('The level has no open picture card.');
    }

    const outcomes = state.piles.map((pile) => apply(state, dropCard(card.id, pile.id)));

    expect(state.piles.every((pile) => pile.group === null)).toBe(true);
    expect(outcomes.map((outcome) => outcome.events)).toEqual(
      state.piles.map(() => [{ type: 'rejected', cardId: card.id }])
    );
    expect(outcomes.every((outcome) => outcome.state === state)).toBe(true);
  });

  it('snaps the card of the group after its category card is on a slot', () => {
    const { state, anchor } = withOpenAnchor(16, withGroupCard);
    const slot = slotOf(state);
    const card = openCards(state).find((item) => !item.anchor && item.group === anchor.group);
    if (!card) {
      throw new Error('The level has no open card of the group of the category card.');
    }

    const before = apply(state, dropCard(card.id, slot.id));
    const placed = apply(state, placeAnchor(anchor.id, slot.id)).state;
    const after = apply(placed, dropCard(card.id, slot.id));

    expect(before.events).toEqual([{ type: 'rejected', cardId: card.id }]);
    expect(before.state).toBe(state);
    expect(after.events[0]).toEqual({ type: 'snapped', cardId: card.id, pileId: slot.id, noteIndex: 0 });
  });
});

describe('the dead-end check with category cards', () => {
  it('deals only levels that the Child can finish, with each category card on a slot at the end', () => {
    const wrong = later.filter((state) => {
      const { events, end } = playOut(state);
      return (
        looseCards(end).length > 0 ||
        end.piles.some((pile) => pile.group === null) ||
        events.filter((event) => event.type === 'anchorPlaced').length !== emptySlots(state).length ||
        events.at(-2)?.type !== 'levelComplete'
      );
    });

    expect(wrong.map(describeLevel)).toEqual([]);
  });
});
