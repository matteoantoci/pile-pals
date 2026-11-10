// Motion primitives. Rules from research/native-feel/motion.md, "Rules for every animation":
// - Animate only `transform` and `opacity`, with WAAPI. No CSS transitions, no `linear(…)` with points, no `steps()`.
// - Use the same transform function list in each keyframe of one animation.
// - Give an explicit first and last keyframe.
// - No `fill: 'forwards'`. Write the final value to the inline style, then animate from the old value.

export type Vec = { readonly x: number; readonly y: number };

/** One keyframe. Only `transform` and `opacity` animate. */
export type Frame = { readonly transform?: string; readonly opacity?: number; readonly offset?: number };

/** The pose of a card face: translate (px), rotate (deg), scale. `scaleY` is `scale` when it is not set. */
export type Pose = {
  readonly x?: number;
  readonly y?: number;
  readonly rotate?: number;
  readonly scale?: number;
  readonly scaleY?: number;
};

/** The resting scale of a card face. The card box has the lifted size, and the face rests at 1/1.08. */
export const REST_SCALE = 0.926;

/** The translate of an element at its place in the layout. */
export const ORIGIN: Vec = { x: 0, y: 0 };

/**
 * The reject handler of stopped motion. A canceled animation rejects its `finished` promise, and a stopped wait
 * rejects too. The next motion then owns the element, so there is nothing to do.
 */
export const canceled = (): void => undefined;

/** The transform of a moving element (`.card`, the demo hand). The drag writes the same form. */
export const translate3d = (p: Vec): string => `translate3d(${String(p.x)}px, ${String(p.y)}px, 0)`;

/** The transform of a card face. The function list is always `translate() rotate() scale()`. */
export const facePose = (pose: Pose): string => {
  const { x = 0, y = 0, rotate = 0, scale = 1, scaleY = scale } = pose;
  return `translate(${String(x)}px, ${String(y)}px) rotate(${String(rotate)}deg) scale(${String(scale)}, ${String(scaleY)})`;
};

/** Cancels each animation of `el` (not of its children). The inline style then shows. */
export const stop = (el: Element): void => {
  for (const animation of el.getAnimations()) {
    animation.cancel();
  }
};

/**
 * Stops the animations of a moving element and keeps it where it is on the screen.
 * Returns the translate. Use it at `pointerdown` on an element that can still move.
 */
export const freeze = (el: HTMLElement): Vec => {
  const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
  stop(el);
  const at = { x: matrix.m41, y: matrix.m42 };
  el.style.setProperty('transform', translate3d(at));
  return at;
};

/**
 * Plays the keyframes on `el` and keeps the last keyframe as the inline style.
 * Use `fill: 'backwards'` in `timing` only to hold the first keyframe during a `delay`.
 */
export const settle = (el: HTMLElement, frames: readonly Frame[], timing: KeyframeAnimationOptions): Animation => {
  const last = frames.at(-1);
  if (last?.transform !== undefined) {
    el.style.setProperty('transform', last.transform);
  }
  if (last?.opacity !== undefined) {
    el.style.setProperty('opacity', String(last.opacity));
  }
  return el.animate([...frames], timing);
};
