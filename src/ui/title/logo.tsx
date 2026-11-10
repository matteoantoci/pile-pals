import { onCleanup, onMount } from 'solid-js';
import type { JSX } from 'solid-js';

// The logo of the game (spec Module 10): a pile of cards with eyes, and no text.
// The eyes blink one time in each loop. Ticket 14 adds the 3-second hold that opens the parent check.

const BLINK_MS = 4200;
const BLINK: readonly Keyframe[] = [
  { transform: 'scale(1, 1)', offset: 0 },
  { transform: 'scale(1, 1)', offset: 0.93 },
  { transform: 'scale(1, 0.1)', offset: 0.965 },
  { transform: 'scale(1, 1)', offset: 1 },
];

export const Logo = (): JSX.Element => {
  let eyes: SVGGElement | undefined;
  onMount(() => {
    const blink = eyes?.animate([...BLINK], { duration: BLINK_MS, iterations: Infinity, easing: 'linear' });
    onCleanup(() => blink?.cancel());
  });
  return (
    <svg class="logo" viewBox="0 0 132 120" role="img" aria-label="Pile Pals">
      <rect
        class="logo-card logo-card-back"
        x="18"
        y="26"
        width="64"
        height="86"
        rx="10"
        transform="rotate(-16 50 69)"
      />
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
