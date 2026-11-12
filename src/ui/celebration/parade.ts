import { palSize } from '../../model';
import { playPal } from '../../sound';
import { canceled, facePose, ORIGIN, REST_SCALE, settle, translate3d } from '../motion';
import { animationUrl, stillUrl } from '../pictures';
import { animationLimiter } from './limits';
import { wait } from './wait';
import type { Card, Pile } from '../../model';
import type { Frame } from '../motion';

// The parade of a completed group (research/native-feel/motion.md, "Starting values for each moment").
// The cards of the group leave the pile and walk off the right edge of the screen. A card with an animated
// twin plays its loop and its pal sound during the walk, in a slot of the animation limiter.
// The parade cards are copies in a layer above the board. When the copies start, the pile hides its cards
// (`.paraded`), so the group leaves the table. The model state does not change.

/** The walk of one card to the right edge. */
const WALK_MS = 900;
/** A card starts its walk this long after the card before it. */
const STAGGER_MS = 90;
const WALK_EASING = 'cubic-bezier(0.4, 0, 1, 1)';
/** The bob of a walking face. */
const BOB_MS = 180;
const BOB_ROUNDS = 5;
const BOB: readonly Frame[] = [
  { transform: facePose({ rotate: -6, scale: REST_SCALE }) },
  { transform: facePose({ y: -4, rotate: 0, scale: REST_SCALE }) },
  { transform: facePose({ rotate: 6, scale: REST_SCALE }) },
];

/** One card in the parade: its copy on the board, its face, its picture, and its start delay. */
type Piece = {
  readonly card: Card;
  readonly el: HTMLElement;
  readonly face: HTMLElement;
  readonly img: HTMLImageElement;
  readonly delay: number;
};

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

const boardOf = (): HTMLElement | undefined => document.querySelector<HTMLElement>('.board') ?? undefined;

/** The pile element of one group on the board. */
const pileOf = (pileId: string): HTMLElement | undefined => {
  const pile = boardOf()?.querySelector<HTMLElement>(`[data-pile="${CSS.escape(pileId)}"]`);
  return pile ?? undefined;
};

/** The layer of the parade. It sits inside the board, so the card sizes of the board apply to it. */
const layerOf = (host: HTMLElement): HTMLElement => {
  const existing = host.querySelector<HTMLElement>('.parade');
  if (existing) {
    return existing;
  }
  const layer = document.createElement('div');
  layer.className = 'parade';
  layer.setAttribute('aria-hidden', 'true');
  host.append(layer);
  return layer;
};

/** Where one copy starts and when its walk starts. */
type Seat = { readonly place: DOMRect; readonly delay: number };

/** Makes the copy of one card, centred on its place on the pile. */
const pieceOf = (layer: HTMLElement, card: Card, seat: Seat): Piece => {
  const el = document.createElement('div');
  el.className = 'card parade-card';
  el.style.setProperty('left', `${String(seat.place.left + seat.place.width / 2)}px`);
  el.style.setProperty('top', `${String(seat.place.top + seat.place.height / 2)}px`);
  const shadow = document.createElement('div');
  shadow.className = 'card-shadow';
  const face = document.createElement('div');
  face.className = 'card-face';
  const img = document.createElement('img');
  img.src = stillUrl(card.picture);
  img.alt = '';
  face.append(img);
  el.append(shadow, face);
  layer.append(el);
  return { card, el, face, img, delay: seat.delay };
};

/** The animated walk of a piece, or a resolved promise when the picture has no animated twin. */
const animationOf = (piece: Piece): Promise<void> => {
  const src = animationUrl(piece.card.picture);
  const { img, card } = piece;
  if (src === undefined) {
    return Promise.resolve();
  }
  const play = (): Promise<void> =>
    animationLimiter.run(async () => {
      img.src = src;
      playPal(card.picture, palSize(card.picture));
      await wait(WALK_MS);
    });
  return wait(piece.delay).then(play);
};

/** Walks one card off the right edge. The promise resolves when the copy is gone. */
const walk = (piece: Piece): Promise<void> => {
  const remove = (): void => {
    piece.el.remove();
  };
  const off = { x: window.innerWidth + piece.el.offsetWidth, y: 0 };
  const walkAnimation = settle(piece.el, [{ transform: translate3d(ORIGIN) }, { transform: translate3d(off) }], {
    duration: WALK_MS,
    delay: piece.delay,
    easing: WALK_EASING,
    fill: 'backwards',
  });
  piece.face.animate([...BOB], {
    duration: BOB_MS,
    delay: piece.delay,
    direction: 'alternate',
    iterations: BOB_ROUNDS,
    easing: 'ease-in-out',
  });
  return Promise.all([walkAnimation.finished.then(remove, remove), animationOf(piece)]).then(() => undefined);
};

/** Makes one piece for each card of the group and starts the walks together. */
const walkGroup = (pile: Pile): Promise<void> => {
  const element = pileOf(pile.id);
  const host = boardOf();
  if (host === undefined || element === undefined) {
    return Promise.resolve();
  }
  // The group cards are under the category card, so the copies start on it. A copy has the size of a card box: it
  // starts on the pile box, because the pile face rests at a smaller scale from its bottom edge.
  const place = element.getBoundingClientRect();
  const layer = layerOf(host);
  const pieces = pile.cards.map((card, index) => pieceOf(layer, card, { place, delay: index * STAGGER_MS }));
  element.classList.add('paraded');
  return Promise.all(pieces.map(walk)).then(() => undefined);
};

/**
 * The parade of a completed group. Call it after the state shows the last card on the pile.
 * A copy of each card walks off the right edge with a stagger of 90 ms, and each pal plays its
 * animation and its sound when its turn comes.
 */
export const parade = (pile: Pile): void => {
  nextFrame()
    .then(() => walkGroup(pile))
    .catch(canceled);
};
