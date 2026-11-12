import { For, Show } from 'solid-js';
import { playSound } from '../sound';
import { Crown } from './crown';
import { draggable } from './drag';
import { flip } from './flip';
import { canceled } from './motion';
import { stillUrl } from './pictures';
import type { Card, CardId, GameState, Stack } from '../model';
import type { Hooks } from './drag';
import type { Accessor, JSX } from 'solid-js';

// The table: the stacks of cards and the deck. It draws the dealt level and shows the state after each move.
// The card elements of a level stay in their places, so a card never moves under the finger:
// a card that left the table keeps its place hidden (`.gone`), and a card that turns over stays in its stack.
// The drag code owns the transform of `.card`. No JSX binding writes `transform` or `style` on a card.

/** Gives a card the drag and the lift sound. Only a card that the Child can pick up gets them. */
const makeLive = (card: HTMLElement, hooks: Hooks): void => {
  draggable(card, hooks);
  card.addEventListener('pointerdown', () => playSound('lift'));
};

/**
 * One card in its place. A face-down card shows the back of the card until the flip turns it over.
 * The place does not move with the card: during a drag, it shows the soft yellow outline (styles.css).
 */
const CardView = (props: {
  readonly card: Card;
  readonly faceDown: boolean;
  readonly gone: boolean;
  readonly hooks: Hooks;
  readonly live: boolean;
}): JSX.Element => (
  <div class="card-place">
    <div
      class="card"
      classList={{ gone: props.gone, anchor: props.card.anchor }}
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
        {/* The crown of a category card is on the top edge, half outside the card. A face-down card hides it. */}
        <Show when={props.card.anchor}>
          <Crown />
        </Show>
        <div class="card-back" />
      </div>
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

/** The deck shows one card edge below it for each card, up to this number, so that it looks thicker with more cards. */
const MAX_EDGES = 3;

/** True when the level has a deck place: a deck with cards, or the dealt card of a restored level with an empty deck. */
const hasDeck = (deal: GameState): boolean => deal.deck.length > 0 || deal.dealt !== null;

/**
 * The deck row at the top of the board: the deck in the right grid column, and the card that it gave last to its
 * left. A tap on the deck gives the next card. A level with no deck has no deck row.
 */
export const DeckView = (props: {
  readonly initial: Accessor<GameState>;
  readonly state: Accessor<GameState>;
  readonly hooksFor: (cardId: CardId) => Hooks;
  readonly onTap: () => void;
}): JSX.Element => (
  <Show when={hasDeck(props.initial())}>
    <section class="deck-place">
      <div
        class="deck"
        classList={{ spent: props.state().deck.length === 0 }}
        data-edges={Math.min(MAX_EDGES, props.state().deck.length)}
        onClick={props.onTap}
      >
        <div class="card-back" />
      </div>
      {/* Keyed: each new dealt card gets its own element, so its drag hooks send its own id. */}
      <Show when={props.state().dealt} keyed>
        {(card) => <CardView card={card} faceDown={false} gone={false} hooks={props.hooksFor(card.id)} live={true} />}
      </Show>
    </section>
  </Show>
);

/**
 * The columns of the table, one in each grid column. `initial` is the state that the board started with.
 * A column does not belong to the slot above it.
 */
export const TableView = (props: {
  readonly initial: Accessor<GameState>;
  readonly state: Accessor<GameState>;
  readonly hooksFor: (cardId: CardId) => Hooks;
}): JSX.Element => (
  <section class="table">
    <For each={props.initial().table}>
      {(stack) => <StackView stack={stack} state={props.state()} hooksFor={props.hooksFor} />}
    </For>
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
