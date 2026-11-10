import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { checkForUpdate, openSafeWindow } from '../../shell/update';
import { GoButton } from '../go-button';
import { ParentCheck } from '../parent/ParentCheck';
import { Logo } from './logo';
import { runTitleLoop } from './loop';
import type { JSX } from 'solid-js';

// The title scene (spec Module 10): the logo, the pals that hop and fall into 3 small piles, and the green
// go button. The scene waits for the Child: nothing starts the level but the go button.
// Before the first touch, the scene is a safe point for an app update (spec Module 9). The first touch also
// unlocks the audio: src/sound listens to the first pointer events on the document.
// A 3-second hold on the logo shows the parent check (spec Module 11).

export type TitleProps = {
  /** The go button: start the level. */
  readonly onGo: () => void;
  /** Opens the sticker book. The book icon shows only when this is set. */
  readonly onOpenBook?: () => void;
  /** The parent check is passed: open the parent area. */
  readonly onParent: () => void;
};

/** The book icon: a closed book with a star on the cover. */
const BookButton = (props: { readonly onOpen: () => void }): JSX.Element => (
  <button type="button" class="book-button" aria-label="Sticker book" onClick={() => props.onOpen()}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <rect class="book-cover" x="22" y="14" width="60" height="74" rx="8" />
      <rect class="book-spine" x="22" y="14" width="12" height="74" rx="4" />
      <path class="book-star" d="M58 32 L63 44 L76 45 L66 53 L69 66 L58 59 L47 66 L50 53 L40 45 L53 44 Z" />
    </svg>
  </button>
);

/** A return of the page to the front: look for a new version. In the safe window, it then applies. */
const onVisible = (): void => {
  if (document.visibilityState === 'visible') {
    checkForUpdate();
  }
};

/** Keeps the safe window open until the first touch, and looks for a new version when the page shows again. */
const watchSafePoint = (): void => {
  const closeSafeWindow = openSafeWindow();
  document.addEventListener('pointerdown', closeSafeWindow, { capture: true, once: true, passive: true });
  document.addEventListener('visibilitychange', onVisible);
  onCleanup(() => {
    closeSafeWindow();
    document.removeEventListener('pointerdown', closeSafeWindow, { capture: true });
    document.removeEventListener('visibilitychange', onVisible);
  });
};

export const TitleScene = (props: TitleProps): JSX.Element => {
  let stage: HTMLElement | undefined;
  const [checking, setChecking] = createSignal(false);
  onMount(() => {
    watchSafePoint();
    if (stage) {
      onCleanup(runTitleLoop(stage));
    }
  });
  return (
    <main class="title">
      <header class="title-top">
        <Logo onHold={() => setChecking(true)} />
        <Show when={props.onOpenBook}>{(open) => <BookButton onOpen={open()} />}</Show>
      </header>
      <section
        class="title-stage"
        ref={(el) => {
          stage = el;
        }}
      >
        <div class="title-piles" aria-hidden="true">
          <div class="title-pile" />
          <div class="title-pile" />
          <div class="title-pile" />
        </div>
        <div class="title-pals" />
      </section>
      <GoButton onGo={() => props.onGo()} />
      <Show when={checking()}>
        <ParentCheck onPass={() => props.onParent()} onClose={() => setChecking(false)} />
      </Show>
    </main>
  );
};
