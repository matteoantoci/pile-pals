import { describe, expect, it } from 'vitest';
import { catalog, pictureOf, start } from './index';
import type { CatalogCard, CatalogGroup, GameState, GroupId, PictureId, TableCard } from './index';

// The level generator, tested over many seeds and level numbers with the real catalog.
// The rules come from the spec (Module 2) and from research/native-feel/content-model.md §5.

const SEEDS = Array.from({ length: 100 }, (_, i) => 7919 * i + 1);
const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);
const FIRST_TEN = LEVELS.slice(0, 10);

const levels: readonly GameState[] = SEEDS.flatMap((seed) => LEVELS.map((level) => start({ level }, seed)));
/** Levels 1 to 10 show all category cards on their piles at the start (spec, Module 2). */
const earlyLevels = levels.filter((state) => state.level <= 10);
const laterLevels = levels.filter((state) => state.level > 10);

const groupOf = (id: GroupId): CatalogGroup => {
  const group = catalog.groups.find((g) => g.id === id);
  if (!group) {
    throw new Error(`The catalog has no group "${id}".`);
  }
  return group;
};

const cardOf = (picture: PictureId): CatalogCard | undefined => catalog.cards.find((c) => c.id === picture);

/** The groups where a child could put the picture: member groups and maybe groups. */
const fits = (picture: PictureId): readonly GroupId[] => {
  const card = cardOf(picture);
  return card ? [...card.groups, ...card.maybe] : [];
};

/** The cards of the stacks of the level, in the order of the stacks. */
const tableCards = (state: GameState): readonly TableCard[] => state.table.flatMap((stack) => stack.cards);

/** A picture that the level shows, and the group that it shows. */
type Shown = { readonly picture: PictureId; readonly group: GroupId };

/** The picture cards of the level that the Child can see now or after a tap of the deck. No category card. */
const levelCards = (state: GameState): readonly Shown[] =>
  [...tableCards(state), ...state.deck].filter((card) => !card.anchor);

/** The category card of each group: on its pile, or on the table or in the deck when the Child places it. */
const categoryCards = (state: GameState): readonly Shown[] => [
  ...state.piles.flatMap(({ group, picture }) => (group === null || picture === null ? [] : [{ group, picture }])),
  ...[...tableCards(state), ...state.deck].filter((card) => card.anchor),
];

/** The groups of the level, one for each category card. */
const groupsOf = (state: GameState): readonly GroupId[] => categoryCards(state).map((card) => card.group);

/** Each card and each category card of the level. */
const shown = (state: GameState): readonly Shown[] => [...levelCards(state), ...categoryCards(state)];

const cardsPerGroup = (state: GameState): readonly number[] =>
  groupsOf(state).map((group) => levelCards(state).filter((card) => card.group === group).length);

const describeLevel = (state: GameState): string =>
  `level ${String(state.level)} seed ${String(state.seed)}: ${groupsOf(state).join(', ')}`;

const typesOf = (states: readonly GameState[]): ReadonlySet<string> =>
  new Set(states.flatMap((state) => groupsOf(state).map((group) => groupOf(group).type)));

describe('the fairness rule, over many seeds and level numbers', () => {
  it('shows groups of one association type in each level', () => {
    const mixed = levels.filter((state) => new Set(groupsOf(state).map((group) => groupOf(group).type)).size !== 1);

    expect(mixed.map(describeLevel)).toEqual([]);
  });

  it('deals each picture card only to a group where the card is a member', () => {
    const wrong = levels.flatMap((state) =>
      levelCards(state)
        .filter((card) => !cardOf(card.picture)?.groups.includes(card.group))
        .map((card) => card.picture)
    );

    expect(wrong).toEqual([]);
  });

  it('deals the deck from the cards of the level, each card one time', () => {
    const wrong = levels
      .filter((state) => {
        const ids = [...tableCards(state), ...state.deck].map((card) => card.id);
        return new Set(ids).size !== ids.length;
      })
      .map(describeLevel);

    expect(wrong).toEqual([]);
  });

  it('shows no card and no category card that fits a second shown group', () => {
    const unfair = levels.flatMap((state) =>
      shown(state)
        .filter((item) => groupsOf(state).some((group) => group !== item.group && fits(item.picture).includes(group)))
        .map((item) => `${describeLevel(state)}: ${item.picture}`)
    );

    expect(unfair).toEqual([]);
  });

  it('never shows two confusable groups together', () => {
    const confused = levels.filter((state) =>
      groupsOf(state).some((group) => groupsOf(state).some((other) => groupOf(group).confusable.includes(other)))
    );

    expect(confused.map(describeLevel)).toEqual([]);
  });

  it('shows at most one picture of each thing', () => {
    const twice = levels.filter((state) => {
      // A picture that is not a card (a heart) is its own thing.
      const things = shown(state).map((item) => cardOf(item.picture)?.thing ?? item.picture);
      return new Set(things).size !== things.length;
    });

    expect(twice.map(describeLevel)).toEqual([]);
  });

  it('gives each group of a level the same number of cards, from 3 to 5', () => {
    const uneven = levels.filter((state) => {
      const counts = new Set(cardsPerGroup(state));
      return counts.size !== 1 || [...counts].some((n) => n < 3 || n > 5);
    });

    expect(uneven.map(describeLevel)).toEqual([]);
  });

  it('shows a catalog still picture on each card and each pile', () => {
    const stills = levels.flatMap((state) => shown(state).map((item) => pictureOf(item.picture).still));

    expect(stills.filter((still) => !/^pictures\/[a-z0-9-]+\.webp$/u.test(still))).toEqual([]);
  });
});

describe('the difficulty', () => {
  it('gives level 1 two piles with 3 cards each', () => {
    const first = SEEDS.map((seed) => start({ level: 1 }, seed));

    expect(new Set(first.map((state) => state.piles.length))).toEqual(new Set([2]));
    expect(new Set(first.flatMap(cardsPerGroup))).toEqual(new Set([3]));
  });

  it('shows 2 to 4 piles, in levels 1 to 10 and after level 10', () => {
    expect(new Set(earlyLevels.map((state) => state.piles.length))).toEqual(new Set([2, 3, 4]));
    expect(new Set(laterLevels.map((state) => state.piles.length))).toEqual(new Set([2, 3, 4]));
  });

  it('never makes level 1 to 10 easier than the level before', () => {
    const easier = SEEDS.filter((seed) => {
      const sizes = FIRST_TEN.map((level) => start({ level }, seed)).map((s) => [s.piles.length, tableCards(s).length]);
      return sizes.some(([piles = 0, cards = 0], i) => {
        const [lastPiles = 0, lastCards = 0] = sizes[i - 1] ?? [];
        return piles < lastPiles || (piles === lastPiles && cards < lastCards);
      });
    });

    expect(easier).toEqual([]);
  });

  it('gives level 10 more piles and more cards than level 1', () => {
    const first = start({ level: 1 }, 1);
    const tenth = start({ level: 10 }, 1);

    expect(tenth.piles.length).toBeGreaterThan(first.piles.length);
    expect(tableCards(tenth).length).toBeGreaterThan(tableCards(first).length);
  });

  it('gives later levels up to 5 cards for each group', () => {
    expect(Math.max(...levels.flatMap(cardsPerGroup))).toBe(5);
  });

  it('starts each pile and each slot with no card on it', () => {
    const notEmpty = levels.filter((state) => state.piles.some((pile) => pile.cards.length > 0));

    expect(notEmpty.map(describeLevel)).toEqual([]);
  });
});

describe('the seed', () => {
  it('gives the same level for the same progress and seed', () => {
    expect(start({ level: 4 }, 42)).toEqual(start({ level: 4 }, 42));
  });

  it('gives different groups for different seeds', () => {
    const sets = new Set(
      SEEDS.map((seed) =>
        groupsOf(start({ level: 1 }, seed))
          .toSorted()
          .join()
      )
    );

    expect(sets.size).toBeGreaterThan(SEEDS.length / 2);
  });

  it('shows each association type of the catalog, in levels 1 to 10 and after level 10', () => {
    const all = new Set(catalog.groups.map((g) => g.type));

    expect(typesOf(earlyLevels)).toEqual(all);
    expect(typesOf(laterLevels)).toEqual(all);
  });

  it('keeps the deal as plain data that survives a JSON copy', () => {
    const state = start({ level: 7 }, 3);

    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
