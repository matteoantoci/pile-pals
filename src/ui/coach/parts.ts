// The elements of the demo hand: the layer above the board, the hand, and the copy of the card that the hand moves.
// The copy moves, not the card: the drag code owns the transform of each card on the table.

import type { Vec } from '../motion';

/** A demo that runs now. `stop` removes its elements at once, also when the Child touches the screen. */
export type Run = {
  readonly layer: HTMLElement;
  readonly stopped: () => boolean;
  readonly stop: () => void;
  /** Hides the card while its copy shows. `stop` shows it again. */
  readonly hide: (source: HTMLElement) => void;
  /** Keeps a function that puts a card of the board back as it was. `stop` runs it. */
  readonly onStop: (undo: () => void) => void;
};

/** The fingertip of the hand is at 20, 3 in the 48 by 64 box (coach.css puts it on the point of the transform). */
const SHAPES = [
  '<rect x="15" y="3" width="11" height="34" rx="5.5"/>',
  '<rect x="25" y="22" width="10" height="22" rx="5"/>',
  '<rect x="33" y="26" width="9" height="19" rx="4.5"/>',
  '<rect x="4" y="32" width="12" height="17" rx="6" transform="rotate(-35 10 40)"/>',
  '<rect x="10" y="30" width="32" height="31" rx="11"/>',
].join('');

/** The outline goes under the fill, so the shapes look like one hand. The body div presses with a scale. */
const HAND_HTML =
  `<div class="demo-hand-body"><svg viewBox="0 0 48 64" width="48" height="64" aria-hidden="true">` +
  `<g class="demo-hand-line">${SHAPES}</g><g class="demo-hand-fill">${SHAPES}</g></svg></div>`;

/** The card element of the table or of the deck place. */
export const cardOf = (cardId: string): HTMLElement | undefined =>
  document.querySelector<HTMLElement>(`[data-card="${CSS.escape(cardId)}"]`) ?? undefined;

/**
 * The pile box: the drop target of the card that goes on it. The pile face rests at a smaller scale from its bottom
 * edge, so the centre of the face box is lower than the place of a card on the pile.
 */
export const pileOf = (pileId: string): HTMLElement | undefined =>
  document.querySelector<HTMLElement>(`[data-pile="${CSS.escape(pileId)}"]`) ?? undefined;

/** The deck that the Child taps. */
export const deckOf = (): HTMLElement | undefined => document.querySelector<HTMLElement>('.deck') ?? undefined;

/** The centre of an element on the screen. */
export const centreOf = (el: Element): Vec => {
  const box = el.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

/**
 * A new run with its own layer inside the board, so the card sizes of the board apply to the copy.
 * `stop` stops the animations of the run, removes its elements, shows the card again, and puts back the cards that
 * the run changed. A second `stop` puts back no card: the board can change a card after the first one.
 */
export const newRun = (): Run => {
  const layer = document.createElement('div');
  layer.className = 'demo';
  layer.setAttribute('aria-hidden', 'true');
  (document.querySelector('.board') ?? document.body).append(layer);
  let stopped = false;
  let hidden: HTMLElement | undefined;
  let undos: readonly (() => void)[] = [];
  const stop = (): void => {
    stopped = true;
    for (const animation of layer.getAnimations({ subtree: true })) {
      animation.cancel();
    }
    layer.remove();
    hidden?.classList.remove('demo-source');
    const now = undos;
    undos = [];
    for (const undo of now) {
      undo();
    }
  };
  const hide = (source: HTMLElement): void => {
    hidden = source;
    source.classList.add('demo-source');
  };
  const onStop = (undo: () => void): void => {
    undos = [...undos, undo];
  };
  return { layer, stopped: () => stopped, stop, hide, onStop };
};

/** The hand: `.demo-hand` moves with `translate3d`, and its body presses with a scale. */
export const handOf = (run: Run): { readonly hand: HTMLElement; readonly body: HTMLElement } => {
  const hand = document.createElement('div');
  hand.className = 'demo-hand';
  hand.innerHTML = HAND_HTML;
  run.layer.append(hand);
  const body = hand.querySelector<HTMLElement>('.demo-hand-body') ?? hand;
  return { hand, body };
};

/** A copy of the card, centred on the card. The card hides, so the Child sees one card that moves. */
export const copyOf = (run: Run, source: HTMLElement): HTMLElement | undefined => {
  const copy = source.cloneNode(true);
  if (!(copy instanceof HTMLElement)) {
    return undefined;
  }
  const at = centreOf(source);
  copy.removeAttribute('data-card');
  copy.className = source.classList.contains('anchor') ? 'card anchor demo-card' : 'card demo-card';
  copy.style.setProperty('left', `${String(at.x)}px`);
  copy.style.setProperty('top', `${String(at.y)}px`);
  copy.style.setProperty('transform', 'translate3d(0px, 0px, 0)');
  run.layer.append(copy);
  run.hide(source);
  return copy;
};
