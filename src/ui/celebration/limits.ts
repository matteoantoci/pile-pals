// The limit on animated pictures (spec Module 7: "At most 8 play at the same time until the device test
// confirms more"). The parade (ticket 08) and the sticker book (ticket 11) share one limiter, so the limit
// holds for the whole app. Ticket 16 sets the final value from the iPhone test.

/** The maximum number of animation loops that play at the same time. Ticket 16 sets the final value. */
const MAX_CONCURRENT_ANIMATIONS = 8;

type Release = () => void;

/** A counter with a queue: `run` starts a task when a slot is free. */
type Limiter = {
  readonly run: <T>(task: () => Promise<T>) => Promise<T>;
};

let active = 0;
const waiting: Release[] = [];

/** Gives the slot of a finished task to the first task in the queue, or frees it. */
const release = (): void => {
  const next = waiting.shift();
  if (next) {
    next();
    return;
  }
  active -= 1;
};

const acquire = (): Promise<void> => {
  if (active < MAX_CONCURRENT_ANIMATIONS) {
    active += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    waiting.push(resolve);
  });
};

/**
 * The one limiter of the app: the parade and the sticker book take their animation slots from it.
 * A task that finds no free slot waits for the first one that frees. A task holds its slot until its promise
 * settles, also when the task throws.
 */
export const animationLimiter: Limiter = {
  run: async (task) => {
    await acquire();
    try {
      return await task();
    } finally {
      release();
    }
  },
};
