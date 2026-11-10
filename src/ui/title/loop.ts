import { palSize, titleScene } from '../../model';
import { newSeed } from '../../shell/seed';
import { playPal } from '../../sound';
import { canceled, facePose, FRAME_MS, settle, stop, translate3d } from '../motion';
import { stillUrl } from '../pictures';
import type { PictureId } from '../../model';
import type { Frame, Vec } from '../motion';

// The loop of the title scene (spec Module 10). In each round, 9 pals hop in from the left edge along a line
// near the top of the stage, and fall into 3 small piles. After a pause, all pals jump off the bottom edge, and
// the next round starts with other pals. A tap on a pal makes it jump and plays its sound.
// The pals show their still pictures: animated pictures play only at reward moments (spec Module 7).
// Each motion is a WAAPI animation of `transform` with sampled keyframes and the easing 'linear'.
// `.title-pal` owns the path (translate3d), and `.title-pal-body` owns the jump and the squash (facePose).

/** A pal starts its walk this long after the pal before it. */
const STAGGER_MS = 650;
/** One hop along the line. */
const HOP_MS = 280;
/** The width and the height of one hop. */
const HOP_PX = 64;
const HOP_HEIGHT = 36;
/** The line where the pals hop, from the top of the stage. A tap jump stays inside the stage. */
const LINE_Y = 84;
/** The fall from the line to the pile. The pal first goes up a little: the start speed is this part of the fall. */
const FALL_MS = 520;
const FALL_PUSH = 0.8;
/** The squash when a pal lands. */
const LAND_MS = 220;
const LANDED = facePose({ scale: 1.18, scaleY: 0.8 });
/** How long the full piles stay before the pals jump off. */
const HOLD_MS = 2200;
const EXIT_MS = 720;
const EXIT_STAGGER_MS = 70;
const EXIT_PUSH = 0.6;
/** The sideways move of a pal that jumps off, for each pile from the left. */
const EXIT_DRIFT = [-48, 0, 48] as const;
/** The jump after a tap. */
const JUMP_MS = 460;
const JUMP_HEIGHT = 72;
/** A pal on a pile covers this part of the pal below it. */
const STACK = 0.3;

/** 0 at the start and at the end, 1 in the middle: the height of a hop at the time p (0 to 1). */
const arc = (p: number): number => 4 * p * (1 - p);

/** A fall of `drop` px in the time p (0 to 1). It starts with a speed up, which is `push` times the drop. */
const fall = (p: number, drop: number, push: number): number => -push * drop * p + (1 + push) * drop * p * p;

/** One keyframe for each frame at 60 Hz. Play them with the easing 'linear'. */
const sampled = (duration: number, at: (p: number) => string): readonly Frame[] => {
  const count = Math.max(1, Math.round(duration / FRAME_MS));
  return Array.from({ length: count + 1 }, (_, i) => ({ transform: at(i / count), offset: i / count }));
};

/** The pose of a jump at the time p (0 to 1): the pal goes up and stretches a little. */
const jumpPose = (p: number): string =>
  facePose({ y: -JUMP_HEIGHT * arc(p), scale: 1 - 0.06 * arc(p), scaleY: 1 + 0.1 * arc(p) });

/** The tap: the pal jumps and plays its sound. A pal with no own sound plays the pop (src/sound). */
const jump = (body: HTMLElement, picture: PictureId): void => {
  stop(body);
  settle(body, sampled(JUMP_MS, jumpPose), { duration: JUMP_MS, easing: 'linear' });
  playPal(picture, palSize(picture));
};

/** One pal of the round, and where it goes. */
type Pal = {
  readonly el: HTMLElement;
  readonly body: HTMLElement;
  /** The index of the pile from the left. */
  readonly pile: number;
  /** The order of the pal in the round. */
  readonly order: number;
  /** The place of the pal on its pile, in px from the top left corner of the stage. */
  readonly place: Vec;
};

const palOf = (layer: HTMLElement, picture: PictureId): Pick<Pal, 'el' | 'body'> => {
  const el = document.createElement('div');
  el.className = 'title-pal';
  const body = document.createElement('div');
  body.className = 'title-pal-body';
  const img = document.createElement('img');
  img.src = stillUrl(picture);
  img.alt = '';
  body.append(img);
  el.append(body);
  el.addEventListener('pointerdown', () => {
    jump(body, picture);
  });
  layer.append(el);
  return { el, body };
};

/** Hops along the line from the left edge, then falls onto the pile. */
const enter = (pal: Pal): Animation => {
  const size = pal.el.offsetWidth;
  const from = -size;
  const hops = Math.max(2, Math.round((pal.place.x - from) / HOP_PX));
  const walk = hops * HOP_MS;
  const duration = walk + FALL_MS;
  const at = (p: number): string => {
    const t = p * duration;
    if (t < walk) {
      const q = t / walk;
      return translate3d({ x: from + (pal.place.x - from) * q, y: LINE_Y - HOP_HEIGHT * arc((q * hops) % 1) });
    }
    return translate3d({ x: pal.place.x, y: LINE_Y + fall((t - walk) / FALL_MS, pal.place.y - LINE_Y, FALL_PUSH) });
  };
  const delay = pal.order * STAGGER_MS;
  settle(pal.body, [{ transform: LANDED }, { transform: facePose({}) }], {
    duration: LAND_MS,
    delay: delay + duration,
    easing: 'ease-out',
  });
  return settle(pal.el, sampled(duration, at), { duration, delay, easing: 'linear', fill: 'backwards' });
};

/** Jumps off the pile and falls out of the bottom of the stage. */
const leave = (pal: Pal, bottom: number): Animation => {
  const drift = EXIT_DRIFT[pal.pile] ?? 0;
  const at = (p: number): string =>
    translate3d({ x: pal.place.x + drift * p, y: pal.place.y + fall(p, bottom - pal.place.y, EXIT_PUSH) });
  return settle(pal.el, sampled(EXIT_MS, at), {
    duration: EXIT_MS,
    delay: HOLD_MS + pal.order * EXIT_STAGGER_MS,
    easing: 'linear',
    fill: 'backwards',
  });
};

/** The place of the pal at `level` on a pile: the bottom pal stands on the centre of the pile mat. */
const placeOn = (centre: Vec, size: number, level: number): Vec => ({
  x: centre.x - size / 2,
  y: centre.y - size - level * size * (1 - STACK),
});

/** Makes the pals of one round. The pals fall in turns: one on each pile, then the next level. */
const palsOf = (stage: HTMLElement, layer: HTMLElement): readonly Pal[] => {
  const box = stage.getBoundingClientRect();
  const centres = [...stage.querySelectorAll<HTMLElement>('.title-pile')].map((mat) => {
    const rect = mat.getBoundingClientRect();
    return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
  });
  const { piles } = titleScene(newSeed());
  const levels = Math.max(...piles.map((pile) => pile.pals.length));
  return Array.from({ length: levels }, (_, level) => level).flatMap((level) =>
    piles.flatMap((pile, index) => {
      const picture = pile.pals[level];
      const centre = centres[index];
      if (picture === undefined || centre === undefined) {
        return [];
      }
      const { el, body } = palOf(layer, picture);
      const place = placeOn(centre, el.offsetWidth, level);
      return [{ el, body, pile: index, order: level * piles.length + index, place }];
    })
  );
};

const finished = (animations: readonly Animation[]): Promise<unknown> =>
  Promise.all(animations.map((animation) => animation.finished));

/** Plays one round. Resolves true when the round played to its end. */
const playRound = async (stage: HTMLElement, layer: HTMLElement): Promise<boolean> => {
  const pals = palsOf(stage, layer);
  if (pals.length === 0) {
    return false;
  }
  await finished(pals.map(enter));
  const bottom = stage.clientHeight;
  await finished(pals.map((pal) => leave(pal, bottom)));
  layer.replaceChildren();
  return true;
};

/**
 * Starts the loop of the title scene in `stage`. The stage holds the `.title-pile` mats and the `.title-pals`
 * layer. Returns the function that stops the loop and removes the pals.
 */
export const runTitleLoop = (stage: HTMLElement): (() => void) => {
  const layer = stage.querySelector<HTMLElement>('.title-pals');
  let running = true;
  const next = (played: boolean): void => {
    if (running && played && layer) {
      playRound(stage, layer).then(next, canceled);
    }
  };
  next(true);
  return () => {
    running = false;
    for (const animation of stage.getAnimations({ subtree: true })) {
      animation.cancel();
    }
    layer?.replaceChildren();
  };
};
