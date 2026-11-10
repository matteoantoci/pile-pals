// The drag of the new sticker on the book page. Rules from research/native-feel/motion.md, as in ../drag.ts:
// pointermove writes the transform directly, and all other motion goes through ../motion (WAAPI, transform only).
// Different from a card: the sticker has no target. It stays at any place on the page where the finger lets go.

import { playSound } from '../../sound';
import { facePose, freeze, LANDING, releaseVelocity, RETURN, settle, springTo, translate3d } from '../motion';
import type { Sample, Vec } from '../motion';

const SAMPLES = 8;
const ORIGIN: Vec = { x: 0, y: 0 };
/** The picture of a held sticker grows a little, as a lifted card does. */
const LIFTED = facePose({ scale: 1.12 });
const RESTING = facePose({});

const canceled = (): void => undefined;

/** A held sticker: the pointer, the finger minus the translate, and the sticker centre at translate 0. */
type Hold = { readonly pointer: number; readonly grab: Vec; readonly home: Vec };

type Drag = { hold: Hold | undefined; at: Vec; rest: Vec; samples: Sample[] };

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
  const drag: Drag = { hold: undefined, at: ORIGIN, rest: freeze(el), samples: [] };

  const goBack = (velocity: Vec): void => {
    springTo(el, { from: drag.at, to: drag.rest, velocity }, RETURN).animation.finished.catch(canceled);
  };

  el.addEventListener('pointerdown', (event) => {
    if (drag.hold) {
      return;
    }
    const from = freeze(el);
    el.setPointerCapture(event.pointerId);
    el.classList.add('lifted');
    pose(el, LIFTED);
    playSound('lift');
    drag.hold = {
      pointer: event.pointerId,
      grab: { x: event.clientX - from.x, y: event.clientY - from.y },
      home: homeOf(el, from),
    };
    drag.at = from;
    drag.samples = [{ t: event.timeStamp, ...from }];
  });

  el.addEventListener('pointermove', (event) => {
    const { hold } = drag;
    if (!hold || event.pointerId !== hold.pointer) {
      return;
    }
    drag.at = { x: event.clientX - hold.grab.x, y: event.clientY - hold.grab.y };
    drag.samples = [...drag.samples.slice(1 - SAMPLES), { t: event.timeStamp, ...drag.at }];
    el.style.setProperty('transform', translate3d(drag.at));
  });

  const end = (event: PointerEvent, letGo: boolean): void => {
    const { hold } = drag;
    if (!hold || event.pointerId !== hold.pointer) {
      return;
    }
    drag.hold = undefined;
    el.classList.remove('lifted');
    pose(el, RESTING);
    const center = { x: hold.home.x + drag.at.x, y: hold.home.y + drag.at.y };
    if (letGo && drop(center)) {
      drag.rest = drag.at;
      return;
    }
    goBack(letGo ? releaseVelocity(drag.samples, event.timeStamp) : ORIGIN);
  };
  el.addEventListener('pointerup', (event) => end(event, true));
  el.addEventListener('pointercancel', (event) => end(event, false));
};
