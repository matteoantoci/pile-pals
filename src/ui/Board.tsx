import { batch, createSignal, For } from 'solid-js';
import { apply, dropCard, nextLevel, start, tapDeck } from '../model';
import { stillUrl } from './pictures';
import { playEventSounds } from './sounds';
import { raiseCard, TableView } from './table';
import type { CardId, GameState, Pile } from '../model';
import type { Hooks, Target } from './drag';
import type { Accessor, JSX } from 'solid-js';

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

/**
 * The card size of the board. A level with more piles and places gets smaller cards, so that all fit on the screen.
 * A "place" is a stack of the table or the deck. The numbers keep the table within three rows of its size.
 */
const sizeOf = (deal: GameState): string => {
  const places = deal.table.length + (deal.deck.length > 0 ? 1 : 0);
  if (deal.piles.length > 3 || places > 12) {
    return 'small';
  }
  return deal.piles.length > 2 || places > 6 ? 'medium' : 'large';
};

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

/** What the hooks need from the board: the newest state, the way to draw it, and the next level. */
type Game = {
  /** The newest state: the state after the last move. */
  readonly current: () => GameState;
  /** Keeps a new state. The board draws it when the card lands. */
  readonly move: (state: GameState) => void;
  /** Draws the newest state. */
  readonly show: () => void;
  /** Deals the next level. */
  readonly dealNext: () => void;
};

/** The hooks of one card. A drop plays the sounds of its events and gives true when the card snapped. */
const cardHooks = (game: Game, cardId: CardId): Hooks => {
  // True when the drop of this card finished the level.
  let last = false;
  // The cards that the drop turns over. They turn over when the dropped card has landed.
  let flips: readonly CardId[] = [];
  return {
    targets: pileTargets,
    drop: (pileId) => {
      const outcome = apply(game.current(), dropCard(cardId, pileId));
      last = outcome.events.some((event) => event.type === 'levelComplete');
      flips = outcome.events.flatMap((event) => (event.type === 'flipped' ? [event.cardId] : []));
      playEventSounds(outcome.events);
      game.move(outcome.state);
      return outcome.events.some((event) => event.type === 'snapped');
    },
    landed: () => {
      flips.forEach((flipped) => raiseCard(flipped, (id) => cardHooks(game, id)));
      if (last) {
        game.dealNext();
      } else {
        game.show();
      }
    },
  };
};

/** The levels that the board shows: the dealt level, the state that the board draws, and the hooks of each card. */
const playLevels = (): {
  readonly dealt: Accessor<GameState>;
  readonly state: Accessor<GameState>;
  readonly hooksFor: (cardId: CardId) => Hooks;
  readonly onTapDeck: () => void;
} => {
  const [dealt, setDealt] = createSignal(start({ level: 1 }, 1));
  const [state, setState] = createSignal(dealt());
  // `model` is the state after the last move. The signal gets it when a card lands,
  // so the pile shows the card only at the end of its spring.
  let model = dealt();

  // When the last card of the level lands, the next level replaces the table. Ticket 08 adds the celebration first.
  const dealNext = (): void => {
    model = nextLevel(model);
    batch(() => {
      setDealt(model);
      setState(model);
    });
  };

  const game: Game = { current: () => model, move: (next) => (model = next), show: () => setState(model), dealNext };

  const onTapDeck = (): void => {
    const outcome = apply(model, tapDeck());
    model = outcome.state;
    setState(model);
    playEventSounds(outcome.events);
  };

  return { dealt, state, hooksFor: (cardId) => cardHooks(game, cardId), onTapDeck };
};

export const Board = (): JSX.Element => {
  const { dealt, state, hooksFor, onTapDeck } = playLevels();

  // The table draws each dealt card in a fixed place. A card that left the table stays hidden in its place,
  // so the other cards do not move under the finger.
  return (
    <main class="board" data-size={sizeOf(dealt())}>
      <section class="piles">
        <For each={state().piles}>{(pile) => <PileView pile={pile} />}</For>
      </section>
      <TableView dealt={dealt} state={state} hooksFor={hooksFor} onTapDeck={onTapDeck} />
    </main>
  );
};
