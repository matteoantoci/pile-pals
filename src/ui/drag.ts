// The drag of one card. Rules from research/native-feel/motion.md:
// - pointermove writes the transform of `.card` directly. No requestAnimationFrame, no framework state.
// - The card has `touch-action: none` (styles.css) and takes the pointer with setPointerCapture.
// - All other motion goes through ./motion: WAAPI on `transform` and `opacity` only.
// - The drag knows no game rule. `Hooks.drop` asks the model.

import { freeze, land, LANDING, lift, releaseVelocity, RETURN, shake, springTo, translate3d } from './motion';
import type { CardParts, Sample, Vec } from './motion';

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

/** The magnet pulls the card when its centre is this near (px) to the centre of a target. */
const MAGNET_PX = 120;
/** At the target centre, the magnet moves the card half of the way to the target. */
const MAX_PULL = 0.5;
const SAMPLES = 8;
const ORIGIN: Vec = { x: 0, y: 0 };

type Piece = { readonly card: HTMLElement; readonly parts: CardParts };
type Near = { readonly target: Target; readonly distance: number };

/** A held card. `grab` is the finger minus the translate. `home` is the card centre at translate 0. */
type Hold = { readonly pointer: number; readonly grab: Vec; readonly home: Vec; readonly targets: readonly Target[] };

/** A canceled animation rejects its `finished` promise. The next drag then owns the card. */
const canceled = (): void => undefined;

/** Finds the nearest target within the magnet distance of `center`. */
const nearest = (targets: readonly Target[], center: Vec): Near | undefined =>
  targets
    .map((target) => ({ target, distance: Math.hypot(target.at.x - center.x, target.at.y - center.y) }))
    .filter((near) => near.distance <= MAGNET_PX)
    .reduce<Near | undefined>((best, near) => (best && best.distance <= near.distance ? best : near), undefined);

/** Gives the drawn translate. Near a target, the card moves part of the way from the finger to the target. */
const pulled = (hold: Hold, raw: Vec): Vec => {
  const center = { x: hold.home.x + raw.x, y: hold.home.y + raw.y };
  const near = nearest(hold.targets, center);
  if (!near) {
    return raw;
  }
  const pull = MAX_PULL * (1 - near.distance / MAGNET_PX);
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

/** The card where the finger let go: the hold, the finger translate, the drawn translate, and the release speed. */
type LetGo = { readonly hold: Hold; readonly raw: Vec; readonly at: Vec; readonly velocity: Vec };

/** Picks the move after a release: no target in reach, a wrong drop, or a snap. */
const release = (piece: Piece, letGo: LetGo, hooks: Hooks): void => {
  const { hold, raw, at, velocity } = letGo;
  const near = nearest(hold.targets, { x: hold.home.x + raw.x, y: hold.home.y + raw.y });
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

/** Lifts the card under the finger. Returns the hold and the translate where the card was. */
const pickUp = (piece: Piece, event: PointerEvent, targets: readonly Target[]): { hold: Hold; from: Vec } => {
  const { card } = piece;
  const from = freeze(card);
  lift(piece.parts);
  card.setPointerCapture(event.pointerId);
  card.classList.add('lifted');
  const box = card.getBoundingClientRect();
  const home = { x: box.left + box.width / 2 - from.x, y: box.top + box.height / 2 - from.y };
  const grab = { x: event.clientX - from.x, y: event.clientY - from.y };
  return { hold: { pointer: event.pointerId, grab, home, targets }, from };
};

/** Makes the card draggable with one finger. */
export const draggable = (card: HTMLElement, hooks: Hooks): void => {
  const piece = { card, parts: partsOf(card) };
  let hold: Hold | undefined;
  let raw = ORIGIN;
  let at = ORIGIN;
  let samples: Sample[] = [];

  const end = (event: PointerEvent): Hold | undefined => {
    const ended = event.pointerId === hold?.pointer ? hold : undefined;
    hold = ended ? undefined : hold;
    return ended;
  };

  card.addEventListener('pointerdown', (event) => {
    if (hold) {
      return;
    }
    const picked = pickUp(piece, event, hooks.targets());
    hold = picked.hold;
    raw = picked.from;
    at = picked.from;
    samples = [{ t: event.timeStamp, ...at }];
  });

  card.addEventListener('pointermove', (event) => {
    if (!hold || event.pointerId !== hold.pointer) {
      return;
    }
    raw = { x: event.clientX - hold.grab.x, y: event.clientY - hold.grab.y };
    at = pulled(hold, raw);
    samples = [...samples.slice(1 - SAMPLES), { t: event.timeStamp, ...at }];
    card.style.setProperty('transform', translate3d(at));
  });

  card.addEventListener('pointerup', (event) => {
    const ended = end(event);
    if (ended) {
      release(piece, { hold: ended, raw, at, velocity: releaseVelocity(samples, event.timeStamp) }, hooks);
    }
  });

  card.addEventListener('pointercancel', (event) => {
    if (end(event)) {
      goHome(piece, at, ORIGIN);
    }
  });
};
