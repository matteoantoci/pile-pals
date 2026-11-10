import { onCleanup, onMount } from 'solid-js';
import type { JSX } from 'solid-js';

// The logo of the game (spec Module 10): a pile of cards with eyes, and no text.
// The eyes blink one time in each loop. A 3-second hold on the logo opens the parent check (spec Module 11).

const BLINK_MS = 4200;
const BLINK: readonly Keyframe[] = [
  { transform: 'scale(1, 1)', offset: 0 },
  { transform: 'scale(1, 1)', offset: 0.93 },
  { transform: 'scale(1, 0.1)', offset: 0.965 },
  { transform: 'scale(1, 1)', offset: 1 },
];

/** A hold of this time on the logo opens the parent check. */
const HOLD_MS = 3000;

type Hold = {
  readonly down: JSX.EventHandler<SVGSVGElement, PointerEvent>;
  readonly stop: () => void;
};

/** The pointer handlers of the hold. A lift, a cancel, or a lost capture before HOLD_MS stops the hold. */
const holdOf = (onHold: () => void): Hold => {
  let timer: number | undefined;
  const stop = (): void => clearTimeout(timer);
  onCleanup(stop);
  const down: Hold['down'] = (event) => {
    stop();
    event.currentTarget.setPointerCapture(event.pointerId);
    timer = setTimeout(onHold, HOLD_MS);
  };
  return { down, stop };
};

/** The three cards of the pile, back to front. */
const Cards = (): JSX.Element => (
  <>
    <rect class="logo-card logo-card-back" x="18" y="26" width="64" height="86" rx="10" transform="rotate(-16 50 69)" />
    <rect
      class="logo-card logo-card-middle"
      x="50"
      y="22"
      width="64"
      height="86"
      rx="10"
      transform="rotate(14 82 65)"
    />
    <rect class="logo-card" x="34" y="14" width="64" height="86" rx="10" />
  </>
);

export const Logo = (props: { readonly onHold: () => void }): JSX.Element => {
  const hold = holdOf(() => props.onHold());
  let eyes: SVGGElement | undefined;
  onMount(() => {
    const blink = eyes?.animate([...BLINK], { duration: BLINK_MS, iterations: Infinity, easing: 'linear' });
    onCleanup(() => blink?.cancel());
  });
  return (
    <svg
      class="logo"
      viewBox="0 0 132 120"
      role="img"
      aria-label="Pile Pals"
      onPointerDown={hold.down}
      onPointerUp={hold.stop}
      onPointerCancel={hold.stop}
      onLostPointerCapture={hold.stop}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Cards />
      <g
        class="logo-eyes"
        ref={(el) => {
          eyes = el;
        }}
      >
        <circle class="logo-eye" cx="54" cy="48" r="11" />
        <circle class="logo-eye" cx="78" cy="48" r="11" />
        <circle class="logo-pupil" cx="56" cy="50" r="5.5" />
        <circle class="logo-pupil" cx="80" cy="50" r="5.5" />
      </g>
    </svg>
  );
};
