// Browser smoke run of the built app: `pnpm smoke`. It is a dev tool, not a test of the game model.
// The `smoke` script in package.json runs `vite build` first, and this file serves dist/ with `vite preview`.
// Chromium cannot show the iOS audio rules (see docs/agents/ios-device.md), so a pass here does not prove the
// iPhone behaviour.
//
// Audio is read through the CDP WebAudio domain. Patches of AudioContext from an init script do not work:
// the init script runs in an isolated world, not in the world of the page.
//
// Chrome: set CHROME_PATH, or the script uses the default install of Google Chrome on macOS.

import { launch } from 'puppeteer-core';
import { preview } from 'vite';
import type { Browser, CDPSession, Page } from 'puppeteer-core';

const CHROME = process.env['CHROME_PATH'] ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4179;
const DRAG_STEPS = 12;
const MAX_DRAGS = 150;

type Point = { readonly x: number; readonly y: number };

/** The realtime contexts (created, changed, closed) and the started buffer sources since the last reset. */
type Audio = { readonly contexts: () => string; readonly sources: () => number; readonly reset: () => void };

const wait = (ms: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
};

const watchAudio = async (cdp: CDPSession): Promise<Audio> => {
  const contexts: string[] = [];
  let sources = 0;
  cdp.on('WebAudio.contextCreated', (event) => {
    if (event.context.contextType === 'realtime') {
      contexts.push(`new ${event.context.contextState}`);
    }
  });
  cdp.on('WebAudio.contextChanged', (event) => {
    if (event.context.contextType === 'realtime') {
      contexts.push(event.context.contextState);
    }
  });
  cdp.on('WebAudio.audioNodeCreated', (event) => {
    if (event.node.nodeType.startsWith('AudioBufferSource')) {
      sources += 1;
    }
  });
  await cdp.send('WebAudio.enable');
  return {
    contexts: () => contexts.join(' > '),
    sources: () => sources,
    reset: () => {
      contexts.length = 0;
      sources = 0;
    },
  };
};

const centre = async (page: Page, selector: string): Promise<Point | undefined> => {
  const box = await (await page.$(selector))?.boundingBox();
  return box ? { x: box.x + box.width / 2, y: box.y + box.height / 2 } : undefined;
};

/** A touch tap: on iOS only a tap starts the audio, so the run uses touch, not the mouse. */
const tap = async (page: Page, selector: string): Promise<boolean> => {
  const point = await centre(page, selector);
  if (point) {
    await page.touchscreen.tap(point.x, point.y);
  }
  return point !== undefined;
};

const shown = async (page: Page, selector: string): Promise<boolean> => (await page.$(selector)) !== null;

type Path = { readonly from: Point; readonly to: Point };

/** Moves the finger in steps along the path. Each step waits for the one before it. */
const moveTouch = async (page: Page, { from, to }: Path, step: number): Promise<void> => {
  if (step > DRAG_STEPS) {
    return;
  }
  const part = step / DRAG_STEPS;
  await page.touchscreen.touchMove(from.x + (to.x - from.x) * part, from.y + (to.y - from.y) * part);
  await wait(16);
  await moveTouch(page, { from, to }, step + 1);
};

const drag = async (page: Page, from: Point, to: Point): Promise<void> => {
  await page.touchscreen.touchStart(from.x, from.y);
  await moveTouch(page, { from, to }, 1);
  await page.touchscreen.touchEnd();
  await wait(500);
};

const middle = (el: Element): Point => {
  const rect = el.getBoundingClientRect();
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
};

/** Top cards that the finger can reach, and the drop place of each pile. Runs in the page. */
const readTable = (page: Page): Promise<{ cards: Point[]; piles: Point[] }> =>
  page.evaluate<[], () => { cards: Point[]; piles: Point[] }>(`(() => {
    const middle = ${middle.toString()};
    const reachable = (el) => {
      const point = middle(el);
      const top = document.elementFromPoint(point.x, point.y);
      return top !== null && el.contains(top);
    };
    const cards = [...document.querySelectorAll('.table .card:not(.gone), .deck-place .card')].filter(reachable).map(middle);
    const piles = [...document.querySelectorAll('.pile')].map((pile) => middle(pile.querySelector('.pile-face') ?? pile));
    return { cards, piles };
  })()`);

/** Plays the level by trial: each reachable card goes to each pile, and the deck deals when no card shows. */
const playLevel = async (page: Page, attempt: number): Promise<void> => {
  if (attempt >= MAX_DRAGS) {
    return;
  }
  const { cards, piles } = await readTable(page);
  const card = cards[attempt % Math.max(1, cards.length)];
  const pile = piles[Math.floor(attempt / Math.max(1, cards.length)) % Math.max(1, piles.length)];
  if (card && pile) {
    await drag(page, card, pile);
  } else if (!(await tap(page, '.deck'))) {
    return;
  }
  await playLevel(page, attempt + 1);
};

const visibility = (state: string): string =>
  `Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => '${state}' });
  document.dispatchEvent(new Event('visibilitychange'));`;

/** Makes the page hidden and visible again, as a trip to the background does. */
const visitBackground = async (page: Page): Promise<void> => {
  await page.evaluate(visibility('hidden'));
  await wait(300);
  await page.evaluate(visibility('visible'));
  await wait(500);
};

const results: string[] = [];
const check = (name: string, pass: boolean, detail = ''): void => {
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const fresh = async (page: Page): Promise<void> => {
  await page.evaluate('localStorage.clear()');
  await page.reload({ waitUntil: 'networkidle2' });
  await wait(1500);
};

const emptyBook = async (page: Page): Promise<void> => {
  await fresh(page);
  await tap(page, '.book-button');
  await wait(600);
  check('empty book shows 12 places', (await page.$$('.book-spot')).length === 12);
};

const newGame = async (page: Page, audio: Audio): Promise<void> => {
  await fresh(page);
  await tap(page, '.go-button');
  await wait(1200);
  check('new game: no sound gate', !(await shown(page, '.sound-gate')));
  check('new game: context runs', audio.contexts().endsWith('running'), audio.contexts());
};

const restoredBoard = async (page: Page, audio: Audio): Promise<void> => {
  await page.reload({ waitUntil: 'networkidle2' });
  await wait(1500);
  check('restored board: sound gate shows', await shown(page, '.sound-gate'));
  audio.reset();
  await tap(page, '.sound-gate .go-button');
  await wait(800);
  check('gate tap: context runs', audio.contexts().endsWith('running'), audio.contexts());
};

const backgroundReturn = async (page: Page, audio: Audio): Promise<void> => {
  await visitBackground(page);
  check('background return: sound gate shows', await shown(page, '.sound-gate'));
  audio.reset();
  await tap(page, '.sound-gate .go-button');
  await wait(800);
  const trace = audio.contexts();
  check(
    'background return: tap makes a new running context',
    trace.includes('closed') && trace.endsWith('running'),
    trace
  );
};

const levelEnd = async (page: Page, audio: Audio): Promise<void> => {
  audio.reset();
  await playLevel(page, 0);
  check('level: sounds play', audio.sources() > 0, `${String(audio.sources())} sources`);
  await wait(1500);
  check('level end: confetti canvas', await shown(page, 'canvas'));
  await wait(1500);
  check('level end: sticker page', await shown(page, '.book'));
};

const runAll = async (browser: Browser): Promise<void> => {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 763, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${String(PORT)}/pile-pals/`, { waitUntil: 'networkidle2' });
  const audio = await watchAudio(await page.createCDPSession());
  await emptyBook(page);
  await newGame(page, audio);
  await restoredBoard(page, audio);
  await backgroundReturn(page, audio);
  await levelEnd(page, audio);
};

const server = await preview({ preview: { port: PORT, strictPort: true, host: '127.0.0.1' } });
const browser = await launch({ executablePath: CHROME, headless: true });
try {
  await runAll(browser);
} finally {
  await browser.close();
  const closed = Promise.withResolvers<void>();
  server.httpServer.close(() => closed.resolve());
  await closed.promise;
}

process.stdout.write(`${results.join('\n')}\n`);
process.exitCode = results.some((line) => line.startsWith('FAIL')) ? 1 : 0;
