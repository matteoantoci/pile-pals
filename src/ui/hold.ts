// The hold of one finger on an element: the shared part of the card drag (./drag.ts) and the sticker drag
// (./book/sticker-drag.ts). Rules from research/native-feel/motion.md:
// - pointermove writes the transform directly. No requestAnimationFrame, no framework state.
// - The element takes the pointer with setPointerCapture.
// - The hold knows no target and no animation. The hooks of the caller decide what a move and a release do.

import { freeze, ORIGIN, releaseVelocity, translate3d } from './motion';
import type { Sample, Vec } from './motion';

/** The release speed comes from the last pointer moves. */
const SAMPLES = 8;

/** A held element. `grab` is the finger minus the translate. `home` is the element centre at translate 0. */
export type Hold = { readonly pointer: number; readonly grab: Vec; readonly home: Vec };

/**
 * The end of a hold. `raw` is the finger translate, and `at` is the drawn translate. `letGo` is true when the finger
 * went up, and false when the browser canceled the pointer: then `velocity` is 0.
 */
export type HoldEnd = {
  readonly hold: Hold;
  readonly raw: Vec;
  readonly at: Vec;
  readonly velocity: Vec;
  readonly letGo: boolean;
};

export type HoldHooks = {
  /** The finger takes the element. `from` is the translate where the element was. */
  readonly start: (hold: Hold, from: Vec) => void;
  /** Gives the translate to draw for the finger translate `raw`. */
  readonly draw: (hold: Hold, raw: Vec) => Vec;
  /** The finger goes up, or the browser cancels the pointer. */
  readonly end: (end: HoldEnd) => void;
};

/** A hold that the caller can stop: `forget` ends the hold with no `end` call. */
export type Holder = { readonly forget: () => void };

/**
 * Lets one finger hold the element. At `pointerdown`, the element stops its animation where it is, takes the
 * pointer, and gets the `lifted` class. The caller removes the class.
 */
export const pointerHold = (el: HTMLElement, hooks: HoldHooks): Holder => {
  let hold: Hold | undefined;
  let raw = ORIGIN;
  let at = ORIGIN;
  let samples: Sample[] = [];

  el.addEventListener('pointerdown', (event) => {
    if (hold) {
      return;
    }
    const from = freeze(el);
    el.setPointerCapture(event.pointerId);
    el.classList.add('lifted');
    const box = el.getBoundingClientRect();
    hold = {
      pointer: event.pointerId,
      grab: { x: event.clientX - from.x, y: event.clientY - from.y },
      home: { x: box.left + box.width / 2 - from.x, y: box.top + box.height / 2 - from.y },
    };
    raw = from;
    at = from;
    samples = [{ t: event.timeStamp, ...from }];
    hooks.start(hold, from);
  });

  el.addEventListener('pointermove', (event) => {
    if (!hold || event.pointerId !== hold.pointer) {
      return;
    }
    raw = { x: event.clientX - hold.grab.x, y: event.clientY - hold.grab.y };
    at = hooks.draw(hold, raw);
    samples = [...samples.slice(1 - SAMPLES), { t: event.timeStamp, ...at }];
    el.style.setProperty('transform', translate3d(at));
  });

  const end = (event: PointerEvent, letGo: boolean): void => {
    const ended = hold;
    if (!ended || event.pointerId !== ended.pointer) {
      return;
    }
    hold = undefined;
    const velocity = letGo ? releaseVelocity(samples, event.timeStamp) : ORIGIN;
    hooks.end({ hold: ended, raw, at, velocity, letGo });
  };
  el.addEventListener('pointerup', (event) => end(event, true));
  el.addEventListener('pointercancel', (event) => end(event, false));

  return {
    forget: () => {
      hold = undefined;
    },
  };
};
