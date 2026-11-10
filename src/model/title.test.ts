import { describe, expect, it } from 'vitest';
import { catalog, titleScene } from './index';
import type { CatalogCard, PictureId, TitleScene } from './index';

// The pals of the title scene (spec Module 10): pals hop and fall into 3 small piles.
// Each pile is a small group of the game, so the scene shows the sort that the Child plays.

const SEEDS = Array.from({ length: 200 }, (_, i) => 104_729 * i + 3);
const scenes: readonly TitleScene[] = SEEDS.map((seed) => titleScene(seed));

const cardOf = (picture: PictureId): CatalogCard | undefined => catalog.cards.find((c) => c.id === picture);

const palsOf = (scene: TitleScene): readonly PictureId[] => scene.piles.flatMap((pile) => pile.pals);

describe('titleScene', () => {
  it('gives 3 piles of 3 pals', () => {
    for (const scene of scenes) {
      expect(scene.piles.map((pile) => pile.pals.length)).toEqual([3, 3, 3]);
    }
  });

  it('shows only pals, so that each pal has a sound and an animation', () => {
    for (const pal of scenes.flatMap(palsOf)) {
      expect(cardOf(pal)?.animation).toEqual(expect.any(String));
    }
  });

  it('puts each pal on a pile of its own group, and on no pile where it could also go', () => {
    const placed = scenes.flatMap((scene) =>
      scene.piles.flatMap((pile) => pile.pals.map((pal) => ({ pal, pile, scene })))
    );
    for (const { pal, pile, scene } of placed) {
      const card = cardOf(pal);
      const others = new Set(scene.piles.map((p) => p.group).filter((group) => group !== pile.group));
      expect(card?.groups).toContain(pile.group);
      expect([...(card?.groups ?? []), ...(card?.maybe ?? [])].filter((g) => others.has(g))).toEqual([]);
    }
  });

  it('shows 3 groups of one association type that are not confusable', () => {
    for (const scene of scenes) {
      const groups = scene.piles.map((pile) => catalog.groups.find((g) => g.id === pile.group));
      const ids = new Set(groups.map((group) => group?.id));
      expect(ids.size).toBe(3);
      expect(new Set(groups.map((group) => group?.type)).size).toBe(1);
      expect(groups.flatMap((group) => group?.confusable ?? []).filter((id) => ids.has(id))).toEqual([]);
    }
  });

  it('shows each thing one time', () => {
    for (const scene of scenes) {
      const things = palsOf(scene).map((pal) => cardOf(pal)?.thing);
      expect(new Set(things).size).toBe(things.length);
    }
  });

  it('gives the same scene for the same seed, and other scenes for other seeds', () => {
    expect(titleScene(42)).toEqual(titleScene(42));
    expect(new Set(scenes.map((scene) => palsOf(scene).join())).size).toBeGreaterThan(SEEDS.length / 2);
  });
});
