import { describe, expect, it } from 'vitest';
import { apply, demoFor, dropCard, hintFor, nextLevel, placeAnchor, restore, sawDemo, snapshot, start } from './index';
import { openCards, playOut } from './test-player';
import type { DemoKind, GameEvent, GameState } from './index';

// The demo hand and the hint hop (spec, user stories 24 to 29). The tests use the public interface only.

const SEEDS = Array.from({ length: 30 }, (_, i) => 7919 * i + 5);
const LEVELS = Array.from({ length: 30 }, (_, i) => i + 1);

/** The state after the Child saw these demos. */
const seen = (state: GameState, kinds: readonly DemoKind[]): GameState => kinds.reduce(sawDemo, state);

/** The events of the move that the demo shows. */
const demoEvents = (state: GameState): readonly GameEvent['type'][] => {
  const demo = demoFor(state);
  return demo ? apply(state, demo.move).events.map((event) => event.type) : [];
};

/** True when the Child can move one of the open cards: a drop on a pile or a category card on a slot. */
const cardCanMove = (state: GameState): boolean =>
  openCards(state).some((card) =>
    state.piles.some(
      (pile) =>
        apply(state, dropCard(card.id, pile.id)).state !== state ||
        apply(state, placeAnchor(card.id, pile.id)).state !== state
    )
  );

describe('the first demo', () => {
  it('shows the first card of level 1 going to its pile', () => {
    SEEDS.forEach((seed) => {
      const state = start({ level: 1 }, seed);
      expect(demoFor(state)?.kind).toBe('first');
      expect(demoFor(state)?.move.type).toBe('dropCard');
      expect(demoEvents(state)[0]).toBe('snapped');
    });
  });

  it('does not show again after the Child saw it', () => {
    SEEDS.forEach((seed) => {
      expect(demoFor(sawDemo(start({ level: 1 }, seed), 'first'))).toBeUndefined();
    });
  });
});

describe('the demos of new actions', () => {
  it('shows a face-down card first: the card on top of it goes to its pile, and it turns over', () => {
    SEEDS.forEach((seed) => {
      const state = seen(start({ level: 11 }, seed), ['first']);
      expect(demoFor(state)?.kind).toBe('faceDown');
      expect(demoEvents(state)).toEqual(['snapped', 'flipped']);
    });
  });

  it('shows the deck after the face-down card: the hand taps the deck', () => {
    SEEDS.forEach((seed) => {
      const state = seen(start({ level: 11 }, seed), ['first', 'faceDown']);
      expect(demoFor(state)?.kind).toBe('deck');
      expect(demoEvents(state)).toEqual(['dealt']);
    });
  });

  it('shows a category card going on an empty slot when the Child can pick one up', () => {
    const states = SEEDS.map((seed) => seen(start({ level: 13 }, seed), ['first', 'faceDown']));
    const withAnchor = states.filter((state) => openCards(state).some((card) => card.anchor));
    expect(withAnchor.length).toBeGreaterThan(0);
    withAnchor.forEach((state) => {
      expect(demoFor(state)?.kind).toBe('anchor');
      expect(demoEvents(state)[0]).toBe('anchorPlaced');
    });
  });

  it('shows no demo when the Child saw all of them', () => {
    const all: readonly DemoKind[] = ['first', 'faceDown', 'anchor', 'deck'];
    SEEDS.flatMap((seed) => LEVELS.map((level) => seen(start({ level }, seed), all))).forEach((state) => {
      expect(demoFor(state)).toBeUndefined();
    });
  });

  it('shows no demo in a finished level', () => {
    const end = playOut(start({ level: 11 }, 5)).end;
    expect(demoFor(end)).toBeUndefined();
  });
});

describe('the seen demos', () => {
  it('go to the next level with the Child', () => {
    const level1 = sawDemo(start({ level: 1 }, 5), 'first');
    const level2 = nextLevel(playOut(level1).end);
    expect(level2.level).toBe(2);
    expect(level2.demos).toEqual(['first']);
  });

  it('are a flag: a second look at the same demo changes nothing', () => {
    const once = sawDemo(start({ level: 1 }, 5), 'first');
    expect(sawDemo(once, 'first')).toBe(once);
  });

  it('are in the save data, so a demo does not show again after a launch', () => {
    const state = seen(start({ level: 11 }, 5), ['first', 'faceDown']);
    const result = restore(JSON.parse(JSON.stringify(snapshot(state))));
    expect(result.ok && result.state.demos).toEqual(['first', 'faceDown']);
    expect(result.ok && demoFor(result.state)?.kind).toBe('deck');
  });

  it('must be in the save data: a save with no demo flags is refused', () => {
    const { demos: _demos, ...older } = start({ level: 1 }, 5);
    const result = restore({ ...snapshot(start({ level: 1 }, 5)), state: older });
    expect(result).toEqual({ ok: false, reason: 'shape' });
  });

  it('must be a list of demo kinds in the save data', () => {
    const state = start({ level: 1 }, 5);
    const bad = restore({ ...snapshot(state), state: { ...state, demos: ['dance'] } });
    expect(bad).toEqual({ ok: false, reason: 'shape' });
  });
});

describe('the hint', () => {
  const states = SEEDS.flatMap((seed) => LEVELS.map((level) => start({ level }, seed)));

  it('in level 1 is a card that goes to its pile', () => {
    const state = start({ level: 1 }, 5);
    const hint = hintFor(state);
    expect(hint?.type).toBe('dropCard');
    expect(hint && apply(state, hint).events[0]?.type).toBe('snapped');
  });

  it('is always a move that the game accepts', () => {
    states.forEach((state) => {
      const hint = hintFor(state);
      expect(hint && apply(state, hint).state).not.toBe(state);
    });
  });

  it('is the deck only when no open card can move', () => {
    const deckHints = states.filter((state) => hintFor(state)?.type === 'tapDeck');
    expect(deckHints.length).toBeGreaterThan(0);
    deckHints.forEach((state) => {
      expect(cardCanMove(state)).toBe(false);
    });
  });

  it('is undefined in a finished level', () => {
    expect(hintFor(playOut(start({ level: 16 }, 5)).end)).toBeUndefined();
  });
});
