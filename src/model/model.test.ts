import { describe, expect, it } from 'vitest';
import { apply, dropCard, nextLevel, start } from './index';
import type { Card, GameEvent, GameState, Pile } from './index';

const firstLevel = (): GameState => start({ level: 1 }, 1);

const firstCard = (state: GameState): Card => {
  const card = state.table[0];
  if (!card) {
    throw new Error('The level has no card on the table.');
  }
  return card;
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

/** Drops the cards on their piles, one after the other. */
const play = (state: GameState, cards: readonly Card[]): Play =>
  cards.reduce<Play>(
    ({ drops, end }, card) => {
      const outcome = apply(end, dropCard(card.id, pileFor(end, card, true).id));
      return { drops: [...drops, outcome.events], end: outcome.state };
    },
    { drops: [], end: state }
  );

const playAll = (state: GameState): Play => play(state, state.table);

describe('dropCard', () => {
  it('rejects a card on the wrong pile and keeps the same state', () => {
    const state = firstLevel();
    const card = firstCard(state);
    const wrong = pileFor(state, card, false);

    const result = apply(state, dropCard(card.id, wrong.id));

    expect(result.events).toEqual([{ type: 'rejected', cardId: card.id }]);
    expect(result.state).toBe(state);
  });

  it('snaps a card onto the correct pile', () => {
    const state = firstLevel();
    const card = firstCard(state);
    const right = pileFor(state, card, true);

    const result = apply(state, dropCard(card.id, right.id));

    expect(result.events).toEqual([{ type: 'snapped', cardId: card.id, pileId: right.id, noteIndex: 0 }]);
    expect(result.state.table.map((c) => c.id)).not.toContain(card.id);
    expect(result.state.piles.find((p) => p.id === right.id)?.cards.map((c) => c.id)).toEqual([card.id]);
  });

  it('gives the next card on the same pile the next note', () => {
    const state = firstLevel();
    const card = firstCard(state);
    const right = pileFor(state, card, true);
    const next = state.table.find((c) => c.id !== card.id && c.group === card.group);
    if (!next) {
      throw new Error('The level has only one card in the group.');
    }

    const once = apply(state, dropCard(card.id, right.id));
    const twice = apply(once.state, dropCard(next.id, right.id));

    expect(twice.events).toEqual([{ type: 'snapped', cardId: next.id, pileId: right.id, noteIndex: 1 }]);
  });

  it('rejects a card that is not on the table', () => {
    const state = firstLevel();
    const card = firstCard(state);
    const right = pileFor(state, card, true);
    const once = apply(state, dropCard(card.id, right.id));

    const again = apply(once.state, dropCard(card.id, right.id));

    expect(again.events).toEqual([{ type: 'rejected', cardId: card.id }]);
    expect(again.state).toBe(once.state);
  });
});

describe('a full level', () => {
  it('gives groupComplete with the last card of a group, and not before', () => {
    const state = firstLevel();
    const pile = state.piles[0];
    const group = state.table.filter((card) => card.group === pile?.group);

    const { drops } = play(state, group);

    expect(drops.map((events) => events.map((event) => event.type))).toEqual([
      ['snapped'],
      ['snapped'],
      ['snapped', 'groupComplete'],
    ]);
    expect(drops.at(-1)).toEqual([
      { type: 'snapped', cardId: group.at(-1)?.id, pileId: pile?.id, noteIndex: 2 },
      { type: 'groupComplete', pileId: pile?.id },
    ]);
  });

  it('gives levelComplete with the last card of the level, and not before', () => {
    const { drops, end } = playAll(firstLevel());

    expect(drops.flat().filter((event) => event.type === 'levelComplete')).toHaveLength(1);
    expect(drops.at(-1)?.at(-1)).toEqual({ type: 'levelComplete' });
    expect(end.table).toEqual([]);
  });

  it('plays each level to the end, over many seeds and level numbers', () => {
    const states = [1, 2, 3, 5, 8, 13, 21].flatMap((seed) =>
      Array.from({ length: 20 }, (_, i) => start({ level: i + 1 }, seed))
    );
    const wrong = states.filter((state) => {
      const events = playAll(state).drops.flat();
      const notes = state.piles.map((pile) =>
        events.flatMap((e) => (e.type === 'snapped' && e.pileId === pile.id ? [e.noteIndex] : []))
      );
      const completed = events.flatMap((e) => (e.type === 'groupComplete' ? [e.pileId] : []));
      return (
        notes.some((indexes) => indexes.some((note, i) => note !== i)) ||
        completed.toSorted().join() !==
          state.piles
            .map((p) => p.id)
            .toSorted()
            .join() ||
        events.at(-1)?.type !== 'levelComplete'
      );
    });

    expect(wrong.map((s) => `level ${String(s.level)} seed ${String(s.seed)}`)).toEqual([]);
  });
});

describe('nextLevel', () => {
  it('deals the next level after levelComplete', () => {
    const { end } = playAll(firstLevel());

    const next = nextLevel(end);

    expect(next.level).toBe(2);
    expect(next.table.length).toBeGreaterThan(0);
    expect(next.piles.every((pile) => pile.cards.length === 0)).toBe(true);
  });

  it('deals the same level as a new start of that level with the same seed', () => {
    const { end } = playAll(start({ level: 6 }, 99));

    expect(nextLevel(end)).toEqual(start({ level: 7 }, 99));
  });

  it('keeps a level that is not finished', () => {
    const state = firstLevel();

    expect(nextLevel(state)).toBe(state);
  });
});
