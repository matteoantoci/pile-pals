// The flip of a card face. Rules from research/native-feel/motion.md §5:
// - Two halves of a rotateY, with the swap of the picture at the edge-on frame. No `preserve-3d`,
//   no `backface-visibility`: each half stays inside 90deg and the two WebKit bugs stay away.
// - The same transform function list in each half. The face rests at `RESTING` at the end.

import { canceled, REST_SCALE, RESTING, settle } from './motion';

/** A pose of the flipping face. It has its own function list, so it never mixes with `facePose`. */
const edge = (degrees: number): string =>
  `perspective(600px) rotateY(${String(degrees)}deg) scale(${String(REST_SCALE)}, ${String(REST_SCALE)})`;

const OUT: KeyframeAnimationOptions = { duration: 140, easing: 'cubic-bezier(0.4, 0, 1, 1)' };
const IN: KeyframeAnimationOptions = { duration: 140, easing: 'cubic-bezier(0, 0, 0.2, 1)' };

const rest = (face: HTMLElement): void => face.style.setProperty('transform', RESTING);

/**
 * Turns a face-down card face-up. `showFace` swaps the picture at the edge-on frame.
 * The returned promise ends when the face is at rest again, also when an animation is canceled.
 */
export const flip = (face: HTMLElement, showFace: () => void): Promise<void> => {
  const secondHalf = (): Promise<void> => {
    showFace();
    return settle(face, [{ transform: edge(-90) }, { transform: edge(0) }], IN).finished.then(
      () => rest(face),
      canceled
    );
  };
  return settle(face, [{ transform: edge(0) }, { transform: edge(90) }], OUT).finished.then(secondHalf, canceled);
};
