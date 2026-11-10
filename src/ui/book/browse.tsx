import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { loadGame } from '../../shell/save';
import { PageView } from './page';
import type { PlacedSticker } from '../../model';
import type { JSX } from 'solid-js';

type Pages = readonly (readonly PlacedSticker[])[];

/** A round button with an icon and no text. `d` is the SVG path of the icon on a 100 × 100 box. */
const IconButton = (props: {
  readonly class: string;
  readonly label: string;
  readonly d: string;
  readonly hidden?: boolean;
  readonly onTap: () => void;
}): JSX.Element => (
  <button
    type="button"
    class={`book-button ${props.class}`}
    classList={{ hidden: props.hidden === true }}
    aria-label={props.label}
    onClick={() => props.onTap()}
  >
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d={props.d} />
    </svg>
  </button>
);

/** The old pages of the book, the newest page first. The arrows turn the pages; the cross closes the book. */
const BookBrowser = (props: { readonly pages: Pages; readonly close: () => void }): JSX.Element => {
  const last = props.pages.length - 1;
  const [index, setIndex] = createSignal(last);
  return (
    <div class="book browse">
      <PageView stickers={props.pages[index()] ?? []} />
      <div class="book-bar">
        <IconButton
          class="book-turn"
          label="Previous page"
          d="M60 28 L38 50 L60 72"
          hidden={index() === 0}
          onTap={() => setIndex((page) => Math.max(0, page - 1))}
        />
        <IconButton class="book-close" label="Close" d="M32 32 L68 68 M68 32 L32 68" onTap={props.close} />
        <IconButton
          class="book-turn"
          label="Next page"
          d="M40 28 L62 50 L40 72"
          hidden={index() === last}
          onTap={() => setIndex((page) => Math.min(last, page + 1))}
        />
      </div>
    </div>
  );
};

/**
 * Opens the sticker book over the screen at its newest page (the book icon of the title scene).
 * It reads the book from the save. A tap on a sticker plays it; the cross button closes the book.
 */
export const openBook = (): void => {
  const pages: Pages = loadGame()?.state.book.pages ?? [[]];
  const host = document.createElement('div');
  document.body.append(host);
  const dispose = render(
    () => (
      <BookBrowser
        pages={pages}
        close={() => {
          dispose();
          host.remove();
        }}
      />
    ),
    host
  );
};
