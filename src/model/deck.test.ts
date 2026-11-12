import { describe, expect, it } from 'vitest';
import { apply, dropCard, openCards, placeAnchor, start, tapDeck } from './index';
import { playOut } from './test-player';
import type { Card, GameState, Stack, TableCard } from './index';

// The columns, the face-down cards, and the deck (spec, Module 2, and the original-look spec, "Difficulty table"
// and "Generator"). The tests use the public interface only.

const SEEDS = Array.from({ length: 25 }, (_, i) => 104_729 * i + 3);
const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);

const states = SEEDS.flatMap((seed) => LEVELS.map((level) => start({ level }, seed)));

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

/** All category cards of the level start loose. */
const ALL = 'all';

/** A row of the difficulty table of the original-look spec. It applies from its `from` level to the next row. */
type Row = {
  readonly from: number;
  readonly groups: readonly [number, number];
  readonly cards: number;
  readonly columns: number;
  readonly deck: number;
  readonly loose: number | typeof ALL;
};

const ROWS: readonly Row[] = [
  { from: 1, groups: [2, 2], cards: 3, columns: 3, deck: 0, loose: 0 },
  { from: 3, groups: [2, 2], cards: 4, columns: 4, deck: 0, loose: 0 },
  { from: 5, groups: [3, 3], cards: 3, columns: 3, deck: 0, loose: 0 },
  { from: 7, groups: [3, 3], cards: 4, columns: 4, deck: 0, loose: 0 },
  { from: 9, groups: [4, 4], cards: 3, columns: 4, deck: 0, loose: 0 },
  { from: 11, groups: [2, 4], cards: 4, columns: 4, deck: 4, loose: 0 },
  { from: 13, groups: [2, 4], cards: 4, columns: 4, deck: 4, loose: 1 },
  { from: 16, groups: [2, 4], cards: 5, columns: 4, deck: 6, loose: ALL },
];

const rowOf = (level: number): Row => {
  const row = ROWS.findLast((item) => item.from <= level);
  if (!row) {
    throw new Error(`The table has no row for level ${String(level)}.`);
  }
  return row;
};

/** The cards for each group of the level, in the deck and on the table. No category card. */
const cardsPerGroup = (state: GameState): readonly number[] => {
  const pictures = [...tableCards(state), ...state.deck].filter((card) => !card.anchor);
  return [...new Set(pictures.map((card) => card.group))].map(
    (group) => pictures.filter((card) => card.group === group).length
  );
};

/** One check of a level against its row: the problem, or an empty string when the level matches. */
type Check = (state: GameState, row: Row) => string;

const CHECKS: readonly Check[] = [
  (state, row) => (state.table.length === row.columns ? '' : `${String(state.table.length)} columns`),
  (state) => {
    const depths = state.table.map((stack) => stack.cards.length);
    return Math.min(...depths) >= 1 && Math.max(...depths) - Math.min(...depths) <= 1 ? '' : `depths ${depths.join()}`;
  },
  (state) =>
    state.table.every((stack) => stack.cards.every((card, i) => card.faceDown === i < stack.cards.length - 1))
      ? ''
      : 'a face-up card under the top card, or a face-down top card',
  (state, row) => (state.deck.length === row.deck && state.dealt === null ? '' : `deck ${String(state.deck.length)}`),
  (state, row) => {
    const loose = [...tableCards(state), ...state.deck].filter((card) => card.anchor).length;
    return loose === (row.loose === ALL ? state.piles.length : row.loose) ? '' : `${String(loose)} loose`;
  },
  (state, row) =>
    state.piles.length >= row.groups[0] && state.piles.length <= row.groups[1]
      ? ''
      : `${String(state.piles.length)} piles`,
  (state, row) => {
    const counts = cardsPerGroup(state);
    return counts.length === state.piles.length && counts.every((count) => count === row.cards)
      ? ''
      : `cards ${counts.join()}`;
  },
];

/** The ways in which the level does not match its row. An empty list means that the level matches. */
const mismatches = (state: GameState): readonly string[] =>
  CHECKS.map((check) => check(state, rowOf(state.level))).filter((problem) => problem !== '');

describe('the difficulty of the columns, the face-down cards, and the deck', () => {
  it('deals each level as its row of the difficulty table', () => {
    const wrong = states
      .map((state) => ({ state, problems: mismatches(state) }))
      .filter(({ problems }) => problems.length > 0)
      .map(({ state, problems }) => `${describeLevel(state)}: ${problems.join('; ')}`);

    expect(wrong).toEqual([]);
  });

  it('gives face-down cards from level 1', () => {
    const first = SEEDS.map((seed) => start({ level: 1 }, seed));

    expect(first.filter((state) => !tableCards(state).some((card) => card.faceDown)).map(describeLevel)).toEqual([]);
  });

  it('lets each face-up top card of levels 1 to 12 go on a pile', () => {
    const wrong = states
      .filter((state) => state.level <= 12)
      .flatMap((state) =>
        state.table
          .map((stack) => stack.cards.at(-1))
          .filter((top) => !top || !state.piles.some((pile) => pile.group === top.group))
          .map((top) => `${describeLevel(state)}: ${top?.id ?? 'an empty column'}`)
      );

    expect(wrong).toEqual([]);
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
    // A level 11 with 2 groups has 4 cards on the table, one in each column.
    const state = states.find((item) => item.level === 11 && item.piles.length === 2);
    const stack = state?.table.find((item) => item.cards.length === 1);
    if (!state || !stack) {
      throw new Error('No level has a stack with one card.');
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
