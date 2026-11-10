import { For } from 'solid-js';
import { PlacedView } from './sticker';
import type { PlacedSticker } from '../../model';
import type { JSX } from 'solid-js';

/** The time between the start of two stickers of the dance. */
const DANCE_STEP_MS = 300;

/**
 * One page of the sticker book: a sheet of paper with the stickers at their places.
 * `dance`: each sticker plays one time after the other (the celebration when the book is complete).
 */
export const PageView = (props: {
  readonly stickers: readonly PlacedSticker[];
  readonly dance?: boolean;
  readonly ref?: (el: HTMLElement) => void;
}): JSX.Element => (
  <div class="book-page" ref={(el) => props.ref?.(el)}>
    <For each={props.stickers}>
      {(sticker, index) => (
        <PlacedView sticker={sticker} delay={props.dance === true ? index() * DANCE_STEP_MS : undefined} />
      )}
    </For>
  </div>
);
