import { For, Show } from 'solid-js';
import { PAGE_SIZE } from '../../model';
import { PlacedView } from './sticker';
import type { PlacedSticker } from '../../model';
import type { JSX } from 'solid-js';

/** The time between the start of two stickers of the dance. */
const DANCE_STEP_MS = 300;

/** One empty place for each sticker of a page. The grid of book.css puts them at the places of the model. */
const SPOTS = Array.from({ length: PAGE_SIZE }, (_, index) => index);

/**
 * One page of the sticker book: a sheet of paper with the stickers at their places.
 * `dance`: each sticker plays one time after the other (the celebration when the book is complete).
 * `empty`: the book has no sticker yet. The page shows the empty places, with no text, because the Child
 * cannot read.
 */
export const PageView = (props: {
  readonly stickers: readonly PlacedSticker[];
  readonly dance?: boolean;
  readonly empty?: boolean;
  readonly ref?: (el: HTMLElement) => void;
}): JSX.Element => (
  <div class="book-page" ref={(el) => props.ref?.(el)}>
    <Show when={props.empty === true}>
      <div class="book-spots" aria-hidden="true">
        <For each={SPOTS}>{() => <span class="book-spot" />}</For>
      </div>
    </Show>
    <For each={props.stickers}>
      {(sticker, index) => (
        <PlacedView sticker={sticker} delay={props.dance === true ? index() * DANCE_STEP_MS : undefined} />
      )}
    </For>
  </div>
);
