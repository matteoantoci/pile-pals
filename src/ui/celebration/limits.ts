// The limit on animated pictures (spec Module 7: "At most 8 play at the same time until the device test
// confirms more"). The parade (ticket 08) and the sticker book (ticket 11) share one limiter, so the limit
// holds for the whole app. Ticket 16 sets the final value from the iPhone test.

/** The maximum number of animation loops that play at the same time. Ticket 16 sets the final value. */
export const MAX_CONCURRENT_ANIMATIONS = 8;

type Release = () => void;

/** A counter with a queue: `run` starts a task when a slot is free, `idle` waits for the last task. */
export type Limiter = {
  readonly run: <T>(task: () => Promise<T>) => Promise<T>;
  readonly idle: () => Promise<void>;
  readonly active: () => number;
};

/**
 * Makes a limiter with `max` slots. A task that finds no free slot waits for the first one that frees.
 * A task holds its slot until its promise settles, also when the task throws.
 */
export const createLimiter = (max: number): Limiter => {
  let active = 0;
  const waiting: Release[] = [];
  let idleWaiting: Release[] = [];

  const wakeIdle = (): void => {
    const settled = idleWaiting;
    idleWaiting = [];
    for (const resolve of settled) {
      resolve();
    }
  };

  /** Gives the slot of a finished task to the first task in the queue, or frees it. */
  const release = (): void => {
    const next = waiting.shift();
    if (next) {
      next();
      return;
    }
    active -= 1;
    if (active === 0 && waiting.length === 0) {
      wakeIdle();
    }
  };

  const acquire = (): Promise<void> => {
    if (active < max) {
      active += 1;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      waiting.push(resolve);
    });
  };

  const run = async <T>(task: () => Promise<T>): Promise<T> => {
    await acquire();
    try {
      return await task();
    } finally {
      release();
    }
  };

  const idle = (): Promise<void> => {
    if (active === 0 && waiting.length === 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      idleWaiting.push(resolve);
    });
  };

  return { run, idle, active: () => active };
};

/** The one limiter of the app: the parade and the sticker book take their animation slots from it. */
export const animationLimiter: Limiter = createLimiter(MAX_CONCURRENT_ANIMATIONS);
