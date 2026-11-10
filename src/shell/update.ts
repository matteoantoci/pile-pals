// The service worker of the app. vite-plugin-pwa runs in prompt mode: a new version installs and waits.
// The app accepts the update, not the Child: there is no prompt on the screen (research/native-feel/shell.md §4).
// A waiting update must never reload the page in the middle of a level.

import { registerSW } from 'virtual:pwa-register';

/** Calls the service worker to skip the wait and reloads the page. */
type Update = (reloadPage?: boolean) => Promise<void>;

let waiting = false;
/** True while the screen is at a safe point (the title scene before the first touch). */
let safe = false;
let registration: ServiceWorkerRegistration | undefined;
let update: Update | undefined;

/** A service worker call that fails is not an error of the game. */
const ignored = (): void => undefined;

/**
 * Applies a waiting update: the new service worker takes control and the page reloads.
 * Call it only at a safe point, before the first touch of a level: the start of a level, or the
 * next button of the reward screen. The reload then paints the saved table (shell.md §4).
 */
export const applyUpdateIfWaiting = (): void => {
  if (waiting && update) {
    update(true).catch(ignored);
  }
};

/** Registers the service worker and starts the check. Call it one time, before the first render. */
export const watchUpdates = (): void => {
  update = registerSW({
    immediate: true,
    // No prompt on the screen: the update waits for a safe point. During a safe window, it applies at once.
    onNeedRefresh: () => {
      waiting = true;
      if (safe) {
        applyUpdateIfWaiting();
      }
    },
    onRegisteredSW: (_url, registered) => {
      registration = registered;
    },
  });
};

/** Asks the browser for a new version. A return from the background is not a navigation (shell.md §4). */
export const checkForUpdate = (): void => {
  registration?.update().catch(ignored);
};

/**
 * Starts a safe window: a waiting update applies now, and an update that becomes ready during the window
 * applies when it is ready. The title scene opens the window when it shows, and closes it at the first touch
 * (spec Module 9). Returns the function that closes the window.
 */
export const openSafeWindow = (): (() => void) => {
  safe = true;
  applyUpdateIfWaiting();
  return () => {
    safe = false;
  };
};
