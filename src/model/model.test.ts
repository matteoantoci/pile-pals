import { describe, expect, it } from 'vitest';
import { apply, dropCard, start, tapDeck } from './index';
import { openCards, playOut } from './test-player';
import type { Card, GameEvent, GameState, Pile } from './index';

const firstLevel = (): GameState => start({ level: 1 }, 1);

const firstCard = (state: GameState): Card => {
  const card = openCards(state)[0];
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
    expect(openCards(result.state).map((c) => c.id)).not.toContain(card.id);
    expect(result.state.piles.find((p) => p.id === right.id)?.cards.map((c) => c.id)).toEqual([card.id]);
  });

  it('gives the next card on the same pile the next note', () => {
    const state = firstLevel();
    const card = firstCard(state);
    const right = pileFor(state, card, true);
    const next = openCards(state).find((c) => c.id !== card.id && c.group === card.group);
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

  it('rejects a card that has a card on top of it', () => {
    const state = start({ level: 11 }, 5);
    const buried = state.table.flatMap((stack) => stack.cards).find((card) => card.faceDown);
    if (!buried) {
      throw new Error('The level has no face-down card.');
    }

    const result = apply(state, dropCard(buried.id, pileFor(state, buried, true).id));

    expect(result.events).toEqual([{ type: 'rejected', cardId: buried.id }]);
    expect(result.state).toBe(state);
  });
});

describe('tapDeck', () => {
  it('gives the top card of the deck and takes it from the deck', () => {
    const state = start({ level: 11 }, 5);
    const top = state.deck.at(-1);
    if (!top) {
      throw new Error('The level has no deck.');
    }

    const result = apply(state, tapDeck());

    expect(result.events).toEqual([{ type: 'dealt' }]);
    expect(result.state.dealt).toEqual(top);
    expect(result.state.deck).toHaveLength(state.deck.length - 1);
  });

  it('puts the face-up card at the bottom of the deck, so no card gets lost', () => {
    const state = start({ level: 11 }, 5);
    const first = state.deck.at(-1);
    if (!first) {
      throw new Error('The level has no deck.');
    }
    const once = apply(state, tapDeck()).state;
    const twice = apply(once, tapDeck()).state;

    expect(twice.deck).toHaveLength(state.deck.length - 1);
    expect(twice.deck[0]?.id).toBe(first.id);
    expect(twice.dealt?.id).toBe(state.deck.at(-2)?.id);
  });

  it('starts the deck again after its last card', () => {
    const state = start({ level: 11 }, 5);
    const turn = state.deck.reduce<{ state: GameState; shown: readonly string[] }>(
      (turned, _, index) => {
        const next = apply(turned.state, tapDeck()).state;
        return { state: next, shown: [...turned.shown, next.dealt?.id ?? `no card ${String(index)}`] };
      },
      { state, shown: [] }
    );

    expect(turn.shown).toEqual(state.deck.map((card) => card.id).toReversed());
    expect(apply(turn.state, tapDeck()).state.dealt?.id).toBe(state.deck.at(-1)?.id);
  });

  it('changes nothing on a level without a deck', () => {
    const state = firstLevel();

    const result = apply(state, tapDeck());

    expect(result.events).toEqual([]);
    expect(result.state).toBe(state);
  });
});

describe('a full level', () => {
  it('gives groupComplete with the last card of a group, and not before', () => {
    const state = firstLevel();
    const pile = state.piles[0];
    const group = openCards(state).filter((card) => card.group === pile?.group);

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

  it('gives levelComplete with the last card of the level, and not before, then the sticker', () => {
    const { events, end } = playOut(firstLevel());

    expect(events.filter((event) => event.type === 'levelComplete')).toHaveLength(1);
    expect(events.slice(-2).map((event) => event.type)).toEqual(['levelComplete', 'stickerAwarded']);
    expect(end.table.every((stack) => stack.cards.length === 0)).toBe(true);
    expect(end.deck).toEqual([]);
    expect(end.dealt).toBeNull();
  });

  it('plays each level to the end, over many seeds and level numbers', () => {
    const states = [1, 2, 3, 5, 8, 13, 21].flatMap((seed) =>
      Array.from({ length: 20 }, (_, i) => start({ level: i + 1 }, seed))
    );
    const wrong = states.filter((state) => {
      const { events, end } = playOut(state);
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
        events.at(-2)?.type !== 'levelComplete' ||
        end.table.some((stack) => stack.cards.length > 0)
      );
    });

    expect(wrong.map((s) => `level ${String(s.level)} seed ${String(s.seed)}`)).toEqual([]);
  });
});
