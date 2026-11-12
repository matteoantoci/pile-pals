// The screen check of the smoke run (scripts/smoke.ts), spec "Board layout" and Testing Decisions. On the screen of
// the smallest phone, every card, slot, the deck, the home button, and the hint bulb of a level is inside the screen,
// and the board is one grid. The run also taps the hint bulb and the home button (spec, "Top bar and hint button").

import { runnerImport } from 'vite';
import type { GameState, hintFor, snapshot, start } from '../src/model/index.ts';
import type { Browser, Page } from 'puppeteer-core';

/** The smallest phone screen of the spec, in CSS px. */
const PHONE = { width: 356, height: 764 };
/** The levels of the check (spec, Testing Decisions). */
const LEVELS = [1, 11, 16, 30];
/** The check looks at these seeds and uses the one with the most groups, because it has the most cards. */
const SEEDS = 50;
/** The deal that was below the bottom edge of the old board. */
const OVERFLOW = { level: 20, seed: 12345 };
/** The buttons of the board: the home button and the hint bulb. */
const BUTTONS = '.board .home-button, .board .hint-bulb';

type Deal = { readonly level: number; readonly seed: number };

/** The browser, the address of the app, and the way to report a check. */
type Run = {
  readonly browser: Browser;
  readonly url: string;
  readonly check: (name: string, pass: boolean, detail?: string) => void;
};

/** The game model, loaded from the source by Vite, so that the run can deal any level. */
const { module: model } = await runnerImport<{
  start: typeof start;
  snapshot: typeof snapshot;
  hintFor: typeof hintFor;
}>('/src/model/index.ts');

const wait = (ms: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
};

/** A touch tap on the centre of the element. Gives false when the element is not on the page. */
const tap = async (page: Page, selector: string): Promise<boolean> => {
  const box = await (await page.$(selector))?.boundingBox();
  if (box) {
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  }
  return box !== undefined && box !== null;
};

/** The deal of the level with the most groups, and so with the most cards. */
const fullestDeal = (level: number): Deal => {
  const groups = (seed: number): number => model.start({ level }, seed).piles.length;
  const seeds = Array.from({ length: SEEDS }, (_, index) => index + 1);
  return { level, seed: seeds.reduce((best, seed) => (groups(seed) > groups(best) ? seed : best)) };
};

/**
 * The number of cards, slots, decks, and buttons on the board, the number of buttons, and the classes of the ones
 * that are not inside the screen.
 */
const offScreen = (page: Page): Promise<{ places: number; buttons: number; outside: string[] }> =>
  page.evaluate(
    (screen, buttons) => {
      const places = [...document.querySelectorAll(`.board .card, .board .pile-face, .board .deck, ${buttons}`)];
      const outside = places.filter((el) => {
        const box = el.getBoundingClientRect();
        return box.left < 0 || box.top < 0 || box.right > screen.width || box.bottom > screen.height;
      });
      return {
        places: places.length,
        buttons: document.querySelectorAll(buttons).length,
        outside: outside.map((el) => el.className),
      };
    },
    PHONE,
    BUTTONS
  );

/**
 * True when the board is one grid: slot i is above column i, and the deck is at the top right, above the slots.
 * The callback runs in the page, so it holds all its code.
 */
const onGrid = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const slots = [...document.querySelectorAll('.board .pile-face')].map((el) => el.getBoundingClientRect());
    const columns = [...document.querySelectorAll('.board .stack')].map((el) => el.getBoundingClientRect());
    const deck = document.querySelector('.board .deck')?.getBoundingClientRect();
    const slotsOnColumns = slots.every((slot, index) => {
      const column = columns[index];
      return column === undefined || Math.abs(slot.left + slot.right - column.left - column.right) < 2;
    });
    const right = Math.max(...columns.map((column) => column.right));
    return (
      slotsOnColumns &&
      (deck === undefined || (Math.abs(deck.right - right) < 1 && slots.every((slot) => deck.bottom <= slot.top)))
    );
  });

/** What the Child sees of the level: the level number, and each card of the board with its face and place. */
const table = (page: Page): Promise<string> =>
  page.evaluate(() =>
    JSON.stringify({
      level: document.querySelector('.level-number')?.textContent,
      cards: [...document.querySelectorAll<HTMLElement>('.board [data-card]')].map(
        (el) => `${el.dataset['card'] ?? ''} ${el.dataset['face'] ?? ''} ${String(el.classList.contains('gone'))}`
      ),
    })
  );

type Level = { readonly page: Page; readonly state: GameState; readonly name: string };

/** A tap on the bulb hops the card of the hint, or the deck. */
const bulbCheck = async ({ check }: Run, { page, state, name }: Level): Promise<void> => {
  const move = model.hintFor(state);
  const target = move?.type === 'tapDeck' ? '.board .deck' : `.board [data-card="${move?.cardId ?? ''}"] .card-face`;
  const tapped = await tap(page, '.board .hint-bulb');
  await wait(150);
  // The hop is a running animation on the element of the hint.
  const hopped = await page.evaluate(
    (selector) =>
      document
        .querySelector(selector)
        ?.getAnimations()
        .some((animation) => animation.playState === 'running') === true,
    target
  );
  check(`${name}: the bulb hops the hint`, tapped && move !== undefined && hopped, target);
};

/** Home goes to the title scene, and the go button opens the same level with the same table. */
const homeCheck = async ({ check }: Run, { page, name }: Level): Promise<void> => {
  // A deck tap changes the level before home, when the level has a deck.
  if (await tap(page, '.board .deck')) {
    await wait(600);
  }
  const before = await table(page);
  await tap(page, '.board .home-button');
  await wait(800);
  const title = (await page.$('.title .go-button')) !== null && (await page.$('.board')) === null;
  await tap(page, '.title .go-button');
  await page.waitForSelector('.board .pile-face', { timeout: 3000 }).catch(() => undefined);
  const after = await table(page);
  check(`${name}: home shows the title scene`, title);
  check(`${name}: go opens the same level`, title && before === after, after.slice(0, 60));
};

/** Opens the saved deal on the phone screen, in a new browser context, and checks the places of the board. */
const screenCheck = async (run: Run, deal: Deal): Promise<void> => {
  const { browser, url, check } = run;
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.setViewport({ ...PHONE, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    // The save goes in before the app starts. A reload after it would save the old level over it.
    // Every demo is seen, so that no demo hand moves a card.
    const state = { ...model.start({ level: deal.level }, deal.seed), demos: ['first', 'deck', 'anchor'] as const };
    await page.evaluateOnNewDocument(
      (save) => {
        localStorage.setItem('pile-pals:save', save);
      },
      JSON.stringify(model.snapshot(state))
    );
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.board .pile-face');
    const { places, buttons, outside } = await offScreen(page);
    const name = `level ${String(deal.level)} (seed ${String(deal.seed)})`;
    check(
      `${name}: all inside the screen`,
      places > 0 && buttons === 2 && outside.length === 0,
      `${String(places)} places, ${String(buttons)} buttons, outside: ${outside.join(', ') || 'none'}`
    );
    check(`${name}: slots and columns on one grid, the deck at the top right`, await onGrid(page));
    // A restored level can show the go button of the sound gate over the board.
    await tap(page, '.sound-gate .go-button');
    await wait(300);
    await bulbCheck(run, { page, state, name });
    await homeCheck(run, { page, state, name });
  } finally {
    await context.close();
  }
};

/** Checks the levels of the spec, and the deal of the old overflow, one after the other. */
export const screenChecks = (run: Run): Promise<void> =>
  [...LEVELS.map(fullestDeal), OVERFLOW].reduce<Promise<void>>(
    (before, deal) => before.then(() => screenCheck(run, deal)),
    Promise.resolve()
  );
