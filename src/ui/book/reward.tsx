import { onMount } from 'solid-js';
import { go, placeSticker } from '../../model';
import { GoButton } from '../go-button';
import { PageView } from './page';
import { playable } from './sticker';
import { flyTo, freeDraggable, putAt } from './sticker-drag';
import type { Action, Book, Outcome, Position } from '../../model';
import type { Vec } from '../motion';
import type { JSX } from 'solid-js';

/** What the reward page needs from the board. */
export type RewardProps = {
  /** The book of the finished level: the current page and the new sticker (none when the book is complete). */
  readonly book: Book;
  /** Applies a sticker action to the newest state, plays its sounds, and saves the new state. */
  readonly act: (action: Action) => Outcome;
  /** Runs when the sticker is on the page after `go`: the board then shows the next level. */
  readonly done: () => void;
};

/** The elements that the page reads on the screen. */
type Parts = { page?: HTMLElement; sticker?: HTMLElement; going: boolean };

/** The viewport point of a place on the page. */
const pointOf = (page: HTMLElement, at: Position): Vec => {
  const box = page.getBoundingClientRect();
  return { x: box.left + at.x * box.width, y: box.top + at.y * box.height };
};

/** The place on the page of a viewport point, or undefined when the point is not on the page. */
const placeOf = (page: HTMLElement, point: Vec): Position | undefined => {
  const box = page.getBoundingClientRect();
  const at = { x: (point.x - box.left) / box.width, y: (point.y - box.top) / box.height };
  return at.x >= 0 && at.x <= 1 && at.y >= 0 && at.y <= 1 ? at : undefined;
};

/** The new sticker below the page. It plays when the page opens, and the Child drags it onto the page. */
const NewSticker = (props: {
  readonly award: NonNullable<Book['award']>;
  readonly page: () => HTMLElement | undefined;
  readonly place: (at: Position) => void;
  readonly ref: (el: HTMLElement) => void;
}): JSX.Element => {
  const { picture, play } = playable(props.award);
  const host: { el?: HTMLElement } = {};
  const drop = (center: Vec): boolean => {
    const page = props.page();
    const at = page ? placeOf(page, center) : undefined;
    if (at) {
      props.place(at);
    }
    return at !== undefined;
  };
  onMount(() => {
    const { el } = host;
    const page = props.page();
    if (!el || !page) {
      return;
    }
    if (props.award.at) {
      putAt(el, pointOf(page, props.award.at));
    }
    freeDraggable(el, drop);
    // No motion and no sound on the first frame of a restore.
    if (document.documentElement.dataset['restoring'] === undefined) {
      play(el);
    }
  });
  return (
    <div
      class="sticker new"
      classList={{ gold: props.award.gold }}
      ref={(el) => {
        host.el = el;
        props.ref(el);
      }}
    >
      {picture()}
    </div>
  );
};

/**
 * The reward screen: the current page of the sticker book with the new sticker below it. The Child drags the
 * sticker to any place on the page and taps the green arrow button. With no drag, the sticker goes to a free
 * place by itself. When the book is complete, the stickers of the page dance and no new sticker shows.
 */
export const RewardPage = (props: RewardProps): JSX.Element => {
  const { pages, award } = props.book;
  const parts: Parts = { going: false };

  const onGo = (): void => {
    if (parts.going) {
      return;
    }
    parts.going = true;
    const placed = props.act(go()).events.find((event) => event.type === 'stickerPlaced');
    const { page, sticker } = parts;
    if (placed?.type !== 'stickerPlaced' || !page || !sticker) {
      props.done();
      return;
    }
    flyTo(sticker, pointOf(page, placed.at)).then(props.done, props.done);
  };

  return (
    <div class="book reward">
      <PageView
        stickers={pages.at(-1) ?? []}
        dance={award === null}
        ref={(el) => {
          parts.page = el;
        }}
      />
      <div class="book-bar">
        <div class="book-tray">
          {award ? (
            <NewSticker
              award={award}
              page={() => parts.page}
              place={(at) => props.act(placeSticker(at))}
              ref={(el) => {
                parts.sticker = el;
              }}
            />
          ) : null}
        </div>
        <GoButton onGo={onGo} />
      </div>
    </div>
  );
};
