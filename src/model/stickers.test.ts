import { describe, expect, it } from 'vitest';
import { apply, go, placeSticker, start } from './index';
import { playOut } from './test-player';
import type { GameState } from './index';

describe('the sticker after a level', () => {
  it('awards one normal sticker after the last card of the first level', () => {
    const { events, end } = playOut(start({ level: 1 }, 3));
    const types = events.map((event) => event.type);

    expect(types.filter((type) => type === 'stickerAwarded')).toHaveLength(1);
    expect(types.at(-1)).toBe('stickerAwarded');
    expect(types.at(-2)).toBe('levelComplete');
    expect(events.at(-1)).toEqual({ type: 'stickerAwarded', stickerId: end.book.award?.pal, gold: false });
    expect(end.book.award).toMatchObject({ gold: false, at: null });
  });
});

describe('go', () => {
  it('deals the next level with the same deal as a new start of that level', () => {
    const { end } = playOut(start({ level: 6 }, 99));

    const next = apply(end, go()).state;
    const fresh = start({ level: 7 }, 99);

    expect(next.level).toBe(7);
    expect({ ...next, book: fresh.book }).toEqual(fresh);
  });

  it('changes nothing in a level that is not finished', () => {
    const state: GameState = start({ level: 1 }, 1);

    const outcome = apply(state, go());

    expect(outcome.events).toEqual([]);
    expect(outcome.state).toBe(state);
  });

  it('places the sticker by itself when the Child did not drag it', () => {
    const { end } = playOut(start({ level: 1 }, 5));

    const outcome = apply(end, go());
    const page = outcome.state.book.pages.at(-1) ?? [];

    expect(page).toHaveLength(1);
    expect(page[0]?.pal).toBe(end.book.award?.pal);
    expect(outcome.events).toEqual([{ type: 'stickerPlaced', at: page[0]?.at }]);
    expect(outcome.state.book.award).toBeNull();
  });

  it('keeps the place where the Child dragged the sticker', () => {
    const { end } = playOut(start({ level: 1 }, 5));

    const dragged = apply(end, placeSticker({ x: 0.25, y: 0.75 }));
    const outcome = apply(dragged.state, go());

    expect(dragged.events).toEqual([{ type: 'stickerPlaced', at: { x: 0.25, y: 0.75 } }]);
    expect(outcome.events).toEqual([]);
    expect(outcome.state.book.pages.at(-1)?.[0]?.at).toEqual({ x: 0.25, y: 0.75 });
  });
});

describe('placeSticker', () => {
  it('keeps the sticker inside the page', () => {
    const { end } = playOut(start({ level: 1 }, 5));

    const outcome = apply(end, placeSticker({ x: -1, y: 4 }));

    expect(outcome.state.book.award?.at).toEqual({ x: 0, y: 1 });
  });

  it('changes nothing when no sticker waits', () => {
    const state = start({ level: 1 }, 5);

    const outcome = apply(state, placeSticker({ x: 0.5, y: 0.5 }));

    expect(outcome.events).toEqual([]);
    expect(outcome.state).toBe(state);
  });
});
