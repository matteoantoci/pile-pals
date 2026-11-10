// A check of the shipped data: playPal plays the pop at the rate of the size tag, so each pal needs one tag.
import { describe, expect, it } from 'vitest';
import { catalog } from '../model';
import palSizes from './pal-sizes.json';

describe('the pal size tags (src/sound/pal-sizes.json)', () => {
  it('tags each pal of the catalog with one size, and nothing else', () => {
    const pals = catalog.cards.filter((card) => card.animation !== null).map((card) => card.id);
    const tagged = [...palSizes.S, ...palSizes.M, ...palSizes.L];

    expect(pals).toHaveLength(catalog.pals);
    expect(tagged.toSorted((a, b) => a.localeCompare(b))).toEqual(pals.toSorted((a, b) => a.localeCompare(b)));
  });
});
