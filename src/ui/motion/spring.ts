// Springs as sampled keyframes. Source: research/native-feel/motion.md, section 2 and "Recommendations".
// Safari 26 does not run `linear(…)` easing on Core Animation. Thus a spring is one keyframe for each
// 60 Hz frame, played with `easing: 'linear'`. The start speed of the spring is the release speed of the finger.

import { translate3d } from './primitives';
import type { Vec } from './primitives';

/** Apple's `Spring(duration:bounce:)`: mass 1, `duration` in seconds, 0 <= `bounce` < 1. */
export type Spring = { readonly duration: number; readonly bounce: number };

/** A move from one translate to a different translate. `velocity` is the start speed in px/s. */
export type Move = { readonly from: Vec; readonly to: Vec; readonly velocity: Vec };

export type SampledSpring = {
  /** One point for each frame. The first point is `from`, the last point is `to`. */
  readonly points: readonly Vec[];
  /** Milliseconds from the first point to the last point. */
  readonly duration: number;
  /** Milliseconds to the first frame at or past `to`. With no overshoot, this is `duration`. */
  readonly crossing: number;
};

/** A pointer position at a time (`PointerEvent.timeStamp`, ms). */
export type Sample = { readonly t: number; readonly x: number; readonly y: number };

export const FRAME_MS = 1000 / 60;

/** The landing on a pile: k ≈ 246.7, c ≈ 23.6, damping ratio 0.75. */
export const LANDING: Spring = { duration: 0.4, bounce: 0.25 };

/** The return to the start position: no overshoot. */
export const RETURN: Spring = { duration: 0.35, bounce: 0 };

const CAP_FRAMES = 72; // 1.2 s at 60 Hz
const REST_PX = 0.25;
const WINDOW_MS = 80;
const STOPPED_MS = 50;
const MAX_SPEED = 4000;
const STILL: Vec = { x: 0, y: 0 };

/** Gives the offset from the target at time `t` (s) on one axis. `x0` is the start offset, `v0` the start speed. */
const axis = (spring: Spring, x0: number, v0: number): ((t: number) => number) => {
  const w0 = (2 * Math.PI) / spring.duration;
  const zeta = 1 - spring.bounce;
  if (zeta >= 1) {
    return (t) => Math.exp(-w0 * t) * (x0 + (v0 + w0 * x0) * t);
  }
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  const b = (v0 + zeta * w0 * x0) / wd;
  return (t) => Math.exp(-zeta * w0 * t) * (x0 * Math.cos(wd * t) + b * Math.sin(wd * t));
};

/** Samples the spring at 60 Hz until it stays within 0.25 px of `to`, for 1.2 s at most. */
export const sampleSpring = (move: Move, spring: Spring): SampledSpring => {
  const start = { x: move.from.x - move.to.x, y: move.from.y - move.to.y };
  const ox = axis(spring, start.x, move.velocity.x);
  const oy = axis(spring, start.y, move.velocity.y);
  const offsets = Array.from({ length: CAP_FRAMES + 1 }, (_, i) => {
    const t = (i * FRAME_MS) / 1000;
    return { x: ox(t), y: oy(t) };
  });
  const moving = offsets.findLastIndex((o) => Math.abs(o.x) > REST_PX || Math.abs(o.y) > REST_PX);
  const kept = [...offsets.slice(0, Math.max(moving + 1, 1)), STILL];
  const crossed = kept.findIndex((o, i) => i > 0 && o.x * start.x + o.y * start.y <= 0);
  return {
    points: kept.map((o) => ({ x: move.to.x + o.x, y: move.to.y + o.y })),
    duration: (kept.length - 1) * FRAME_MS,
    crossing: (crossed < 0 ? kept.length - 1 : crossed) * FRAME_MS,
  };
};

/**
 * Plays a spring on the `transform` of `el` as `translate3d` keyframes.
 * The final position goes into the inline style first, so the animation needs no `fill`.
 */
export const springTo = (el: HTMLElement, move: Move, spring: Spring): { animation: Animation; crossing: number } => {
  const sampled = sampleSpring(move, spring);
  el.style.setProperty('transform', translate3d(move.to));
  const frames = sampled.points.map((p) => ({ transform: translate3d(p) }));
  return {
    animation: el.animate(frames, { duration: sampled.duration, easing: 'linear' }),
    crossing: sampled.crossing,
  };
};

const clamp = (n: number): number => Math.max(-MAX_SPEED, Math.min(MAX_SPEED, n));

/** Gives the speed (px/s) of the last 80 ms of samples. Gives 0 when the finger stopped 50 ms before `upAt`. */
export const releaseVelocity = (samples: readonly Sample[], upAt: number): Vec => {
  const last = samples.at(-1);
  if (!last || upAt - last.t > STOPPED_MS) {
    return STILL;
  }
  const first = samples.find((s) => s.t >= last.t - WINDOW_MS) ?? last;
  const dt = (last.t - first.t) / 1000;
  return dt > 0 ? { x: clamp((last.x - first.x) / dt), y: clamp((last.y - first.y) / dt) } : STILL;
};
