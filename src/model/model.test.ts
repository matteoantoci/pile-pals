import { describe, expect, it } from 'vitest';
import { apply, dropCard, start } from './index';
import type { Card, GameState, Pile } from './index';

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
