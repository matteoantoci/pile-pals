// The page helpers that all parts of the smoke run (scripts/smoke.ts) use.

import type { Page } from 'puppeteer-core';

export type Point = { readonly x: number; readonly y: number };

export const wait = (ms: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
};

/** The centre of the element, or undefined when the element is not on the page. */
export const centre = async (page: Page, selector: string): Promise<Point | undefined> => {
  const box = await (await page.$(selector))?.boundingBox();
  return box ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : undefined;
};

/**
 * A touch tap on the centre of the element. Gives false when the element is not on the page.
 * On iOS only a tap starts the audio, so the run uses touch, not the mouse.
 */
export const tap = async (page: Page, selector: string): Promise<boolean> => {
  const point = await centre(page, selector);
  if (point) {
    await page.touchscreen.tap(point.x, point.y);
  }
  return point !== undefined;
};
