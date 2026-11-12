import { describe, expect, it } from 'vitest';
import { apply, dropCard, openCards, pileProgress, placeAnchor, start, tapDeck } from './index';
import type { GameState } from './index';

// The progress of a pile, which the dots of its category card show (spec, "Pile progress").
// The tests use the public interface only.

describe('pileProgress', () => {
  it('gives no done card and all cards of the group at the start', () => {
    // Level 1 has 3 cards for each group, and level 11 has 4 (spec, "Difficulty table").
    const first = start({ level: 1 }, 1);
    const deck = start({ level: 11 }, 1);

    expect(first.piles.map((pile) => pileProgress(first, pile.id))).toEqual([
      { done: 0, total: 3 },
      { done: 0, total: 3 },
    ]);
    expect(deck.piles.every((pile) => pileProgress(deck, pile.id)?.total === 4)).toBe(true);
    expect(deck.piles.every((pile) => pileProgress(deck, pile.id)?.done === 0)).toBe(true);
  });

  it('grows by one done card for each snap on the pile, and keeps its total', () => {
    const state = start({ level: 3 }, 7);

    const end = openCards(state).reduce<GameState>((now, card) => {
      const pile = now.piles.find((item) => item.group === card.group);
      if (!pile) {
        throw new Error('The card has no pile.');
      }
      const before = pileProgress(now, pile.id);
      const after = apply(now, dropCard(card.id, pile.id)).state;

      expect(pileProgress(after, pile.id)).toEqual({ done: (before?.done ?? -1) + 1, total: 4 });
      return after;
    }, state);

    const done = end.piles.map((pile) => pileProgress(end, pile.id)?.done ?? 0);
    expect(done.reduce((sum, count) => sum + count, 0)).toBe(openCards(state).length);
  });

  it('counts the dealt card in the total, and as done after the Child drops it on its pile', () => {
    // Level 11 has a deck, and a group has 4 cards (spec, "Difficulty table").
    const state = apply(start({ level: 11 }, 1), tapDeck()).state;
    const dealt = state.dealt;
    const pile = state.piles.find((item) => item.group === dealt?.group);
    if (!dealt || !pile) {
      throw new Error('The tap on the deck gives no card of a pile.');
    }

    const dropped = apply(state, dropCard(dealt.id, pile.id)).state;

    expect(pileProgress(state, pile.id)).toEqual({ done: 0, total: 4 });
    expect(pileProgress(dropped, pile.id)).toEqual({ done: 1, total: 4 });
  });

  it('gives undefined for an empty slot and counts no category card after the Child places it', () => {
    // From level 16, all category cards start loose, and a group has 4 cards.
    const states = Array.from({ length: 50 }, (_, i) => start({ level: 16 }, i + 1));
    const state = states.find((each) => openCards(each).some((card) => card.anchor));
    const anchor = state && openCards(state).find((card) => card.anchor);
    const slot = state?.piles[0];
    if (!state || !anchor || !slot) {
      throw new Error('No seed gives an open category card at level 16.');
    }

    const placed = apply(state, placeAnchor(anchor.id, slot.id)).state;

    expect(state.piles.map((pile) => pileProgress(state, pile.id))).toEqual(state.piles.map(() => undefined));
    expect(pileProgress(placed, slot.id)).toEqual({ done: 0, total: 4 });
  });

  it('gives undefined for a pile that the level does not have', () => {
    expect(pileProgress(start({ level: 1 }, 1), 'no-pile')).toBeUndefined();
  });
});
