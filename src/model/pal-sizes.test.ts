import { describe, expect, it } from 'vitest';
import { catalog, palSize } from './index';

// The size tags of the pals (ticket 13). A pal with no own sound plays the pop at a high, middle, or low pitch for
// the real size of its thing. The tests use the public interface and the real catalog.

describe('palSize', () => {
  it('gives the real size of a thing: an ant is small, an alarm clock is middle, an airplane is large', () => {
    expect(palSize('ant')).toBe('S');
    expect(palSize('alarm-clock')).toBe('M');
    expect(palSize('airplane')).toBe('L');
  });

  it('gives a size to each pal of the catalog', () => {
    const pals = catalog.cards.filter((card) => card.animation !== null);

    expect(pals).toHaveLength(catalog.pals);
    expect(pals.filter((card) => palSize(card.id) === null).map((card) => card.id)).toEqual([]);
  });

  it('gives no size to a picture that is not a pal', () => {
    const others = [...catalog.cards.filter((card) => card.animation === null), ...catalog.anchors];

    expect(others.filter((picture) => palSize(picture.id) !== null).map((picture) => picture.id)).toEqual([]);
  });
});
