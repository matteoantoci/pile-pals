// Spec, Testing Decisions 5: the sticker rules over a full run of 2P + 10 levels, with P read from the catalog.

import { describe, expect, it } from 'vitest';
import { apply, catalog, go, PAGE_SIZE, placeSticker, start } from './index';
import { playOut } from './test-player';
import type { Book, GameState, Sticker } from './index';

const P = catalog.pals;

/** What one level gave, and what the Child had before it. */
type Level = {
  readonly level: number;
  readonly sticker: Sticker | undefined;
  readonly bookComplete: boolean;
  /** The pals of which the Child had the normal sticker before this level. */
  readonly normals: ReadonlySet<string>;
  /** The pals of the groups of this level that the Child did not have as a normal sticker. */
  readonly newOfLevel: ReadonlySet<string>;
};

type Run = { readonly levels: readonly Level[]; readonly book: Book };

const pals = catalog.cards.filter((card) => card.animation !== null);

/** Plays one level to its end. The Child drags the sticker on odd levels and taps the green arrow on all levels. */
const playLevel = (state: GameState): { readonly level: Level; readonly next: GameState } => {
  const { events, end } = playOut(state);
  const normals = new Set(
    state.book.pages
      .flat()
      .filter((sticker) => !sticker.gold)
      .map((sticker) => sticker.pal)
  );
  const groups = new Set(state.piles.map((pile) => pile.group));
  const newOfLevel = new Set(
    pals.filter((pal) => !normals.has(pal.id) && pal.groups.some((group) => groups.has(group))).map((pal) => pal.id)
  );
  const award = events.find((event) => event.type === 'stickerAwarded');
  const sticker = award?.type === 'stickerAwarded' ? { pal: award.stickerId, gold: award.gold } : undefined;
  const dragged =
    state.level % 2 === 1
      ? apply(end, placeSticker({ x: (state.level % 7) / 7, y: (state.level % 5) / 5 })).state
      : end;
  return {
    level: {
      level: state.level,
      sticker,
      bookComplete: events.some((event) => event.type === 'bookComplete'),
      normals,
      newOfLevel,
    },
    next: apply(dragged, go()).state,
  };
};

const fullRun = (): Run => {
  const levels: Level[] = [];
  let state = start({ level: 1 }, 2026);
  while (state.level <= 2 * P + 10) {
    const played = playLevel(state);
    levels.push(played.level);
    state = played.next;
  }
  return { levels, book: state.book };
};

/** The smallest level L with L − ⌊L/20⌋ = P: the level of the last normal sticker. */
const lastNormalLevel = (): number => {
  let level = P;
  while (level - Math.floor(level / 20) < P) {
    level += 1;
  }
  return level;
};

describe(`the sticker rules over 2P + 10 levels (P = ${String(P)})`, () => {
  const { levels, book } = fullRun();
  const awarded = levels.filter((level) => level.sticker !== undefined);
  const L = lastNormalLevel();

  it('reads P from the catalog: the number of cards with an animated twin', () => {
    expect(P).toBe(pals.length);
    expect(P).toBeGreaterThan(0);
  });

  it('gives one sticker on each level up to level 2P, and never a duplicate', () => {
    const keys = awarded.map(({ sticker }) => `${sticker?.pal ?? ''} ${String(sticker?.gold)}`);

    expect(awarded.map(({ level }) => level)).toEqual(Array.from({ length: 2 * P }, (_, index) => index + 1));
    expect(new Set(keys).size).toBe(2 * P);
  });

  it('gives a gold sticker on every 20th level', () => {
    const twentieth = levels.filter(({ level }) => level % 20 === 0 && level <= 2 * P);

    expect(twentieth.length).toBe(Math.floor((2 * P) / 20));
    expect(twentieth.every(({ sticker }) => sticker?.gold === true)).toBe(true);
  });

  it('gives N − ⌊N/20⌋ normal stickers after level N, and the last normal sticker at level L', () => {
    const counts = levels
      .filter(({ level }) => level < L)
      .map(({ level }) => awarded.filter((item) => item.level <= level && item.sticker?.gold === false).length);

    expect(counts).toEqual(levels.filter(({ level }) => level < L).map(({ level }) => level - Math.floor(level / 20)));
    expect(awarded.findLast(({ sticker }) => sticker?.gold === false)?.level).toBe(L);
  });

  it('gives a gold sticker on every level after L', () => {
    const afterL = awarded.filter(({ level }) => level > L);

    expect(afterL.length).toBe(2 * P - L);
    expect(afterL.every(({ sticker }) => sticker?.gold === true)).toBe(true);
  });

  it('makes each gold sticker from a pal that the Child already has', () => {
    const gold = awarded.filter(({ sticker }) => sticker?.gold === true);

    expect(gold.filter(({ sticker, normals }) => !normals.has(sticker?.pal ?? ''))).toEqual([]);
  });

  it('gives a normal sticker of a group of the level while the Child does not have one', () => {
    const normal = awarded.filter(({ sticker }) => sticker?.gold === false);
    const wrong = normal.filter(
      ({ sticker, newOfLevel }) => newOfLevel.size > 0 && !newOfLevel.has(sticker?.pal ?? '')
    );

    expect(wrong.map(({ level }) => level)).toEqual([]);
  });

  it('gives the last sticker and bookComplete at level 2P, and no sticker after it', () => {
    expect(levels.filter((level) => level.bookComplete).map(({ level }) => level)).toEqual([2 * P]);
    expect(levels.filter(({ level, sticker }) => level > 2 * P && sticker !== undefined)).toEqual([]);
    expect(levels.filter(({ level }) => level > 2 * P)).toHaveLength(10);
  });

  it('fills each page with 12 stickers before it opens a new page', () => {
    const sizes = book.pages.map((page) => page.length);

    expect(sizes.reduce((sum, size) => sum + size, 0)).toBe(2 * P);
    expect(sizes.length).toBe(Math.ceil((2 * P) / PAGE_SIZE));
    expect(sizes.slice(0, -1).every((size) => size === PAGE_SIZE)).toBe(true);
    expect(book.award).toBeNull();
  });
});
