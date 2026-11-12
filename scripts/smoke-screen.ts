// The screen check of the smoke run (scripts/smoke.ts), spec "Board layout" and Testing Decisions. On the screen of
// the smallest phone, every card, slot, and the deck of a level is inside the screen, and the board is one grid.

import { runnerImport } from 'vite';
import type { snapshot, start } from '../src/model/index.ts';
import type { Browser, Page } from 'puppeteer-core';

/** The smallest phone screen of the spec, in CSS px. */
const PHONE = { width: 356, height: 764 };
/** The levels of the check (spec, Testing Decisions). */
const LEVELS = [1, 11, 16, 30];
/** The check looks at these seeds and uses the one with the most groups, because it has the most cards. */
const SEEDS = 50;
/** The deal that was below the bottom edge of the old board. */
const OVERFLOW = { level: 20, seed: 12345 };

type Deal = { readonly level: number; readonly seed: number };

/** The browser, the address of the app, and the way to report a check. */
type Run = {
  readonly browser: Browser;
  readonly url: string;
  readonly check: (name: string, pass: boolean, detail?: string) => void;
};

/** The game model, loaded from the source by Vite, so that the run can deal any level. */
const { module: model } = await runnerImport<{ start: typeof start; snapshot: typeof snapshot }>('/src/model/index.ts');

/** The deal of the level with the most groups, and so with the most cards. */
const fullestDeal = (level: number): Deal => {
  const groups = (seed: number): number => model.start({ level }, seed).piles.length;
  const seeds = Array.from({ length: SEEDS }, (_, index) => index + 1);
  return { level, seed: seeds.reduce((best, seed) => (groups(seed) > groups(best) ? seed : best)) };
};

/** The number of cards, slots, and decks on the board, and the classes of the ones that are not inside the screen. */
const offScreen = (page: Page): Promise<{ places: number; outside: string[] }> =>
  page.evaluate((screen) => {
    const places = [...document.querySelectorAll('.board .card, .board .pile-face, .board .deck')];
    const outside = places.filter((el) => {
      const box = el.getBoundingClientRect();
      return box.left < 0 || box.top < 0 || box.right > screen.width || box.bottom > screen.height;
    });
    return { places: places.length, outside: outside.map((el) => el.className) };
  }, PHONE);

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

/** Opens the saved deal on the phone screen, in a new browser context, and checks the places of the board. */
const screenCheck = async ({ browser, url, check }: Run, deal: Deal): Promise<void> => {
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
    const { places, outside } = await offScreen(page);
    const name = `level ${String(deal.level)} (seed ${String(deal.seed)})`;
    check(
      `${name}: all inside the screen`,
      places > 0 && outside.length === 0,
      `${String(places)} places, outside: ${outside.join(', ') || 'none'}`
    );
    check(`${name}: slots and columns on one grid, the deck at the top right`, await onGrid(page));
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
