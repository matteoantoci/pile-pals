import { describe, expect, it } from 'vitest';
import { apply, dropCard, go, placeSticker, restore, snapshot, start } from './index';
import { openCards, playOut } from './test-player';
import type { Card, GameEvent, GameState, Pile, RestoredGame } from './index';

const firstLevel = (): GameState => start({ level: 1 }, 1);

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

    expect(save.version).toBe(2);
    expect(save.state).toEqual(state);
    expect(save.progress.level).toBe(state.level);
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
    expect(result.progress).toEqual({ level: 1 });
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

  it('rejects an unknown schema version, and a save of version 1 that has no sticker book', () => {
    const save = { ...snapshot(firstLevel()), version: 3 };
    const { book: _book, ...oldState } = firstLevel();
    const old = { version: 1, state: oldState, progress: { level: 1 } };

    expect(restore(save)).toEqual({ ok: false, reason: 'version' });
    expect(restore(old)).toEqual({ ok: false, reason: 'version' });
  });

  it('rejects data that is not a save', () => {
    const state = firstLevel();
    const noState = { version: 2, progress: { level: 1 } };
    const badCard = { ...snapshot(state), state: { ...state, table: [{ id: 1 }] } };
    const noPiles = { ...snapshot(state), state: { ...state, piles: 'none' } };
    const badProgress = { ...snapshot(state), progress: {} };
    const badBook = { ...snapshot(state), state: { ...state, book: { pages: [[{ pal: 'cat', gold: 'yes' }]] } } };

    expect(restore(null)).toEqual({ ok: false, reason: 'shape' });
    expect(restore('save')).toEqual({ ok: false, reason: 'shape' });
    expect(restore({})).toEqual({ ok: false, reason: 'shape' });
    expect(restore(noState)).toEqual({ ok: false, reason: 'shape' });
    expect(restore(badCard)).toEqual({ ok: false, reason: 'shape' });
    expect(restore(noPiles)).toEqual({ ok: false, reason: 'shape' });
    expect(restore(badProgress)).toEqual({ ok: false, reason: 'shape' });
    expect(restore(badBook)).toEqual({ ok: false, reason: 'shape' });
  });
});
