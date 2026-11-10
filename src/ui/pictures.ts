import { pictureOf } from '../model';
import type { PictureId } from '../model';

// The picture files are in public/, so the Vite build serves them and the service worker precaches them.
// The catalog paths are relative to the base URL ('/pile-pals/').

const url = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

/** The URL of the still picture (WebP). */
export const stillUrl = (id: PictureId): string => url(pictureOf(id).still);

/**
 * The URL of the animation loop, or undefined when the picture has no animated twin.
 * Frame 0 of the loop is the still picture, so a swap of `src` from the still to the loop shows no jump.
 */
export const animationUrl = (id: PictureId): string | undefined => {
  const { animation } = pictureOf(id);
  return animation === null ? undefined : url(animation);
};
