import { createEffect, For, on, Show } from 'solid-js';
import { canceled, facePose, RESTING, settle, stop } from './motion';
import { stillUrl } from './pictures';
import type { Pile, PileProgress } from '../model';
import type { JSX } from 'solid-js';

// A category pile (spec, "Pile progress"). The category card stays on top of its slot. It shows a row of dots at its
// bottom, below the picture: one dot for each card of its group, and one full dot for each card on the pile. A card
// that lands slides under the category card. Only WAAPI animates the pile, and only `transform` (src/ui/motion).

/**
 * The start pose of a landed card under the category card: the size of a lifted card face, a little higher. Its rim
 * shows above and at the sides of the category card, never over the dots and never over the columns below.
 */
const TUCK_FROM = { y: -6, scale: 1 };
const TUCK: KeyframeAnimationOptions = { duration: 300, easing: 'cubic-bezier(0, 0, 0.2, 1)' };
/** A dot that fills grows and comes back to its size. */
const POP: KeyframeAnimationOptions = { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1.4)' };

/**
 * The landed card goes under the category card: it is always below the category card, and it shrinks to the size
 * and place of the category card. A new landing stops the slide before it and starts again.
 */
const tuck = (under: HTMLElement): void => {
  stop(under);
  settle(under, [{ transform: facePose(TUCK_FROM) }, { transform: RESTING }], TUCK).finished.catch(canceled);
};

/**
 * A slot and its pile. An empty slot has no picture and no dots. `progress` is `pileProgress` of the pile.
 * The last landed card is under the category card, so the parade (src/ui/celebration/parade.ts) starts on the face.
 */
export const PileView = (props: { readonly pile: Pile; readonly progress: PileProgress | undefined }): JSX.Element => {
  let under: HTMLDivElement | undefined;
  let dots: HTMLDivElement | undefined;
  createEffect(
    on(
      () => props.pile.cards.length,
      (count, before) => {
        // The first run has no count before it: the pile shows its cards with no motion.
        if (before === undefined || count <= before) {
          return;
        }
        if (under) {
          tuck(under);
        }
        // The dot of the new card fills: it grows and comes back to its size.
        const dot = dots?.children.item(count - 1);
        if (dot instanceof HTMLElement) {
          settle(dot, [{ transform: 'scale(1.8)' }, { transform: 'scale(1)' }], POP).finished.catch(canceled);
        }
      }
    )
  );
  return (
    <div class="pile" classList={{ slot: props.pile.picture === null }} data-pile={props.pile.id}>
      <Show when={props.pile.cards.at(-1)}>
        {(card) => (
          <div class="card-face pile-under" ref={(el) => (under = el)}>
            <img src={stillUrl(card().picture)} alt="" />
          </div>
        )}
      </Show>
      <div class="pile-face">
        <Show when={props.pile.picture}>{(picture) => <img src={stillUrl(picture())} alt="" />}</Show>
        <Show when={props.progress}>
          {(progress) => (
            <div class="dots" ref={(el) => (dots = el)}>
              <For each={Array.from({ length: progress().total }, (_, index) => index)}>
                {(index) => <span class="dot" classList={{ full: index < progress().done }} />}
              </For>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
};
