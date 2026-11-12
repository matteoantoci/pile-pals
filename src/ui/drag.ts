// The drag of one card. Rules from research/native-feel/motion.md:
// - pointermove writes the transform of `.card` directly (./hold.ts). No requestAnimationFrame, no framework state.
// - The card has `touch-action: none` (styles.css) and takes the pointer with setPointerCapture.
// - All other motion goes through ./motion: WAAPI on `transform` and `opacity` only.
// - The drag knows no game rule. `Hooks.drop` asks the model.

import { pointerHold } from './hold';
import { canceled, land, LANDING, lift, ORIGIN, restPose, RETURN, shake, springTo, stop, translate3d } from './motion';
import type { Holder, HoldEnd } from './hold';
import type { CardParts, Vec } from './motion';

/** A place where a card can land. `at` is the viewport point where the card centre lands. */
export type Target = { readonly id: string; readonly at: Vec };

export type Hooks = {
  /** Gives the targets. The drag reads them one time at `pointerdown`. */
  readonly targets: () => readonly Target[];
  /** Sends the drop on the target to the model. Returns true when the card snapped. */
  readonly drop: (targetId: string) => boolean;
  /** Runs when a snapped card is at rest on its target. */
  readonly landed: () => void;
};

/**
 * The magnet pulls the card when its centre is nearer to the centre of a target than this part of the card height.
 * The first card row of the table is near the slot row: the home place of a card in that row is about 1.1 card
 * heights below the centre of the slot above it. So a card that the finger lifts and moves a little goes back home,
 * and a card that the finger lets go over a pile still snaps.
 */
const MAGNET_HEIGHTS = 0.8;
/** At the target centre, the magnet moves the card half of the way to the target. */
const MAX_PULL = 0.5;

/** The targets that the drag read at `pointerdown`, and the magnet distance (px) for the size of the card. */
type Magnet = { readonly targets: readonly Target[]; readonly reach: number };

type Piece = { readonly card: HTMLElement; readonly parts: CardParts };
type Near = { readonly target: Target; readonly distance: number };

/** The drag that runs now: its card, and the hold that the shell can stop. */
type Drag = { readonly piece: Piece; readonly holder: Holder };

let active: Drag | undefined;

/** Ends the drag that runs now. The card goes home at once, with no animation (shell.md §3). */
export const cancelDrag = (): void => {
  const drag = active;
  if (!drag) {
    return;
  }
  active = undefined;
  drag.holder.forget();
  stop(drag.piece.card);
  drag.piece.card.style.setProperty('transform', translate3d(ORIGIN));
  drag.piece.card.classList.remove('lifted');
  restPose(drag.piece.parts);
};

/** Finds the nearest target within the magnet distance of `center`. */
const nearest = ({ targets, reach }: Magnet, center: Vec): Near | undefined =>
  targets
    .map((target) => ({ target, distance: Math.hypot(target.at.x - center.x, target.at.y - center.y) }))
    .filter((near) => near.distance <= reach)
    .reduce<Near | undefined>((best, near) => (best && best.distance <= near.distance ? best : near), undefined);

/** Gives the drawn translate. Near a target, the card moves part of the way from the finger to the target. */
const pulled = (home: Vec, magnet: Magnet, raw: Vec): Vec => {
  const center = { x: home.x + raw.x, y: home.y + raw.y };
  const near = nearest(magnet, center);
  if (!near) {
    return raw;
  }
  const pull = MAX_PULL * (1 - near.distance / magnet.reach);
  return { x: raw.x + (near.target.at.x - center.x) * pull, y: raw.y + (near.target.at.y - center.y) * pull };
};

const partsOf = (card: HTMLElement): CardParts => {
  const face = card.querySelector<HTMLElement>('.card-face');
  const shadow = card.querySelector<HTMLElement>('.card-shadow');
  if (!face || !shadow) {
    throw new Error('A .card needs a .card-face and a .card-shadow.');
  }
  return { face, shadow };
};

/** Springs the card back to its place in the layout. The face lands when the card is home. */
const goHome = (piece: Piece, from: Vec, velocity: Vec): void => {
  const spring = springTo(piece.card, { from, to: ORIGIN, velocity }, RETURN);
  land(piece.parts, spring.crossing).catch(canceled);
  spring.animation.finished.then(() => piece.card.classList.remove('lifted'), canceled);
};

/** A wrong drop: a soft shake where the finger let go, then the spring back. */
const reject = (piece: Piece, from: Vec): void => {
  shake(piece.parts).finished.then(() => goHome(piece, from, ORIGIN), canceled);
};

/** Springs the card onto the target with the release speed of the finger. */
const snap = (piece: Piece, move: { from: Vec; to: Vec; velocity: Vec }, landed: () => void): void => {
  piece.card.classList.add('placed');
  const spring = springTo(piece.card, move, LANDING);
  Promise.all([spring.animation.finished, land(piece.parts, spring.crossing)]).then(landed, landed);
};

/** The end of a hold, and the magnet that the drag read at `pointerdown`. */
type LetGo = HoldEnd & { readonly magnet: Magnet };

/** Picks the move after a release: no target in reach, a wrong drop, or a snap. */
const release = (piece: Piece, letGo: LetGo, hooks: Hooks): void => {
  const { hold, raw, at, velocity, magnet } = letGo;
  const near = nearest(magnet, { x: hold.home.x + raw.x, y: hold.home.y + raw.y });
  if (!near) {
    goHome(piece, at, velocity);
    return;
  }
  if (!hooks.drop(near.target.id)) {
    reject(piece, at);
    return;
  }
  const to = { x: near.target.at.x - hold.home.x, y: near.target.at.y - hold.home.y };
  snap(piece, { from: at, to, velocity }, hooks.landed);
};

/** Makes the card draggable with one finger. */
export const draggable = (card: HTMLElement, hooks: Hooks): void => {
  const piece = { card, parts: partsOf(card) };
  let magnet: Magnet = { targets: [], reach: 0 };
  const holder: Holder = pointerHold(card, {
    start: () => {
      lift(piece.parts);
      // The card box has the card height: the transform of the face does not change it.
      magnet = { targets: hooks.targets(), reach: MAGNET_HEIGHTS * card.offsetHeight };
      active = { piece, holder };
    },
    draw: (hold, raw) => pulled(hold.home, magnet, raw),
    end: (end) => {
      // The drag ended, so the shell has nothing to cancel.
      if (active?.piece === piece) {
        active = undefined;
      }
      if (end.letGo) {
        release(piece, { ...end, magnet }, hooks);
        return;
      }
      goHome(piece, end.at, ORIGIN);
    },
  });
};
