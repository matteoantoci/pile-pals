import { catalog } from './catalog';
import type { CatalogCard, CatalogGroup } from './catalog';
import type { GroupId, PictureId } from './types';

// The fairness rule of research/native-feel/content-model.md §5, read from the catalog.
// "Fits" = the picture is a member or a `maybe` of the group. A picture that is not a card (a heart) fits no group.

const NONE: ReadonlySet<GroupId> = new Set();

const FITS: ReadonlyMap<PictureId, ReadonlySet<GroupId>> = new Map(
  catalog.cards.map((card) => [card.id, new Set([...card.groups, ...card.maybe])])
);

const THINGS: ReadonlyMap<PictureId, string> = new Map(catalog.cards.map((card) => [card.id, card.thing]));

/** The member cards of each group, by thing. */
const MEMBERS: ReadonlyMap<GroupId, ReadonlyMap<string, readonly CatalogCard[]>> = new Map(
  catalog.groups.map((group) => [
    group.id,
    catalog.cards
      .filter((card) => card.groups.includes(group.id))
      .reduce(
        (things, card) => things.set(card.thing, [...(things.get(card.thing) ?? []), card]),
        new Map<string, readonly CatalogCard[]>()
      ),
  ])
);

const TYPES: ReadonlyMap<string, readonly CatalogGroup[]> = new Map(
  catalog.groups.map((group) => [group.type, catalog.groups.filter((other) => other.type === group.type)])
);

/** The groups of the association type of the group (rule 1: a level shows one type). */
export const groupsOfType = (group: CatalogGroup): readonly CatalogGroup[] => TYPES.get(group.type) ?? [group];

/** The thing that the picture shows (rule 4). A picture that is not a card is its own thing. */
export const thingOf = (picture: PictureId): string => THINGS.get(picture) ?? picture;

/** True when the picture fits a shown group other than its own group (rule 2). */
export const fitsOther = (picture: PictureId, own: CatalogGroup, shown: readonly CatalogGroup[]): boolean =>
  shown.some((group) => group !== own && (FITS.get(picture) ?? NONE).has(group.id));

/** True when the group is confusable with one of the shown groups (rule 3). */
export const confusable = (group: CatalogGroup, shown: readonly CatalogGroup[]): boolean =>
  shown.some((other) => group.confusable.includes(other.id));

/**
 * The things that the group can get in a level with the shown groups: its members that fit no other
 * shown group (rule 2). Each entry is a thing and its safe pictures. Rule 5 counts these things.
 */
export const safeThings = (
  group: CatalogGroup,
  shown: readonly CatalogGroup[]
): readonly (readonly [string, readonly CatalogCard[]])[] =>
  [...(MEMBERS.get(group.id) ?? [])]
    .map(([thing, cards]) => [thing, cards.filter((card) => !fitsOther(card.id, group, shown))] as const)
    .filter(([, cards]) => cards.length > 0);
