// The drop magnet check of the smoke run (scripts/smoke.ts), spec "Board layout". The first card row of the table is
// near the slot row. On phones of some widths, a card of the first row that the finger lifts, moves a little, and lets
// go goes back home: the slot above it does not take it.

import { model, openLevel, SEEDS } from './smoke-level.ts';
import { centre, tap, wait } from './smoke-page.ts';
import type { GameState } from '../src/model/index.ts';
import type { Run } from './smoke-level.ts';
import type { Page } from 'puppeteer-core';

/** The phone widths of the check, in CSS px: the old magnet of 120 px took a nudged card at these widths. */
const WIDTHS = [350, 356, 375];
/** The level of the check: 4 columns of 2 cards, and no deck (difficulty table). */
const LEVEL = 3;
/** The finger moves the card up by this distance (px), and then lets go. */
const NUDGE_PX = 8;
/** The card of the first row, in the first column. */
const CARD = '.table .stack:first-child .card';

/**
 * A level with one card in the first column, in the first row of the table, below the first slot. The card belongs
 * to the group of that slot, so a drop on the slot snaps and the pile shows one more full dot.
 */
const nudgeLevel = (): GameState => {
  const states = Array.from({ length: SEEDS }, (_, index) => model.start({ level: LEVEL }, index + 1));
  const moved = states.flatMap((state) => {
    const cards = state.table.at(0)?.cards ?? [];
    const below = cards.at(0);
    const top = cards.at(1);
    const pile = state.piles.find((item) => item.group === top?.group);
    const fits = below !== undefined && below.group === state.piles.at(0)?.group;
    return top && pile && fits ? [model.apply(state, model.dropCard(top.id, pile.id)).state] : [];
  });
  const first = moved.at(0);
  if (!first) {
    throw new Error(`No seed of level ${String(LEVEL)} gives the deal of the drop magnet check.`);
  }
  return first;
};

/** The state of the first-row card and of the pile above it, as the Child sees it. */
const nudgeState = (page: Page): Promise<string> =>
  page.evaluate((card) => {
    const el = document.querySelector(card);
    const dots = document.querySelectorAll('.board .pile:first-child .dot.full').length;
    const classes = ['gone', 'placed', 'lifted'].filter((name) => el?.classList.contains(name));
    return `${String(dots)} full dots, card ${classes.join(' ') || 'at rest'}`;
  }, CARD);

/** The finger lifts the card, moves it up by NUDGE_PX, and lets go. Gives the state before and after. */
const nudge = async (page: Page): Promise<{ readonly pass: boolean; readonly detail: string }> => {
  await tap(page, '.sound-gate .go-button');
  await wait(400);
  const from = await centre(page, CARD);
  const before = await nudgeState(page);
  if (!from) {
    return { pass: false, detail: 'no card in the first row' };
  }
  await page.touchscreen.touchStart(from.x, from.y);
  await page.touchscreen.touchMove(from.x, from.y - NUDGE_PX / 2);
  await page.touchscreen.touchMove(from.x, from.y - NUDGE_PX);
  await page.touchscreen.touchEnd();
  await wait(1200);
  const after = await nudgeState(page);
  return { pass: before === after && after.endsWith('at rest'), detail: `${before} -> ${after}` };
};

/** The nudged card of the first row goes back home on a phone screen of the width. */
const nudgeCheck = async (run: Run, width: number, state: GameState): Promise<void> => {
  const { context, page } = await openLevel(run, width, state);
  try {
    const { pass, detail } = await nudge(page);
    run.check(`drop magnet at ${String(width)} px: a nudged first-row card goes home`, pass, detail);
  } finally {
    await context.close();
  }
};

/** Checks the drop magnet at each width, one after the other. */
export const nudgeChecks = (run: Run): Promise<void> => {
  const state = nudgeLevel();
  return WIDTHS.reduce<Promise<void>>(
    (before, width) => before.then(() => nudgeCheck(run, width, state)),
    Promise.resolve()
  );
};
