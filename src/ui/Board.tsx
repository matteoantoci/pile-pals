import { createSignal, For } from 'solid-js';
import { apply, dropCard, start } from '../model';
import { playSound } from '../sound';
import { draggable } from './drag';
import { stillUrl } from './pictures';
import { playEventSounds } from './sounds';
import type { Card, Pile } from '../model';
import type { Hooks, Target } from './drag';
import type { JSX } from 'solid-js';

// The board draws the state and shows the events. It contains no game rule.
// The drag code owns the transform of each card. No JSX binding writes `transform` or `style` on `.card`.

/** The drop targets: the centre of each pile face. The model decides if the pile accepts the card. */
const pileTargets = (): readonly Target[] =>
  [...document.querySelectorAll<HTMLElement>('[data-pile]')].flatMap((pile) => {
    const face = pile.querySelector('.pile-face');
    const id = pile.dataset['pile'];
    if (!face || id === undefined) {
      return [];
    }
    const box = face.getBoundingClientRect();
    return [{ id, at: { x: box.left + box.width / 2, y: box.top + box.height / 2 } }];
  });

/** A category pile: the anchor picture on its face, and the cards that landed on it. */
const PileView = (props: { pile: Pile }): JSX.Element => (
  <div class="pile" data-pile={props.pile.id}>
    <div class="pile-face">
      <img src={stillUrl(props.pile.picture)} alt="" />
    </div>
    <div class="pile-cards">
      <For each={props.pile.cards}>{(card) => <img class="pile-card" src={stillUrl(card.picture)} alt="" />}</For>
    </div>
  </div>
);

export const Board = (): JSX.Element => {
  const dealt = start({ level: 1 }, 1);
  const [state, setState] = createSignal(dealt);
  // `model` is the state after the last drop. The signal gets it when a card lands,
  // so the pile shows the card only at the end of its spring.
  let model = dealt;

  const hooksFor = (card: Card): Hooks => ({
    targets: pileTargets,
    drop: (pileId) => {
      const outcome = apply(model, dropCard(card.id, pileId));
      model = outcome.state;
      playEventSounds(outcome.events);
      return outcome.events.some((event) => event.type === 'snapped');
    },
    landed: () => setState(model),
  });

  // The table draws each dealt card in a fixed place. A card that left the table stays hidden in its place,
  // so the other cards do not move under the finger.
  return (
    <main class="board">
      <section class="piles">
        <For each={state().piles}>{(pile) => <PileView pile={pile} />}</For>
      </section>
      <section class="table">
        <For each={dealt.table}>
          {(card) => (
            <div
              class="card"
              classList={{ gone: !state().table.includes(card) }}
              ref={(el) => draggable(el, hooksFor(card))}
              onPointerDown={() => playSound('lift')}
            >
              <div class="card-shadow" />
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
