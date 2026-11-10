import { describe, expect, it } from 'vitest';
import { apply, dropCard, placeAnchor, restore, snapshot, start } from './index';
import { openCards, playOut } from './test-player';
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

  it('rejects an unknown schema version', () => {
    const save = { ...snapshot(firstLevel()), version: 3 };

    expect(restore(save)).toEqual({ ok: false, reason: 'version' });
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
    const noState = { version: 2, progress: { level: 1 } };
    const badCard = { ...snapshot(state), state: { ...state, table: [{ id: 1 }] } };
    const noPiles = { ...snapshot(state), state: { ...state, piles: 'none' } };
    const badProgress = { ...snapshot(state), progress: {} };

    expect(restore(null)).toEqual({ ok: false, reason: 'shape' });
    expect(restore('save')).toEqual({ ok: false, reason: 'shape' });
    expect(restore({})).toEqual({ ok: false, reason: 'shape' });
    expect(restore(noState)).toEqual({ ok: false, reason: 'shape' });
    expect(restore(badCard)).toEqual({ ok: false, reason: 'shape' });
    expect(restore(noPiles)).toEqual({ ok: false, reason: 'shape' });
    expect(restore(badProgress)).toEqual({ ok: false, reason: 'shape' });
  });
});
