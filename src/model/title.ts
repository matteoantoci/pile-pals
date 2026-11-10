import { catalog } from './catalog';
import { confusable, groupsOfType, safeThings } from './fairness';
import { mixSeed, randomFrom } from './random';
import type { CatalogCard, CatalogGroup } from './catalog';
import type { Random } from './random';
import type { GroupId, PictureId } from './types';

// The pals of the title scene (spec Module 10). The pals fall into 3 small piles, and each pile is a group of
// the game. The fairness rule of the levels applies, so the scene shows a sort that the Child can play.
// Only pals come into the scene: a tap on a pal plays its sound.

/** One small pile of the title scene: the group and its pals, in the order that they fall. */
export type TitlePile = { readonly group: GroupId; readonly pals: readonly PictureId[] };

/** One round of the title scene. */
export type TitleScene = { readonly piles: readonly TitlePile[] };

const PILES = 3;
const PALS = 3;
/** Mixed into the seed, so that the title scene and level 1 of the same seed are not related. */
const TITLE = 0x71_71_e0;

type Things = readonly (readonly [string, readonly CatalogCard[]])[];

/** The things of the group that only pals show and that fit no other shown group. */
const palThings = (group: CatalogGroup, shown: readonly CatalogGroup[]): Things =>
  safeThings(group, shown)
    .map(([thing, cards]) => [thing, cards.filter((card) => card.animation !== null)] as const)
    .filter(([, cards]) => cards.length > 0);

/** Adds the group when the groups stay fair: no confusable pair, and enough safe pals for each group. */
const grow = (shown: readonly CatalogGroup[], group: CatalogGroup): readonly CatalogGroup[] => {
  const next = [...shown, group];
  const fair = !confusable(group, shown) && next.every((other) => palThings(other, next).length >= PALS);
  return shown.length < PILES && fair ? next : shown;
};

/** Up to 3 groups of the type of the first group. */
const groupsFor = (first: CatalogGroup, random: Random): readonly CatalogGroup[] =>
  random.shuffle(groupsOfType(first).filter((group) => group !== first)).reduce(grow, [first]);

/** One pal of each thing. */
const palsOf = (things: Things, random: Random): readonly PictureId[] =>
  things.flatMap(([, cards]) => {
    const card = random.pick(cards);
    return card ? [card.id] : [];
  });

/** The piles of the groups, with each thing one time in the scene. Undefined when a pile gets too few pals. */
const pilesOf = (groups: readonly CatalogGroup[], random: Random): readonly TitlePile[] | undefined => {
  const used = new Set<string>();
  const piles = groups.map((group) => {
    const things = random
      .shuffle(palThings(group, groups))
      .filter(([thing]) => !used.has(thing))
      .slice(0, PALS);
    for (const [thing] of things) {
      used.add(thing);
    }
    return { group: group.id, pals: palsOf(things, random) };
  });
  const full = piles.length === PILES && piles.every((pile) => pile.pals.length === PALS);
  return full ? piles : undefined;
};

/** Tries the first groups in order until one gives a full scene. */
const sceneFrom = (firsts: readonly CatalogGroup[], random: Random): readonly TitlePile[] => {
  const [first, ...rest] = firsts;
  if (!first) {
    throw new Error('The catalog has no 3 fair groups with 3 pals each.');
  }
  return pilesOf(groupsFor(first, random), random) ?? sceneFrom(rest, random);
};

/** The pals of one round of the title scene: 3 piles of 3 pals. The same seed gives the same scene. */
export const titleScene = (seed: number): TitleScene => {
  const random = randomFrom(mixSeed(seed, TITLE));
  return { piles: sceneFrom(random.shuffle(catalog.groups), random) };
};
