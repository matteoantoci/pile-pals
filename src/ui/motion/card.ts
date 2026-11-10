// Effects on the face and the shadow of a card. The values are the starting values of
// research/native-feel/motion.md, "Starting values for each moment". Ticket 16 tunes them on the iPhone.
// The effects never touch `.card`: the drag and the springs own its transform.

import { facePose, REST_SCALE, settle, stop } from './primitives';
import type { Frame } from './primitives';

/** The parts of a card that the effects animate. The shadow has a static `box-shadow`, only `opacity` animates. */
export type CardParts = { readonly face: HTMLElement; readonly shadow: HTMLElement };

export const RESTING = facePose({ scale: REST_SCALE });
export const LIFTED = facePose({});

const SHADOW_DOWN: Frame = { transform: 'translate(0px, 2px)', opacity: 0 };
const SHADOW_UP: Frame = { transform: 'translate(0px, 8px)', opacity: 1 };

const LIFT: KeyframeAnimationOptions = { duration: 120, easing: 'cubic-bezier(0.2, 0, 0, 1)' };
const LAND_MS = 260;
const SHAKE_MS = 360;
const SHAKE_X = [0, -10, 8, -6, 4, -2, 0];

const SQUASH: readonly Frame[] = [
  { offset: 0, transform: LIFTED },
  { offset: 0.35, transform: facePose({ scale: 0.982, scaleY: 0.87 }) },
  { offset: 0.7, transform: facePose({ scale: 0.907, scaleY: 0.945 }) },
  { offset: 1, transform: RESTING },
];

/** The card grows to its lifted size, and the shadow fades in. Starts from the current inline pose. */
export const lift = (parts: CardParts): void => {
  stop(parts.face);
  stop(parts.shadow);
  const from = parts.face.style.transform || RESTING;
  settle(parts.face, [{ transform: from }, { transform: LIFTED }], LIFT);
  settle(parts.shadow, [SHADOW_DOWN, SHADOW_UP], LIFT);
};

/**
 * The card squashes and goes back to its resting size, and the shadow fades out.
 * `delay` (ms) is the time when the spring of the card first gets to its target.
 */
export const land = (parts: CardParts, delay: number): Promise<unknown> => {
  const timing: KeyframeAnimationOptions = { duration: LAND_MS, delay, easing: 'ease-out', fill: 'backwards' };
  return Promise.all([
    settle(parts.face, SQUASH, timing).finished,
    settle(parts.shadow, [SHADOW_UP, SHADOW_DOWN], timing).finished,
  ]);
};

/** A soft horizontal shake of the lifted face after a wrong drop. */
export const shake = (parts: CardParts): Animation =>
  settle(
    parts.face,
    SHAKE_X.map((x) => ({ transform: facePose({ x }) })),
    { duration: SHAKE_MS, easing: 'linear' }
  );
