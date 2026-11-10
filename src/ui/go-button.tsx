import type { JSX } from 'solid-js';

// The one "go" button of the game (spec user stories 32 and 42): a large green round button with a white arrow.
// It has no text, because the Child cannot read. The title scene and the sticker book page use it.
// Its style is in src/ui/go-button.css.

export const GoButton = (props: { readonly onGo: () => void }): JSX.Element => (
  <button type="button" class="go-button" aria-label="Play" onClick={() => props.onGo()}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M30 50 H66 M50 32 L68 50 L50 68" />
    </svg>
  </button>
);
