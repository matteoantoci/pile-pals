import type { JSX } from 'solid-js';

// The crown of a category card and of an empty slot (ticket 08). It is a flat drawing, not the crown picture of the
// catalog: rounded points with a ball on each point, a band with one red jewel, a gold fill, and a dark outline.
// A rim in the card colour goes around it, so the crown does not touch the gold frame of the card.
// styles.css sets its colours, its size, and its place: centred on the top edge of the card, half outside the card.

/** The parts of the crown: the points, the balls on the points, and the band. The jewel is on the band. */
const Shape = (): JSX.Element => (
  <>
    <path d="M22 66 L14 30 L38 46 L60 22 L82 46 L106 30 L98 66 Z" />
    <circle cx="14" cy="24" r="7" />
    <circle cx="60" cy="14" r="8" />
    <circle cx="106" cy="24" r="7" />
    <rect x="18" y="56" width="84" height="20" rx="7" />
  </>
);

/** The crown. The rim comes first, so the gold parts and the jewel are on it. */
export const Crown = (): JSX.Element => (
  <svg class="crown" viewBox="0 0 120 84" aria-hidden="true">
    <g class="crown-rim">
      <Shape />
    </g>
    <g class="crown-gold">
      <Shape />
    </g>
    <circle class="crown-jewel" cx="60" cy="66" r="7.5" />
  </svg>
);
