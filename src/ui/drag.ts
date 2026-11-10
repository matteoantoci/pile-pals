// The drag of one card. Rules from research/native-feel/motion.md:
// - pointermove writes the transform directly. No requestAnimationFrame, no framework state.
// - The card has `touch-action: none` (styles.css) and takes the pointer with setPointerCapture.
// - Other motion uses WAAPI `element.animate()` on transform only.

type Point = { readonly x: number; readonly y: number };

/** Returns true when the card stays where it is, false when the card must go back. */
export type Release = (center: Point) => boolean;

const HOME = 'translate3d(0px, 0px, 0)';
const RETURN_MS = 250;
const RETURN_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

const translate = (p: Point): string => `translate3d(${String(p.x)}px, ${String(p.y)}px, 0)`;

/** Stops a running animation and keeps the card at its current position. */
const freeze = (card: HTMLElement): Point => {
  const matrix = new DOMMatrixReadOnly(getComputedStyle(card).transform);
  for (const animation of card.getAnimations()) {
    animation.cancel();
  }
  const at = { x: matrix.m41, y: matrix.m42 };
  card.style.setProperty('transform', translate(at));
  return at;
};

const center = (card: HTMLElement): Point => {
  const box = card.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

/** Moves the card back to its place in the layout. */
export const sendBack = (card: HTMLElement): void => {
  const from = card.style.transform || HOME;
  card.style.setProperty('transform', HOME);
  card.animate([{ transform: from }, { transform: HOME }], { duration: RETURN_MS, easing: RETURN_EASING });
};

/** Makes the card draggable with one finger. */
export const draggable = (card: HTMLElement, release: Release): void => {
  let pointer: number | undefined;
  let grab: Point = { x: 0, y: 0 };

  const end = (event: PointerEvent): boolean => {
    if (event.pointerId !== pointer) {
      return false;
    }
    pointer = undefined;
    card.classList.remove('lifted');
    return true;
  };

  card.addEventListener('pointerdown', (event) => {
    if (pointer !== undefined) {
      return;
    }
    const at = freeze(card);
    pointer = event.pointerId;
    grab = { x: event.clientX - at.x, y: event.clientY - at.y };
    card.setPointerCapture(event.pointerId);
    card.classList.add('lifted');
  });

  card.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointer) {
      card.style.setProperty('transform', translate({ x: event.clientX - grab.x, y: event.clientY - grab.y }));
    }
  });

  card.addEventListener('pointerup', (event) => {
    if (end(event) && !release(center(card))) {
      sendBack(card);
    }
  });

  card.addEventListener('pointercancel', (event) => {
    if (end(event)) {
      sendBack(card);
    }
  });
};
