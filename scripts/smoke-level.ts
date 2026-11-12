// The level parts of the smoke run (scripts/smoke.ts): the game model, and a level that opens from a save on a phone
// screen. The screen checks (scripts/smoke-screen.ts) and the drop magnet check (scripts/smoke-nudge.ts) use them.

import { runnerImport } from 'vite';
import type { apply, dropCard, GameState, hintFor, snapshot, start } from '../src/model/index.ts';
import type { Browser, BrowserContext, Page } from 'puppeteer-core';

/** The smallest phone screen of the spec, in CSS px. */
export const PHONE = { width: 356, height: 764 };
/** A check that looks for a deal looks at the deals of these seeds. */
export const SEEDS = 50;

/** The browser, the address of the app, and the way to report a check. */
export type Run = {
  readonly browser: Browser;
  readonly url: string;
  readonly check: (name: string, pass: boolean, detail?: string) => void;
};

/** The game model, loaded from the source by Vite, so that the run can deal any level. */
export const { module: model } = await runnerImport<{
  start: typeof start;
  snapshot: typeof snapshot;
  hintFor: typeof hintFor;
  apply: typeof apply;
  dropCard: typeof dropCard;
}>('/src/model/index.ts');

/**
 * Opens the level on a phone screen of the width, in a new browser context. Every demo is seen, so that no demo hand
 * moves a card. The caller closes the context.
 */
export const openLevel = async (
  { browser, url }: Run,
  width: number,
  state: GameState
): Promise<{ readonly context: BrowserContext; readonly page: Page }> => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width, height: PHONE.height, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  // The save goes in before the app starts. A reload after it would save the old level over it.
  await page.evaluateOnNewDocument(
    (save) => {
      localStorage.setItem('pile-pals:save', save);
    },
    JSON.stringify(model.snapshot({ ...state, demos: ['first', 'deck', 'anchor'] }))
  );
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.board .pile-face');
  return { context, page };
};
