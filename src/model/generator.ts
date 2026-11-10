import { catalog } from './catalog';
import { difficultyOf } from './difficulty';
import { confusable, fitsOther, groupsOfType, safeThings, thingOf } from './fairness';
import { canFinish } from './moves';
import { mixSeed, randomFrom } from './random';
import type { CatalogCard, CatalogGroup } from './catalog';
import type { Difficulty } from './difficulty';
import type { Random } from './random';
import type { Card, GameState, PictureId, Stack } from './types';

// The level generator (spec, Module 2). It works in three steps:
// 1. `difficultyOf` gives the size of the level.
// 2. `chooseSetup` finds a fair setup: the groups, the picture of each category card, and the cards of each group.
// 3. `layOut` puts the setup on the table and the piles. This step makes the plain data of the state.

/** One group of a level: the catalog group, the picture of its category card, and its cards. */
type Plan = { readonly group: CatalogGroup; readonly anchor: PictureId; readonly cards: readonly CatalogCard[] };

/** The part of the start state that the generator makes. It is plain data, so a save can keep it whole. */
export type Deal = Pick<GameState, 'table' | 'piles' | 'deck' | 'dealt'>;

/** How many deals the dead-end check may reject before the generator stops. The tests prove that it never gets here. */
const DEAL_ATTEMPTS = 50;

/** What the steps of one try share. */
type Context = { readonly shown: readonly CatalogGroup[]; readonly cards: number; readonly random: Random };

/** The plans so far, and the things that they show. */
type Dealing = { readonly used: ReadonlySet<string>; readonly plans: readonly Plan[] };

/** The search for a fair setup stops after this many tries. The tests prove that a setup comes much sooner. */
const MAX_TRIES = 500;

/** One try picks this many random group sets for each pile count before it tries one pile less. */
const SETS_PER_COUNT = 8;

/** `count` random groups of the type of `first` (rule 1), with no confusable pair (rule 3). */
const chooseGroups = (first: CatalogGroup, count: number, random: Random): readonly CatalogGroup[] | undefined => {
  const shown = random
    .shuffle(groupsOfType(first))
    .reduce<readonly CatalogGroup[]>(
      (chosen, group) =>
        chosen.length < count && !chosen.includes(group) && !confusable(group, chosen)
          ? chosen.concat([group])
          : chosen,
      [first]
    );
  return shown.length === count ? shown : undefined;
};

/**
 * The pile counts to try, the most first, each `SETS_PER_COUNT` times. A type with fewer groups than the most
 * piles shows all its groups. A type that cannot fill the most piles fairly (for example "moves" with 4 piles)
 * gets fewer piles.
 */
const pileCounts = (first: CatalogGroup, difficulty: Difficulty): readonly number[] => {
  const most = Math.min(difficulty.maxGroups, groupsOfType(first).length);
  return Array.from(
    { length: (most - difficulty.minGroups + 1) * SETS_PER_COUNT },
    (_, i) => most - Math.floor(i / SETS_PER_COUNT)
  );
};

/** The picture of the category card: the catalog anchor, or a safe member when the anchor fits another group. */
const anchorOf = (group: CatalogGroup, context: Context): readonly PictureId[] =>
  fitsOther(group.anchor, group, context.shown)
    ? context.random
        .shuffle(safeThings(group, context.shown).flatMap(([, cards]) => cards))
        .slice(0, 1)
        .map((card) => card.id)
    : [group.anchor];

/** The cards of one group: safe pictures of things that the level does not show yet (rules 2 and 4). */
const pickCards = (group: CatalogGroup, used: ReadonlySet<string>, context: Context): readonly CatalogCard[] => {
  const things = safeThings(group, context.shown).filter(([thing]) => !used.has(thing));
  return context.random
    .shuffle(things)
    .slice(0, context.cards)
    .flatMap(([, cards]) => context.random.shuffle(cards).slice(0, 1));
};

/** Adds the plan of one group, or gives undefined when the group has too few safe things (rule 5). */
const addPlan = (dealing: Dealing, plan: Omit<Plan, 'cards'>, context: Context): Dealing | undefined => {
  const cards = pickCards(plan.group, dealing.used, context);
  if (cards.length < context.cards) {
    return undefined;
  }
  return {
    used: new Set([...dealing.used, ...cards.map((card) => card.thing)]),
    plans: [...dealing.plans, { ...plan, cards }],
  };
};

/** Plans the category card and the cards of each shown group. Gives undefined when the groups are not fair. */
const planGroups = (
  shown: readonly CatalogGroup[] | undefined,
  difficulty: Difficulty,
  random: Random
): readonly Plan[] | undefined => {
  if (!shown) {
    return undefined;
  }
  const context: Context = { shown, cards: difficulty.cards, random };
  const anchored = shown.flatMap((group) => anchorOf(group, context).map((anchor) => ({ group, anchor })));
  const used = new Set(anchored.map(({ anchor }) => thingOf(anchor)));
  if (used.size < shown.length) {
    return undefined;
  }
  return anchored.reduce<Dealing | undefined>((dealing, plan) => dealing && addPlan(dealing, plan, context), {
    used,
    plans: [],
  })?.plans;
};

/**
 * One try to find a fair setup. The first group is a random group of the catalog, so each group comes equally
 * often, and its type is the type of the level. Gives undefined when no pile count makes a fair level.
 */
const trySetup = (difficulty: Difficulty, random: Random): readonly Plan[] | undefined => {
  const first = random.pick(catalog.groups.filter((group) => groupsOfType(group).length >= difficulty.minGroups));
  if (!first) {
    return undefined;
  }
  return pileCounts(first, difficulty).reduce<readonly Plan[] | undefined>(
    (found, count) => found ?? planGroups(chooseGroups(first, count, random), difficulty, random),
    undefined
  );
};

const chooseSetup = (difficulty: Difficulty, random: Random, tries = 0): readonly Plan[] => {
  if (tries >= MAX_TRIES) {
    throw new Error('The catalog has no fair level for this difficulty.');
  }
  return trySetup(difficulty, random) ?? chooseSetup(difficulty, random, tries + 1);
};

/**
 * The stacks of the table: each stack has one face-up card on top, and a face-down card under it when one is left.
 * A face-down card turns over when the card on top of it moves away.
 */
const stackUp = (open: readonly Card[], hidden: readonly Card[]): readonly Stack[] =>
  open.map((card, index) => ({
    id: `stack-${String(index)}`,
    cards: [...(hidden[index] ? [{ ...hidden[index], faceDown: true }] : []), { ...card, faceDown: false }],
  }));

/** Puts the setup on the piles, the stacks, and the deck, in a random order. */
const layOut = (plans: readonly Plan[], difficulty: Difficulty, random: Random): Deal => {
  const piles = random
    .shuffle(plans)
    .map(({ group, anchor }) => ({ id: group.id, group: group.id, picture: anchor, cards: [] }));
  const cards = random.shuffle(
    plans.flatMap(({ group, cards: groupCards }) =>
      groupCards.map((card) => ({ id: card.id, group: group.id, picture: card.id }))
    )
  );
  // One face-down card for each stack, and always a face-up card on the table and in the deck.
  const faceDown = Math.min(difficulty.faceDown, Math.max(0, cards.length - 2));
  const deckSize = Math.min(difficulty.deck, cards.length - faceDown - 1);
  return {
    piles,
    table: stackUp(cards.slice(faceDown + deckSize), cards.slice(0, faceDown)),
    deck: cards.slice(faceDown, faceDown + deckSize),
    dealt: null,
  };
};

/** One try: the check rejects a deal that leaves cards on the table, and the next try takes the next seed. */
const tryDeal = (level: number, seed: number, attempt: number): Deal => {
  if (attempt >= DEAL_ATTEMPTS) {
    throw new Error('The generator found no deal that the Child can finish.');
  }
  const difficulty = difficultyOf(level);
  const random = randomFrom(mixSeed(seed, level, attempt));
  const laid = layOut(chooseSetup(difficulty, random), difficulty, random);
  return canFinish({ level, seed, ...laid }) ? laid : tryDeal(level, seed, attempt + 1);
};

/** Deals a level. The same level number and game seed always give the same deal. */
export const deal = (level: number, seed: number): Deal => tryDeal(level, seed, 0);
