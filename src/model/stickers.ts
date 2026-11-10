// The sticker rules (spec, Module 3). The Child gets one sticker after each level: a pal with a Noto animation.
// Each pal has a normal and a gold sticker, so the book holds 2P stickers (P: the pals of the catalog).

import { catalog } from './catalog';
import { mixSeed, randomFrom } from './random';
import type { Book, GameEvent, GameState, Outcome, PictureId, PlacedSticker, Position, Sticker } from './types';

/** A page holds this number of stickers. The next sticker then opens a new page. */
export const PAGE_SIZE = 12;

/** Every 20th level gives a gold sticker. */
const GOLD_EVERY = 20;

/** Mixed into the seed, so the sticker choice does not repeat the random values of the deal. */
const STICKER_SALT = 0x5_71_c4;

/** The book of a new game: one empty page and no sticker that waits. */
export const EMPTY_BOOK: Book = { pages: [[]], award: null };

/** The pals: the cards with an animated twin. Only a pal can be a sticker. */
const PALS = catalog.cards.filter((card) => card.animation !== null);

/** The auto places on a page: the centres of a grid of 3 columns and 4 rows, from the top left. */
const COLUMNS = 3;
const SPOTS: readonly Position[] = Array.from({ length: PAGE_SIZE }, (_, index) => ({
  x: ((index % COLUMNS) + 0.5) / COLUMNS,
  y: (Math.floor(index / COLUMNS) + 0.5) / (PAGE_SIZE / COLUMNS),
}));

/** The distance from the spot to the nearest sticker of the page. An empty page gives Infinity. */
const room = (spot: Position, page: readonly PlacedSticker[]): number =>
  Math.min(Infinity, ...page.map(({ at }) => Math.hypot(at.x - spot.x, at.y - spot.y)));

/** The grid spot that is farthest from the stickers of the page. Of equal spots, the first one. */
const freeSpot = (page: readonly PlacedSticker[]): Position =>
  SPOTS.reduce((best, spot) => (room(spot, page) > room(best, page) ? spot : best));

/**
 * Chooses the sticker of the finished level. The first choice is a pal of a group of the level, the second
 * choice is any pal. A gold sticker comes on every 20th level, and on each level when the Child has all normal
 * stickers. Gives undefined when the Child has all 2P stickers.
 */
const choose = (state: GameState): Sticker | undefined => {
  const have = state.book.pages.flat();
  const normal = new Set(have.filter((sticker) => !sticker.gold).map((sticker) => sticker.pal));
  const gold = new Set(have.filter((sticker) => sticker.gold).map((sticker) => sticker.pal));
  const groups = new Set(state.piles.map((pile) => pile.group));
  const random = randomFrom(mixSeed(state.seed, state.level, STICKER_SALT));
  const pick = (pals: typeof PALS): PictureId | undefined => {
    const ofLevel = pals.filter((pal) => pal.groups.some((group) => groups.has(group)));
    return random.pick(ofLevel.length > 0 ? ofLevel : pals)?.id;
  };
  const newNormal = pick(PALS.filter((pal) => !normal.has(pal.id)));
  const newGold = pick(PALS.filter((pal) => normal.has(pal.id) && !gold.has(pal.id)));
  const goldFirst = state.level % GOLD_EVERY === 0 || newNormal === undefined;
  if (goldFirst && newGold !== undefined) {
    return { pal: newGold, gold: true };
  }
  return newNormal === undefined ? undefined : { pal: newNormal, gold: false };
};

/**
 * Adds the sticker award to the outcome of a move that finished the level. The new sticker waits for the
 * Child on the current page; a full page opens a new page first.
 */
export const rewarded = (outcome: Outcome): Outcome => {
  const { state, events } = outcome;
  const sticker = events.some((event) => event.type === 'levelComplete') ? choose(state) : undefined;
  if (!sticker) {
    return outcome;
  }
  const page = state.book.pages.at(-1) ?? [];
  const pages = page.length >= PAGE_SIZE ? [...state.book.pages, []] : state.book.pages;
  const complete = state.book.pages.flat().length + 1 === 2 * PALS.length;
  const done: readonly GameEvent[] = complete ? [{ type: 'bookComplete' }] : [];
  return {
    state: { ...state, book: { pages, award: { ...sticker, at: null } } },
    events: [...events, { type: 'stickerAwarded', stickerId: sticker.pal, gold: sticker.gold }, ...done],
  };
};

/** The Child puts the new sticker on the page. A place outside the page moves to its nearest edge. */
export const place = (state: GameState, position: Position): Outcome => {
  const { award } = state.book;
  if (!award) {
    return { state, events: [] };
  }
  const at = { x: Math.min(1, Math.max(0, position.x)), y: Math.min(1, Math.max(0, position.y)) };
  return {
    state: { ...state, book: { ...state.book, award: { ...award, at } } },
    events: [{ type: 'stickerPlaced', at }],
  };
};

/** Puts the new sticker on the current page for good. A sticker that the Child did not drag goes to a free spot. */
export const paste = (book: Book): { readonly book: Book; readonly events: readonly GameEvent[] } => {
  const { award } = book;
  if (!award) {
    return { book, events: [] };
  }
  const page = book.pages.at(-1) ?? [];
  const at = award.at ?? freeSpot(page);
  const placed: PlacedSticker = { pal: award.pal, gold: award.gold, at };
  return {
    book: { pages: [...book.pages.slice(0, -1), [...page, placed]], award: null },
    events: award.at ? [] : [{ type: 'stickerPlaced', at }],
  };
};
