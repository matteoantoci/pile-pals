import { createSignal, For } from 'solid-js';
import { apply, dropCard, start } from '../model';
import { draggable } from './drag';
import { stillUrl } from './pictures';
import type { Card, PileId } from '../model';
import type { Release } from './drag';
import type { JSX } from 'solid-js';

// The board draws the state and shows the events. It contains no game rule.
// The drag code owns the transform of each card. No JSX binding writes `transform`.

/** Finds the pile under the point, or undefined when no pile is there. */
const pileAt = (x: number, y: number): PileId | undefined => {
  const pile = document.elementsFromPoint(x, y).find((el) => el instanceof HTMLElement && el.dataset['pile']);
  return pile instanceof HTMLElement ? pile.dataset['pile'] : undefined;
};

export const Board = (): JSX.Element => {
  const [state, setState] = createSignal(start({ level: 1 }, 1));

  const releaseFor =
    (card: Card): Release =>
    (center) => {
      const pileId = pileAt(center.x, center.y);
      if (pileId === undefined) {
        return false;
      }
      const outcome = apply(state(), dropCard(card.id, pileId));
      setState(outcome.state);
      return outcome.events.some((event) => event.type === 'snapped');
    };

  return (
    <main class="board">
      <section class="piles">
        <For each={state().piles}>
          {(pile) => (
            <div class="pile" data-pile={pile.id}>
              <div class="pile-face">
                <img src={stillUrl(pile.picture)} alt="" />
              </div>
              <div class="pile-cards">
                <For each={pile.cards}>{(card) => <img class="pile-card" src={stillUrl(card.picture)} alt="" />}</For>
              </div>
            </div>
          )}
        </For>
      </section>
      <section class="table">
        <For each={state().table}>
          {(card) => (
            <div class="card" ref={(el) => draggable(el, releaseFor(card))}>
              <div class="card-face">
                <img src={stillUrl(card.picture)} alt="" />
              </div>
            </div>
          )}
        </For>
      </section>
    </main>
  );
};
