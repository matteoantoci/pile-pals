// The lifecycle of the page. On iOS, `visibilitychange` to `hidden` is the last event that always runs:
// `pagehide` and `beforeunload` can be missing when the web content process dies (shell.md §3).
// The sound module has its own listener for the audio context: do not heal the audio here.

export type Lifecycle = {
  /** The page is not visible: cancel an active drag and save the state. */
  readonly hidden: () => void;
  /** The page is visible again: ask the browser for a new version. */
  readonly visible: () => void;
};

/** Adds the one listener of the shell. Call it one time, after the first render. */
export const watchLifecycle = ({ hidden, visible }: Lifecycle): void => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hidden();
      return;
    }
    visible();
  });
};
