import { For, Show } from 'solid-js';
import { playSound } from '../sound';
import { draggable } from './drag';
import { flip } from './flip';
import { stillUrl } from './pictures';
import type { Card, CardId, GameState, Stack } from '../model';
import type { Hooks } from './drag';
import type { Accessor, JSX } from 'solid-js';

// The table: the stacks of cards and the deck. It draws the dealt level and shows the state after each move.
// The card elements of a level stay in their places, so a card never moves under the finger:
// a card that left the table keeps its place hidden (`.gone`), and a card that turns over stays in its stack.
// The drag code owns the transform of `.card`. No JSX binding writes `transform` or `style` on a card.

/** A canceled animation rejects its `finished` promise. The next animation then owns the card. */
const canceled = (): void => undefined;

/** Gives a card the drag and the lift sound. Only a card that the Child can pick up gets them. */
const makeLive = (card: HTMLElement, hooks: Hooks): void => {
  draggable(card, hooks);
  card.addEventListener('pointerdown', () => playSound('lift'));
};

/** One card. A face-down card shows the back of the card until the flip turns it over. */
const CardView = (props: {
  readonly card: Card;
  readonly faceDown: boolean;
  readonly gone: boolean;
  readonly hooks: Hooks;
  readonly live: boolean;
}): JSX.Element => (
  <div
    class="card"
    classList={{ gone: props.gone }}
    data-card={props.card.id}
    ref={(el) => {
      el.setAttribute('data-face', props.faceDown ? 'down' : 'up');
      if (props.live) {
        makeLive(el, props.hooks);
      }
    }}
  >
    <div class="card-shadow" />
    <div class="card-face">
      <img class="card-front" src={stillUrl(props.card.picture)} alt="" />
      <div class="card-back" />
    </div>
  </div>
);

/** One stack of the table. The last card is on top: only it moves. */
const StackView = (props: {
  readonly stack: Stack;
  readonly state: GameState;
  readonly hooksFor: (cardId: CardId) => Hooks;
}): JSX.Element => (
  <div class="stack">
    <For each={props.stack.cards}>
      {(card, index) => (
        <CardView
          card={card}
          faceDown={card.faceDown}
          gone={!props.state.table.some((stack) => stack.cards.some((own) => own.id === card.id))}
          hooks={props.hooksFor(card.id)}
          live={!card.faceDown && index() === props.stack.cards.length - 1}
        />
      )}
    </For>
  </div>
);

/** The deck and the card that it gave last. A tap on the deck gives the next card. */
const DeckView = (props: {
  readonly state: GameState;
  readonly hooksFor: (cardId: CardId) => Hooks;
  readonly onTap: () => void;
}): JSX.Element => (
  <div class="deck-place">
    <div class="deck" classList={{ spent: props.state.deck.length === 0 }} onClick={props.onTap}>
      <div class="card-back" />
    </div>
    <Show when={props.state.dealt}>
      {(card) => <CardView card={card()} faceDown={false} gone={false} hooks={props.hooksFor(card().id)} live={true} />}
    </Show>
  </div>
);

/** The table of the level: the stacks and the deck. */
export const TableView = (props: {
  readonly dealt: Accessor<GameState>;
  readonly state: Accessor<GameState>;
  readonly hooksFor: (cardId: CardId) => Hooks;
  readonly onTapDeck: () => void;
}): JSX.Element => (
  <section class="table">
    <For each={props.dealt().table}>
      {(stack) => <StackView stack={stack} state={props.state()} hooksFor={props.hooksFor} />}
    </For>
    <Show when={props.dealt().deck.length > 0}>
      <DeckView state={props.state()} hooksFor={props.hooksFor} onTap={props.onTapDeck} />
    </Show>
  </section>
);

/** Turns over a card that a move uncovered, and then lets the Child pick it up. */
export const raiseCard = (cardId: CardId, hooksFor: (id: CardId) => Hooks): void => {
  const card = document.querySelector<HTMLElement>(`[data-card="${cardId}"]`);
  const face = card?.querySelector<HTMLElement>('.card-face');
  if (!card || !face) {
    return;
  }
  flip(face, () => {
    card.setAttribute('data-face', 'up');
  })
    .then(() => makeLive(card, hooksFor(cardId)))
    .catch(canceled);
};
