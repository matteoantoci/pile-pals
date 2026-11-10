// The drag of the new sticker on the book page. Rules from research/native-feel/motion.md, as in ../drag.ts:
// pointermove writes the transform directly (../hold.ts), and all other motion goes through ../motion (WAAPI,
// transform only). Different from a card: the sticker has no target. It stays at any place on the page where the
// finger lets go.

import { playSound } from '../../sound';
import { pointerHold } from '../hold';
import { canceled, facePose, freeze, LANDING, ORIGIN, RETURN, settle, springTo, translate3d } from '../motion';
import type { Vec } from '../motion';

/** The picture of a held sticker grows a little, as a lifted card does. */
const LIFTED = facePose({ scale: 1.12 });
const RESTING = facePose({});

const pose = (el: HTMLElement, transform: string): void => {
  const img = el.querySelector<HTMLElement>('.sticker-img');
  if (img) {
    settle(img, [{ transform: img.style.transform || RESTING }, { transform }], { duration: 120, easing: 'ease-out' });
  }
};

/** The centre of the element at translate 0, in viewport px. */
const homeOf = (el: HTMLElement, from: Vec): Vec => {
  const box = el.getBoundingClientRect();
  return { x: box.left + box.width / 2 - from.x, y: box.top + box.height / 2 - from.y };
};

/** Puts the sticker centre at the viewport point at once (a restored place). */
export const putAt = (el: HTMLElement, point: Vec): void => {
  const home = homeOf(el, freeze(el));
  el.style.setProperty('transform', translate3d({ x: point.x - home.x, y: point.y - home.y }));
};

/** Springs the sticker centre to the viewport point (the place that `go` chose). */
export const flyTo = (el: HTMLElement, point: Vec): Promise<unknown> => {
  const from = freeze(el);
  const home = homeOf(el, from);
  const to = { x: point.x - home.x, y: point.y - home.y };
  return springTo(el, { from, to, velocity: ORIGIN }, LANDING).animation.finished.catch(canceled);
};

/**
 * Makes the sticker draggable with one finger. `drop` gets the sticker centre in viewport px where the finger
 * lets go, and gives true when the sticker stays there. Else the sticker springs back to its last place.
 */
export const freeDraggable = (el: HTMLElement, drop: (center: Vec) => boolean): void => {
  let rest = freeze(el);
  pointerHold(el, {
    start: () => {
      pose(el, LIFTED);
      playSound('lift');
    },
    draw: (_hold, raw) => raw,
    end: ({ hold, at, velocity, letGo }) => {
      el.classList.remove('lifted');
      pose(el, RESTING);
      if (letGo && drop({ x: hold.home.x + at.x, y: hold.home.y + at.y })) {
        rest = at;
        return;
      }
      springTo(el, { from: at, to: rest, velocity }, RETURN).animation.finished.catch(canceled);
    },
  });
};
