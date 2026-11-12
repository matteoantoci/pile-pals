import { describe, expect, it } from 'vitest';
import { apply, dropCard, go, openCards, placeAnchor, placeSticker, restore, snapshot, start } from './index';
import { playOut } from './test-player';
import type { Card, GameEvent, GameState, Pile, RestoredGame, Stack } from './index';

const firstLevel = (): GameState => start({ level: 1 }, 1);

/** A stack as a save of version 1 holds it: its cards have no `anchor` field. */
const versionOneStack = ({ id, cards }: Stack): unknown => ({
  id,
  cards: cards.map(({ id: cardId, group, picture, faceDown }) => ({ id: cardId, group, picture, faceDown })),
});

/** A restored state, or a failure that fails the test with the reason. */
const restored = (save: unknown): RestoredGame => {
  const result = restore(save);
  if (!result.ok) {
    throw new Error(`restore rejected the save: ${result.reason}`);
  }
  return result;
};

const pileFor = (state: GameState, card: Card, fits: boolean): Pile => {
  const pile = state.piles.find((p) => (p.group === card.group) === fits);
  if (!pile) {
    throw new Error('The level has no such pile.');
  }
  return pile;
};

/** The events of each drop, in order, and the state after the last drop. */
type Play = { readonly drops: readonly (readonly GameEvent[])[]; readonly end: GameState };

/** Drops each card on a pile of the given kind, one after the other. */
const play = (state: GameState, fits: boolean): Play =>
  openCards(state).reduce<Play>(
    ({ drops, end }, card) => {
      const outcome = apply(end, dropCard(card.id, pileFor(end, card, fits).id));
      return { drops: [...drops, outcome.events], end: outcome.state };
    },
    { drops: [], end: state }
  );

describe('snapshot', () => {
  it('holds a schema version and the whole state', () => {
    const state = firstLevel();

    const save = snapshot(state);

    expect(save).toEqual({ version: 4, state });
  });

  it('is plain data, so it survives the JSON of localStorage', () => {
    const state = firstLevel();

    const save = JSON.parse(JSON.stringify(snapshot(state))) as unknown;

    expect(restored(save).state).toEqual(state);
  });

  it('keeps the moves that are done, not only the seed', () => {
    const state = firstLevel();
    const played = play(state, true).end;

    const save = snapshot(played);

    expect(save.state.table).toEqual(played.table);
    expect(save.state.piles).toEqual(played.piles);
  });

  it('keeps the stickers of the book and their places on the page', () => {
    const first = playOut(start({ level: 1 }, 4)).end;
    const second = playOut(apply(apply(first, placeSticker({ x: 0.2, y: 0.3 })).state, go()).state).end;
    const waiting = apply(second, placeSticker({ x: 0.9, y: 0.1 })).state;

    const back = restored(JSON.parse(JSON.stringify(snapshot(waiting))) as unknown).state;

    expect(back.book).toEqual(waiting.book);
    expect(back.book.pages[0]?.[0]?.at).toEqual({ x: 0.2, y: 0.3 });
    expect(back.book.award?.at).toEqual({ x: 0.9, y: 0.1 });
  });
});

describe('restore', () => {
  it('gives the same state back', () => {
    const state = firstLevel();

    const result = restored(snapshot(state));

    expect(result.state).toEqual(state);
  });

  it('reads a save of version 4 from an older build, which also holds a progress field', () => {
    const state = firstLevel();
    const older = { ...snapshot(state), progress: { level: state.level } };

    expect(restore(older)).toEqual({ ok: true, state });
  });

  it('plays the same as the original state', () => {
    const state = start({ level: 5 }, 42);
    const save = snapshot(state);

    const original = play(state, true);
    const afterRestore = play(restored(save).state, true);

    expect(afterRestore.drops).toEqual(original.drops);
    expect(afterRestore.end).toEqual(original.end);
  });

  it('rejects a save after a move with the same result', () => {
    const state = start({ level: 3 }, 7);
    const card = openCards(state)[0];
    if (!card) {
      throw new Error('The level has no card on the table.');
    }
    const played = apply(state, dropCard(card.id, pileFor(state, card, true).id)).state;

    const original = play(played, false);
    const afterRestore = play(restored(snapshot(played)).state, false);

    expect(afterRestore.drops).toEqual(original.drops);
    expect(afterRestore.end).toEqual(original.end);
  });

  it('rejects an unknown schema version, and a save of version 2 that has no sticker book', () => {
    const save = { ...snapshot(firstLevel()), version: 5 };
    const { book: _book, ...oldState } = firstLevel();
    const old = { version: 2, state: oldState, progress: { level: 1 } };

    expect(restore(save)).toEqual({ ok: false, reason: 'version' });
    expect(restore(old)).toEqual({ ok: false, reason: 'version' });
  });

  it('rejects a save of version 1, which has no category cards on the table', () => {
    const state = firstLevel();
    const older = {
      version: 1,
      state: { ...state, table: state.table.map(versionOneStack) },
      progress: { level: 1 },
    };

    expect(restore(older)).toEqual({ ok: false, reason: 'version' });
  });

  it('keeps the empty slots and the placed category cards, and plays the same', () => {
    const state = start({ level: 16 }, 3);
    const anchor = openCards(state).find((card) => card.anchor);
    const slot = state.piles.find((pile) => pile.group === null);
    if (!anchor || !slot) {
      throw new Error('The level has no open category card or no empty slot.');
    }
    const placed = apply(state, placeAnchor(anchor.id, slot.id)).state;

    const back = restored(JSON.parse(JSON.stringify(snapshot(placed))) as unknown).state;

    expect(back).toEqual(placed);
    expect(back.piles.some((pile) => pile.group === null)).toBe(true);
    expect(playOut(back)).toEqual(playOut(placed));
  });

  it('rejects data that is not a save', () => {
    const state = firstLevel();
    const noState = { version: 4 };
    const badCard = { ...snapshot(state), state: { ...state, table: [{ id: 1 }] } };
    const noPiles = { ...snapshot(state), state: { ...state, piles: 'none' } };
    const badBook = { ...snapshot(state), state: { ...state, book: { pages: [[{ pal: 'cat', gold: 'yes' }]] } } };

    expect(restore(null)).toEqual({ ok: false, reason: 'shape' });
    expect(restore('save')).toEqual({ ok: false, reason: 'shape' });
    expect(restore({})).toEqual({ ok: false, reason: 'shape' });
    expect(restore(noState)).toEqual({ ok: false, reason: 'shape' });
    expect(restore(badCard)).toEqual({ ok: false, reason: 'shape' });
    expect(restore(noPiles)).toEqual({ ok: false, reason: 'shape' });
    expect(restore(badBook)).toEqual({ ok: false, reason: 'shape' });
  });
});

/** The table of a build before the column deal: one stack for each card, so a level has up to 12 stacks. */
const oldLayout = (state: GameState): GameState => ({
  ...state,
  table: state.table
    .flatMap((stack) => stack.cards)
    .map((card, index) => ({ id: `stack-${String(index)}`, cards: [{ ...card, faceDown: false }] })),
});

/** The first open card of the level on its pile. */
const playOne = (state: GameState): GameState => {
  const card = openCards(state)[0];
  if (!card) {
    throw new Error('The level has no card on the table.');
  }
  return apply(state, dropCard(card.id, pileFor(state, card, true).id)).state;
};

/** A level 2 with a sticker on the first page of the book. The Child saw the demos of the drag and the deck. */
const carried = (): GameState => {
  const first = playOut(start({ level: 1 }, 4)).end;
  const second = apply(apply(first, placeSticker({ x: 0.2, y: 0.3 })).state, go()).state;
  return { ...second, demos: ['first', 'deck'] };
};

describe('restore of a level with more than 4 stacks', () => {
  it('deals the level again with the same level number and seed, and keeps the book and the seen demos', () => {
    const { book, demos } = carried();
    // Level 7 has 3 groups of 4 cards: 12 stacks of one card in the old layout, and 4 columns now.
    const old = playOne(oldLayout({ ...start({ level: 7 }, 42), book, demos }));

    const back = restored(JSON.parse(JSON.stringify(snapshot(old))) as unknown).state;

    expect(old.table).toHaveLength(12);
    expect(back).toEqual({ ...start({ level: 7 }, 42), book, demos });
    expect(back.table).toHaveLength(4);
    expect(back.book.pages[0]?.[0]?.at).toEqual({ x: 0.2, y: 0.3 });
  });

  it('restores a level with at most 4 stacks as it is', () => {
    const { book, demos } = carried();
    const played = playOne({ ...start({ level: 7 }, 42), book, demos });

    expect(played.table).toHaveLength(4);
    expect(restored(snapshot(played)).state).toEqual(played);
  });

  it('restores a finished level as it is, so its sticker book page shows', () => {
    const finished = playOut(oldLayout(start({ level: 7 }, 42))).end;

    expect(finished.table).toHaveLength(12);
    expect(finished.book.award).not.toBeNull();
    expect(restored(snapshot(finished)).state).toEqual(finished);
  });
});
