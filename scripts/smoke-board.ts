// The checks of the board parts of the smoke run (scripts/smoke-screen.ts), ticket 08. The crown of a category card
// and the faint crown of an empty slot are centred on the top edge of the card. A crown covers no picture, no dot, and
// no part of the top bar. A face-down card shows no crown, and a held card goes over the crowns. The board has no hint
// bulb: with no action, the coach hops the hint.

import type { Page } from 'puppeteer-core';

/** The time with no action before the coach hops the hint (src/ui/coach/index.ts). */
const IDLE_MS = 5000;
/** The smallest space between a crown and the top bar, in CSS px. */
const CROWN_GAP = 8;

type Point = { readonly x: number; readonly y: number };
/** The page of a level, the name of the level, and the way to report a check. */
type Probe = {
  readonly page: Page;
  readonly name: string;
  readonly check: (name: string, pass: boolean, detail?: string) => void;
};
/** The left, top, right, and bottom edges of an element on the screen. */
type Box = readonly [number, number, number, number];
/** A crown, as the page gives it: the box of the crown and of the face of its card. */
type Crown = {
  readonly name: string;
  readonly faceDown: boolean;
  readonly shows: boolean;
  readonly box: Box;
  readonly face: Box;
};
type Crowns = { readonly crowns: Crown[]; readonly pictures: Box[]; readonly bar: Box[] };

const wait = (ms: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
};

/** The centre of the element, or undefined when the element is not on the page. */
const centre = async (page: Page, selector: string): Promise<Point | undefined> => {
  const box = await (await page.$(selector))?.boundingBox();
  return box ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : undefined;
};

/** True when the two boxes are nearer than `space`. */
const meet = ([left, top, right, bottom]: Box, [left2, top2, right2, bottom2]: Box, space: number): boolean =>
  left < right2 + space && left2 < right + space && top < bottom2 + space && top2 < bottom + space;

/** The boxes of the visible elements. It runs in the page, so it holds all its code. */
const boxesOf = (selector: string): Box[] =>
  [...document.querySelectorAll(selector)]
    .filter((el) => getComputedStyle(el).visibility === 'visible')
    .map((el) => el.getBoundingClientRect())
    .map(({ left, top, right, bottom }): Box => [left, top, right, bottom]);

/** The crowns of the board. It runs in the page, so it holds all its code. */
const crownsOf = (): Crown[] =>
  [...document.querySelectorAll('.board .crown')].map((crown) => {
    const box = crown.getBoundingClientRect();
    const face = crown.closest('.card-face, .pile-face')?.getBoundingClientRect() ?? new DOMRect();
    const owner = crown.closest<HTMLElement>('[data-card], [data-pile]');
    return {
      name: owner?.dataset['card'] ?? `slot ${owner?.dataset['pile'] ?? ''}`,
      faceDown: crown.closest('[data-face="down"]') !== null,
      shows: getComputedStyle(crown).visibility === 'visible',
      box: [box.left, box.top, box.right, box.bottom],
      face: [face.left, face.top, face.right, face.bottom],
    };
  });

/** The problems of one crown that shows on a face-up card or on a slot. */
const placeProblems = (crown: Crown, { pictures, bar }: Crowns): (string | false)[] => {
  const [left, top, right, bottom] = crown.box;
  const [faceLeft, faceTop, faceRight] = crown.face;
  const width = (right - left) / (faceRight - faceLeft);
  return [
    !crown.shows && 'does not show',
    Math.abs(left + right - faceLeft - faceRight) > 2 && 'not centred',
    Math.abs((top + bottom) / 2 - faceTop) > (bottom - top) * 0.2 && 'not on the top edge',
    (width < 0.4 || width > 0.5) && `width ${width.toFixed(2)} of the card`,
    pictures.some((other) => meet(crown.box, other, 0)) && 'covers a picture or a dot',
    bar.some((other) => meet(crown.box, other, CROWN_GAP)) && 'too near the top bar',
  ];
};

/**
 * Checks the crowns. A crown is centred on the top edge of its card, about 45% of the card width, and covers no
 * picture, no dot, and no part of the top bar. A face-down card shows no crown.
 */
export const crownCheck = async ({ page, name, check }: Probe): Promise<void> => {
  const read: Crowns = {
    crowns: await page.evaluate(crownsOf),
    pictures: await page.evaluate(boxesOf, '.board img, .board .dot'),
    bar: await page.evaluate(boxesOf, '.top-bar > *'),
  };
  const problems = read.crowns.flatMap((crown) =>
    (crown.faceDown ? [crown.shows && 'shows on a face-down card'] : placeProblems(crown, read)).flatMap((problem) =>
      problem === false ? [] : [`crown of ${crown.name}: ${problem}`]
    )
  );
  check(
    `${name}: crowns on the top edge, clear of pictures, dots, and the top bar`,
    problems.length === 0,
    problems.join('; ')
  );
};

/** True when the element has a running animation. It runs in the page, so it holds all its code. */
const running = (selector: string): boolean =>
  document
    .querySelector(selector)
    ?.getAnimations()
    .some((animation) => animation.playState === 'running') === true;

/** With no action, the coach hops the element of the hint (a card face or the deck) after its idle time. */
export const hopCheck = async ({ page, name, check }: Probe, hint: string): Promise<void> => {
  const since = Date.now();
  // The hop is a running animation on the element of the hint.
  const hopped = await page.waitForFunction(running, { polling: 50, timeout: IDLE_MS + 2000 }, hint).then(
    () => true,
    () => false
  );
  const after = Date.now() - since;
  check(
    `${name}: the hint hops after a time with no action`,
    hopped && after > IDLE_MS - 1000,
    `${hint} ${String(after)} ms`
  );
};

/** True when the top element at the point is inside a held card. Crowns take no touch, so the check turns it on. */
const heldAt = (page: Page, point: Point): Promise<boolean> =>
  page.evaluate(({ x, y }) => {
    const style = document.head.appendChild(document.createElement('style'));
    style.textContent = '.crown, .crown * { pointer-events: auto !important; }';
    const held = document.elementFromPoint(x, y)?.closest('.card.lifted');
    style.remove();
    return held !== null && held !== undefined;
  }, point);

/**
 * True when a held card goes over the crowns: the finger holds the top card of the first column over the crown of the
 * first slot, and then puts it back.
 */
export const heldOverCrown = async (page: Page): Promise<boolean> => {
  const from = await centre(page, '.table .stack:first-child .card-place:last-child .card');
  const to = await centre(page, '.board .pile .crown');
  if (!from || !to) {
    return false;
  }
  const half = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  await page.touchscreen.touchStart(from.x, from.y);
  await page.touchscreen.touchMove(half.x, half.y);
  await wait(30);
  await page.touchscreen.touchMove(to.x, to.y);
  await wait(30);
  const over = await heldAt(page, to);
  await page.touchscreen.touchMove(from.x, from.y);
  await page.touchscreen.touchEnd();
  await wait(800);
  return over;
};
