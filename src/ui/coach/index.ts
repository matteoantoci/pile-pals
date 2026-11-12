// The coach of the board: the demo hand and the hint hop (spec, user stories 24 to 29).
// The model chooses the demo and the hint move. The coach owns the time: the idle time, the hops, the hand.
// The first touch of the Child stops a demo or a hop at once.

import { apply, demoFor, hintFor, sawDemo } from '../../model';
import { hop } from './hop';
import { newRun } from './parts';
import { showMove } from './show';
import type { GameState } from '../../model';
import type { Run } from './parts';
import type { Show } from './show';

/** The time with no action before a hint (ms). */
const IDLE_MS = 5000;
/** A demo starts this long after the board comes to rest, so the Child sees the table first. */
const DEMO_DELAY_MS = 600;
/** After this number of hops with no action, the hand shows the hint move. */
const HOPS = 2;
/** The first demo of the game plays this number of rounds, or until the first touch. A later demo plays one. */
const FIRST_ROUNDS = 3;

/** What the coach needs from the board: the newest state, and the way to keep a state with a new seen demo. */
export type CoachGame = {
  readonly current: () => GameState;
  /** Keeps the state as the newest state, and saves it. */
  readonly record: (state: GameState) => void;
};

export type Coach = {
  /** The board is at rest: a level starts, or a move is done. A new demo shows, else the idle time starts. */
  readonly rest: () => void;
  /** Stops the demo, the hops, and the timer (the page goes hidden). `rest` starts them again. */
  readonly pause: () => void;
  /** Removes the coach from the page. */
  readonly stop: () => void;
};

/** One timer and one hand at a time. `clear` stops both. */
type Stage = {
  readonly later: (ms: number, next: () => void) => void;
  /** Shows the move with the hand. `next` runs when the hand played to its end, not after a stop. */
  readonly show: (show: Show, next: () => void) => void;
  readonly showing: () => boolean;
  readonly clear: () => void;
};

const stageOf = (): Stage => {
  let timer: number | undefined;
  let run: Run | undefined;
  const clear = (): void => {
    window.clearTimeout(timer);
    timer = undefined;
    run?.stop();
    run = undefined;
  };
  const later = (ms: number, next: () => void): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(next, ms);
  };
  const show = (shown: Show, next: () => void): void => {
    const own = newRun();
    run = own;
    showMove(own, shown).then((played) => {
      if (played && run === own) {
        run = undefined;
        next();
      }
    }, clear);
  };
  return { later, show, showing: () => run !== undefined, clear };
};

/** Adds the touch listeners on the document (capture, so they run before the drag). Returns the remove function. */
const listen = (touched: () => void, released: () => void): (() => void) => {
  const options = { capture: true };
  document.addEventListener('pointerdown', touched, options);
  document.addEventListener('pointerup', released, options);
  document.addEventListener('pointercancel', released, options);
  return () => {
    document.removeEventListener('pointerdown', touched, options);
    document.removeEventListener('pointerup', released, options);
    document.removeEventListener('pointercancel', released, options);
  };
};

/** The help with no action. `hint` shows the next step of the cycle. `reset` starts the count of hops again. */
type Idle = { readonly hint: () => void; readonly reset: () => void };

// With no action: a hop, a hop, then the hand, and again.
const idleOf = (game: CoachGame, stage: Stage): Idle => {
  let hops = 0;
  const hint = (): void => {
    const move = hintFor(game.current());
    if (!move) {
      return;
    }
    if (hops < HOPS) {
      hops += 1;
      hop(move);
      stage.later(IDLE_MS, hint);
      return;
    }
    hops = 0;
    stage.show({ move, rounds: 1, flipped: undefined }, () => stage.later(IDLE_MS, hint));
  };
  return {
    hint,
    reset: () => {
      hops = 0;
    },
  };
};

/** Starts the coach of one board. Call `rest` when the board is ready, and `stop` when the board goes. */
export const startCoach = (game: CoachGame): Coach => {
  const stage = stageOf();
  const idle = idleOf(game, stage);
  const { hint } = idle;

  const demo = (): void => {
    const state = game.current();
    const next = demoFor(state);
    if (!next) {
      stage.later(IDLE_MS - DEMO_DELAY_MS, hint);
      return;
    }
    game.record(sawDemo(state, next.kind));
    // The first demo ends with the flip of the card that its move uncovers (spec, user story 33).
    const flipped =
      next.kind === 'first'
        ? apply(state, next.move).events.flatMap((event) => (event.type === 'flipped' ? [event.cardId] : []))[0]
        : undefined;
    const rounds = next.kind === 'first' ? FIRST_ROUNDS : 1;
    stage.show({ move: next.move, rounds, flipped }, () => stage.later(IDLE_MS, hint));
  };

  const pause = (): void => {
    stage.clear();
    idle.reset();
  };

  // A touch is an action: it stops the hand and the hops. The idle time starts again when the finger goes up.
  const unlisten = listen(pause, () => {
    if (!stage.showing()) {
      stage.later(IDLE_MS, hint);
    }
  });

  const rest = (): void => {
    pause();
    stage.later(DEMO_DELAY_MS, demo);
  };

  const stop = (): void => {
    pause();
    unlisten();
  };

  return { rest, pause, stop };
};
