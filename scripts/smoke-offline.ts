// The offline part of the smoke run (scripts/smoke.ts). The run stops the preview server and reloads, so the page
// and the service worker both have no network (page.setOfflineMode does not reach the service worker). Then the
// app must start from the service worker and show the title screen.

import { wait } from './smoke-page.ts';
import type { Page } from 'puppeteer-core';

type Check = (name: string, pass: boolean, detail?: string) => void;

const CONTROL_MS = 10_000;

/** Gives true when a service worker controls the page within CONTROL_MS. */
const controlled = async (page: Page): Promise<boolean> =>
  page
    .waitForFunction(() => navigator.serviceWorker.controller !== null, { timeout: CONTROL_MS })
    .then(() => true)
    .catch(() => false);

/** Stops the preview server with `stop`, reloads with no network, and checks that the title screen shows. */
export const offlineChecks = async (page: Page, stop: () => Promise<void>, check: Check): Promise<void> => {
  let control = await controlled(page);
  if (!control) {
    // The first load installs the service worker; a reload puts the page under its control.
    await page.reload({ waitUntil: 'networkidle2' });
    control = await controlled(page);
  }
  check('online: a service worker controls the page', control);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await stop();
  await page.reload().catch(() => undefined);
  await wait(1500);
  const title = (await page.$('.go-button')) !== null && (await page.$('.book-button')) !== null;
  check('offline: the app starts and the title screen shows', title, title ? '' : (await page.content()).slice(0, 200));
};
