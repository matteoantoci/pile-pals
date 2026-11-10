import { describe, expect, it } from 'vitest';
import { catalog, pictureOf, start } from './index';
import type { GroupId, PictureId } from './index';

const firstLevel = start({ level: 1 }, 1);

/** Each card and each pile of the level: its picture and the group that it shows. */
const shown: readonly { readonly picture: PictureId; readonly group: GroupId }[] = [
  ...firstLevel.table,
  ...firstLevel.piles,
];

/** The groups of the level, other than `own`, where a child could put the picture. */
const otherFits = (picture: PictureId, own: GroupId): readonly GroupId[] => {
  const card = catalog.cards.find((c) => c.id === picture);
  const fits = card ? [...card.groups, ...card.maybe] : [];
  return firstLevel.piles.map((p) => p.group).filter((g) => g !== own && fits.includes(g));
};

describe('the first level', () => {
  it('shows a catalog still picture on each card and each pile', () => {
    const stills = shown.map((item) => pictureOf(item.picture).still);

    expect(stills.filter((still) => !/^pictures\/[a-z0-9-]+\.webp$/u.test(still))).toEqual([]);
  });

  it('shows on each pile a group of the catalog', () => {
    const groups = new Set(catalog.groups.map((g) => g.id));

    expect(firstLevel.piles.filter((p) => !groups.has(p.group))).toEqual([]);
  });

  it('deals each card to a group of the card in the catalog', () => {
    const wrong = firstLevel.table.filter(
      (card) => !catalog.cards.find((c) => c.id === card.picture)?.groups.includes(card.group)
    );

    expect(wrong).toEqual([]);
  });

  it('shows no picture that fits two piles', () => {
    expect(shown.filter((item) => otherFits(item.picture, item.group).length > 0)).toEqual([]);
  });
});
