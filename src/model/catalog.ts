import data from './catalog.json';
import sizes from './pal-sizes.json';
import type { GroupId, PictureId } from './types';

// The content catalog. research/content/build_content.py writes catalog.json. Do not edit it by hand.
// The picture files are in public/. Their paths are relative to the base URL of the app.

/** A still picture and, for a pal, its animation loop. */
export type Picture = {
  readonly id: PictureId;
  /** The Fluent Emoji name, for example "Red apple". The game never shows it to the Child. */
  readonly name: string;
  readonly still: string;
  /** The animation loop. Its frame 0 is the still picture. Null when the picture has no animated twin. */
  readonly animation: string | null;
};

/** A card picture and its tags. The fairness rule (content-model.md §5) reads `thing`, `groups` and `maybe`. */
export type CatalogCard = Picture & {
  /** Pictures of the same thing have the same value (Red apple and Green apple: "apple"). */
  readonly thing: string;
  /** The colour group of the card, or null when the card has no clear colour. */
  readonly colour: string | null;
  /** The groups where the card is a member. A level can deal the card only to one of these groups. */
  readonly groups: readonly GroupId[];
  /** The groups where a child could also put the card. These groups count as "fits", but never get the card. */
  readonly maybe: readonly GroupId[];
};

export type CatalogGroup = {
  readonly id: GroupId;
  /** The association type, for example "kind" or "colour". A level shows groups of one type only. */
  readonly type: string;
  /** The suggested picture of the category card: a card id, or an anchor id for colour and shape groups. */
  readonly anchor: PictureId;
  /** The groups that a level never shows together with this group. */
  readonly confusable: readonly GroupId[];
};

export type Catalog = {
  /** P: the number of pals (cards with an animation). The sticker book holds 2P stickers. */
  readonly pals: number;
  readonly groups: readonly CatalogGroup[];
  readonly cards: readonly CatalogCard[];
  /** Pictures of category cards that are not cards: the coloured hearts and the red circle. */
  readonly anchors: readonly Picture[];
};

export const catalog: Catalog = data;

const pictures: ReadonlyMap<PictureId, Picture> = new Map(
  [...catalog.cards, ...catalog.anchors].map((picture) => [picture.id, picture])
);

/** The picture with this id. The model uses only catalog ids, so an unknown id is an error in the code. */
export const pictureOf = (id: PictureId): Picture => {
  const picture = pictures.get(id);
  if (!picture) {
    throw new Error(`The catalog has no picture "${id}".`);
  }
  return picture;
};

/**
 * The real size of the thing of a pal: small (ant), middle (alarm clock), or large (airplane). A pal with no own
 * sound plays the pop at a high, middle, or low pitch for its size.
 */
export type PalSize = 'S' | 'M' | 'L';

const PAL_SIZES: readonly PalSize[] = ['S', 'M', 'L'];

/** pal-sizes.json holds the tags by hand (ticket 13). Each pal of the catalog has one tag. */
const sizeOf: ReadonlyMap<PictureId, PalSize> = new Map(
  PAL_SIZES.flatMap((size) => sizes[size].map((id) => [id, size] as const))
);

/** The size tag of a pal, or null for a picture that is not a pal. */
export const palSize = (id: PictureId): PalSize | null => sizeOf.get(id) ?? null;
