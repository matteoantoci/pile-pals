// The rounds of the demo hand. Numbers: research/native-feel/motion.md, and a slow spring (1.2 s, no bounce).
// Ticket 16 tunes the felt values on the iPhone. Change a value here only.

import { flip } from '../flip';
import { canceled, facePose, land, lift, ORIGIN, RESTING, settle, springTo, stop, translate3d } from '../motion';
import { cardOf, centreOf, copyOf, deckOf, handOf, pileOf } from './parts';
import type { CardId, Hint } from '../../model';
import type { CardParts, Spring, Vec } from '../motion';
import type { Run } from './parts';

/**
 * What the hand shows: the move, the number of rounds, and the face-down card that the move uncovers. Only the first
 * demo gives that card: each of its rounds ends with the flip of the card, and the card then turns back face-down.
 */
export type Show = { readonly move: Hint; readonly rounds: number; readonly flipped: CardId | undefined };

/** The slow move of the hand and the card. */
const DEMO_SPRING: Spring = { duration: 1.2, bounce: 0 };
/** After the demo, the copy goes back to the place of the card, and the card shows again. */
const BACK_SPRING: Spring = { duration: 0.6, bounce: 0 };
/** The hand is semi-transparent. */
const HAND_ALPHA = 0.7;
const COME_IN_MS = 450;
const PRESS_MS = 140;
const HOLD_MS = 450;
const FADE_MS = 250;
const ROUND_GAP_MS = 700;
/** The hand comes in from below and to the right of the point. */
const COME_IN_FROM: Vec = { x: 40, y: 70 };
const UP = facePose({});
const PRESSED = facePose({ scale: 0.86 });
const DECK_PRESSED = facePose({ scale: 0.95 });

type Hand = { readonly hand: HTMLElement; readonly body: HTMLElement };
type Round = () => Promise<void>;

/** Waits for the animation. A canceled animation rejects, so a stopped run ends here. */
const done = (animation: Animation): Promise<unknown> => animation.finished;

/** Waits, and rejects when the run stopped in the meantime. */
const pause = (run: Run, ms: number): Promise<void> =>
  new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (run.stopped()) {
        reject(new Error('The demo stopped.'));
        return;
      }
      resolve();
    }, ms);
  });

const comeIn = (hand: Hand, at: Vec): Promise<unknown> =>
  done(
    settle(
      hand.hand,
      [
        { transform: translate3d({ x: at.x + COME_IN_FROM.x, y: at.y + COME_IN_FROM.y }), opacity: 0 },
        { transform: translate3d(at), opacity: HAND_ALPHA },
      ],
      { duration: COME_IN_MS, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
    )
  );

const press = (hand: Hand, down: boolean): Promise<unknown> =>
  done(
    settle(hand.body, [{ transform: down ? UP : PRESSED }, { transform: down ? PRESSED : UP }], {
      duration: PRESS_MS,
      easing: 'ease-out',
    })
  );

const fadeOut = (el: HTMLElement): Promise<unknown> =>
  done(settle(el, [{ opacity: HAND_ALPHA }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-in' }));

const partsOf = (card: HTMLElement): CardParts | undefined => {
  const face = card.querySelector<HTMLElement>('.card-face');
  const shadow = card.querySelector<HTMLElement>('.card-shadow');
  return face && shadow ? { face, shadow } : undefined;
};

/** The face-down card that the move of the demo uncovers: the card element and its face. */
type Below = { readonly card: HTMLElement; readonly face: HTMLElement };

/** One drag of the copy: the card, the place of the target, and the face-down card that the move uncovers. */
type Carry = { readonly source: HTMLElement; readonly to: Vec; readonly below: Below | undefined };

/**
 * Turns the card below to the side, with the flip of the board (src/ui/flip.ts). After a stop, the flip does not
 * change the side: `stop` puts the card back face-down.
 */
const turn = (run: Run, below: Below, side: 'up' | 'down'): Promise<void> =>
  flip(below.face, () => {
    if (!run.stopped()) {
      below.card.setAttribute('data-face', side);
    }
  });

/**
 * The copy goes from the card to the target with the hand on it, and lands. The card below turns face-up, and then
 * turns face-down while the copy goes back with no hand.
 */
const carry = async (run: Run, hand: Hand, move: Carry): Promise<void> => {
  const copy = copyOf(run, move.source);
  const parts = copy && partsOf(copy);
  if (!copy || !parts) {
    return;
  }
  const from = centreOf(move.source);
  const offset = { x: move.to.x - from.x, y: move.to.y - from.y };
  lift(parts);
  springTo(hand.hand, { from, to: move.to, velocity: ORIGIN }, DEMO_SPRING);
  await done(springTo(copy, { from: ORIGIN, to: offset, velocity: ORIGIN }, DEMO_SPRING).animation);
  land(parts, 0).catch(canceled);
  await press(hand, false);
  if (move.below) {
    await turn(run, move.below, 'up');
  }
  await pause(run, HOLD_MS);
  await Promise.all([
    fadeOut(hand.hand),
    done(springTo(copy, { from: offset, to: ORIGIN, velocity: ORIGIN }, BACK_SPRING).animation),
    move.below && turn(run, move.below, 'down'),
  ]);
  copy.remove();
  move.source.classList.remove('demo-source');
};

/** One drag round: the hand presses the card and moves it slowly to its pile. */
const dragRound = async (run: Run, target: HTMLElement, move: Omit<Carry, 'to'>): Promise<void> => {
  const hand = handOf(run);
  await comeIn(hand, centreOf(move.source));
  await press(hand, true);
  await carry(run, hand, { ...move, to: centreOf(target) });
  hand.hand.remove();
};

/** One tap of the hand on the deck. The deck gives a small press, but the deck does not deal. */
const tap = async (hand: Hand, deck: HTMLElement): Promise<void> => {
  await press(hand, true);
  settle(deck, [{ transform: UP }, { transform: DECK_PRESSED }, { transform: UP }], {
    duration: PRESS_MS * 2,
    easing: 'ease-out',
  });
  await press(hand, false);
};

/** One tap round: the hand taps the deck two times. */
const tapRound = async (run: Run, deck: HTMLElement): Promise<void> => {
  const hand = handOf(run);
  await comeIn(hand, centreOf(deck));
  await tap(hand, deck);
  await pause(run, HOLD_MS);
  await tap(hand, deck);
  await fadeOut(hand.hand);
  hand.hand.remove();
};

/** The face-down card that the move uncovers, or undefined. `stop` of the run puts it back face-down at rest. */
const belowOf = (run: Run, cardId: CardId | undefined): Below | undefined => {
  const card = cardId === undefined ? undefined : cardOf(cardId);
  const face = card?.querySelector<HTMLElement>('.card-face');
  if (!card || !face) {
    return undefined;
  }
  run.onStop(() => {
    stop(face);
    face.style.setProperty('transform', RESTING);
    card.setAttribute('data-face', 'down');
  });
  return { card, face };
};

/** The round of the move, or undefined when its elements are not on the screen. */
const roundOf = (run: Run, { move, flipped }: Show): Round | undefined => {
  if (move.type === 'tapDeck') {
    const deck = deckOf();
    return deck && (() => tapRound(run, deck));
  }
  const source = cardOf(move.cardId);
  const target = pileOf(move.type === 'dropCard' ? move.pileId : move.slotId);
  const below = belowOf(run, flipped);
  return source && target && (() => dragRound(run, target, { source, below }));
};

const repeat = async (run: Run, round: Round, rounds: number): Promise<void> => {
  await round();
  if (rounds > 1) {
    await pause(run, ROUND_GAP_MS);
    await repeat(run, round, rounds - 1);
  }
};

/**
 * Shows the move with the hand, `rounds` times. Resolves true when the demo played to its end, and false when
 * it stopped (the Child touched the screen). At the end, the run has no element on the screen.
 */
export const showMove = (run: Run, show: Show): Promise<boolean> => {
  const round = roundOf(run, show);
  const played = round ? repeat(run, round, show.rounds) : Promise.resolve();
  return played
    .then(
      () => !run.stopped(),
      () => false
    )
    .finally(() => {
      run.stop();
    });
};
