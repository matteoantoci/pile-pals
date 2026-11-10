import { describe, expect, it } from 'vitest';
import { apply, dropCard, openCards, placeAnchor, start, tapDeck } from './index';
import { playOut } from './test-player';
import type { Card, GameState, Stack, TableCard } from './index';

// The face-down cards, the stacks, and the deck (spec, Module 2). The tests use the public interface only.

const SEEDS = Array.from({ length: 25 }, (_, i) => 104_729 * i + 3);
const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);

const states = SEEDS.flatMap((seed) => LEVELS.map((level) => start({ level }, seed)));
const early = states.filter((state) => state.level <= 10);
const later = states.filter((state) => state.level > 10);

const tableCards = (state: GameState): readonly TableCard[] => state.table.flatMap((stack) => stack.cards);

const pileOf = (state: GameState, card: Card): string => {
  const pile = state.piles.find((p) => p.group === card.group);
  if (!pile) {
    throw new Error(`The level has no pile for the group "${card.group}".`);
  }
  return pile.id;
};

/** The first stack that has a face-down card under its top card. */
const buriedStack = (state: GameState): Stack => {
  const stack = state.table.find((item) => item.cards.length > 1 && item.cards.some((card) => card.faceDown));
  if (!stack) {
    throw new Error('The level has no face-down card.');
  }
  return stack;
};

const topOf = (stack: Stack): TableCard => {
  const top = stack.cards.at(-1);
  if (!top) {
    throw new Error('The stack has no card.');
  }
  return top;
};

const describeLevel = (state: GameState): string =>
  `level ${String(state.level)} seed ${String(state.seed)}: ${state.piles.map((p) => p.group).join(', ')}`;

describe('the difficulty of the face-down cards and the deck', () => {
  it('gives no face-down card and no deck to levels 1 to 10', () => {
    const wrong = early.filter(
      (state) => tableCards(state).some((card) => card.faceDown) || state.deck.length > 0 || state.dealt !== null
    );

    expect(wrong.map(describeLevel)).toEqual([]);
  });

  it('gives face-down cards and a deck to the later levels', () => {
    const wrong = later.filter((state) => !tableCards(state).some((card) => card.faceDown) || state.deck.length === 0);

    expect(wrong.map(describeLevel)).toEqual([]);
  });

  it('keeps only a face-down card below the top card of a stack', () => {
    const wrong = states.filter((state) =>
      state.table.some((stack) => stack.cards.slice(0, -1).some((card) => !card.faceDown))
    );

    expect(wrong.map(describeLevel)).toEqual([]);
  });
});

describe('the flip', () => {
  it('turns over the card below the card that moves away', () => {
    const state = start({ level: 11 }, 5);
    const stack = buriedStack(state);
    const top = topOf(stack);
    const below = stack.cards.at(-2);
    if (!below) {
      throw new Error('The stack has no card below its top card.');
    }

    const result = apply(state, dropCard(top.id, pileOf(state, top)));

    expect(result.events.filter((event) => event.type === 'flipped')).toEqual([{ type: 'flipped', cardId: below.id }]);
    expect(result.state.table.find((item) => item.id === stack.id)?.cards.at(-1)).toEqual({
      ...below,
      faceDown: false,
    });
  });

  it('gives the turned card to the Child, and only then', () => {
    const state = start({ level: 11 }, 5);
    const stack = buriedStack(state);
    const top = topOf(stack);
    const below = stack.cards.at(-2);
    if (!below) {
      throw new Error('The stack has no card below its top card.');
    }

    const after = apply(state, dropCard(top.id, pileOf(state, top))).state;
    const result = apply(after, dropCard(below.id, pileOf(after, below)));

    expect(result.events[0]).toMatchObject({ type: 'snapped', cardId: below.id });
  });

  it('turns no card over when the stack has one card only', () => {
    const state = start({ level: 11 }, 5);
    const stack = state.table.find((item) => item.cards.length === 1);
    if (!stack) {
      throw new Error('The level has no stack with one card.');
    }
    const top = topOf(stack);

    const result = apply(state, dropCard(top.id, pileOf(state, top)));

    expect(result.events.some((event) => event.type === 'flipped')).toBe(false);
    expect(result.state.table.find((item) => item.id === stack.id)?.cards).toEqual([]);
  });
});

describe('the deck', () => {
  it('gives a card of the deck with each tap, until the deck starts again', () => {
    const state = start({ level: 11 }, 5);
    const first = state.deck.at(-1);
    if (!first) {
      throw new Error('The level has no deck.');
    }

    const once = apply(state, tapDeck());

    expect(once.events).toEqual([{ type: 'dealt' }]);
    expect(once.state.dealt).toEqual(first);
    expect(once.state.deck).toHaveLength(state.deck.length - 1);
  });
});

/** True when a drop or a category card move on some pile takes the card from the table. */
const movable = (state: GameState, card: Card): boolean =>
  state.piles.some(
    (pile) =>
      apply(state, dropCard(card.id, pile.id)).state !== state ||
      apply(state, placeAnchor(card.id, pile.id)).state !== state
  );

describe('openCards', () => {
  it('gives the dealt card and the top card of each stack, and never a face-down card', () => {
    const state = apply(start({ level: 11 }, 5), tapDeck()).state;
    const stacks = state.table.filter((stack) => stack.cards.length > 0);
    const open = openCards(state);

    expect(open).toContainEqual(state.dealt);
    expect(open).toHaveLength(stacks.length + 1);
    expect(open.filter((card) => tableCards(state).some((own) => own.id === card.id && own.faceDown))).toEqual([]);
  });

  it('holds each card that a drop or a category card move takes from the table', () => {
    const missing = states.flatMap((state) =>
      [...tableCards(state), ...state.deck]
        .filter((card) => movable(state, card) && !openCards(state).some((own) => own.id === card.id))
        .map((card) => `${describeLevel(state)}: ${card.id}`)
    );

    expect(missing).toEqual([]);
  });
});

describe('the dead-end check', () => {
  it('deals only a level that the Child can finish, over many seeds and level numbers', () => {
    const wrong = states.filter((state) => {
      const { events, end } = playOut(state);
      return (
        end.table.some((stack) => stack.cards.length > 0) ||
        end.deck.length > 0 ||
        end.dealt !== null ||
        events.at(-2)?.type !== 'levelComplete'
      );
    });

    expect(wrong.map(describeLevel)).toEqual([]);
  });
});
