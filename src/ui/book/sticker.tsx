import { createSignal, onMount } from 'solid-js';
import { playPal } from '../../sound';
import { animationLimiter, wait } from '../celebration';
import { facePose, settle, stop } from '../motion';
import { animationUrl, stillUrl } from '../pictures';
import type { PlacedSticker, Sticker } from '../../model';
import type { JSX } from 'solid-js';

/** How long a sticker plays its animation loop after a tap. */
const PLAY_MS = 3000;

/** The small hop of a sticker at the start of its play: up, then back to rest. */
const HOP = [facePose({}), facePose({ y: -14, scale: 1.08 }), facePose({})].map((transform) => ({ transform }));

const canceled = (): void => undefined;

/** The picture of a sticker, and the play of its animation and its sound one time. */
export type Playable = {
  readonly picture: () => JSX.Element;
  /** `host` is the element that holds the picture. */
  readonly play: (host: HTMLElement) => void;
};

/**
 * Makes the picture of a sticker and its play. The play takes one slot of the app animation limit
 * (celebration/limits.ts) while the loop shows, so many taps never play more loops than the limit.
 */
export const playable = (sticker: Sticker): Playable => {
  const [playing, setPlaying] = createSignal(false);
  const play = (host: HTMLElement): void => {
    if (playing()) {
      return;
    }
    animationLimiter
      .run(async () => {
        setPlaying(true);
        playPal(sticker.pal);
        const img = host.querySelector<HTMLElement>('.sticker-img');
        if (img) {
          stop(img);
          settle(img, HOP, { duration: 400, easing: 'ease-out' });
        }
        await wait(PLAY_MS);
      })
      .finally(() => setPlaying(false))
      .catch(canceled);
  };
  // A new `src` starts the loop at frame 0, which is the still: the swap shows no jump.
  const picture = (): JSX.Element => (
    <img
      class="sticker-img"
      src={playing() ? (animationUrl(sticker.pal) ?? stillUrl(sticker.pal)) : stillUrl(sticker.pal)}
      alt=""
    />
  );
  return { picture, play };
};

/** A sticker on a page, at its place. A tap plays its animation and its sound. With a `delay`, it plays by itself. */
export const PlacedView = (props: {
  readonly sticker: PlacedSticker;
  readonly delay?: number | undefined;
}): JSX.Element => {
  const { picture, play } = playable(props.sticker);
  const host: { el?: HTMLElement } = {};
  onMount(() => {
    const { delay } = props;
    const { el } = host;
    if (delay !== undefined && el) {
      wait(delay).then(() => play(el), canceled);
    }
  });
  return (
    <div
      class="sticker"
      classList={{ gold: props.sticker.gold }}
      style={{ left: `${String(props.sticker.at.x * 100)}%`, top: `${String(props.sticker.at.y * 100)}%` }}
      ref={(el) => {
        host.el = el;
      }}
      onPointerDown={(event) => play(event.currentTarget)}
    >
      {picture()}
    </div>
  );
};
