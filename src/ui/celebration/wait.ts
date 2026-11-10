/** Waits for a browser timer. The celebration uses it for the card stagger and the level sequence. */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
