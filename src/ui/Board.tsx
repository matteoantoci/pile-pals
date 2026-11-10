import { batch, createSignal, For, onMount } from 'solid-js';
import { apply, dropCard, nextLevel, tapDeck } from '../model';
import { watchLifecycle } from '../shell/lifecycle';
import { saveGame } from '../shell/save';
import { applyUpdateIfWaiting, checkForUpdate } from '../shell/update';
import { celebrateLevel, parade } from './celebration';
import { cancelDrag } from './drag';
import { stillUrl } from './pictures';
import { playEventSounds } from './sounds';
import { raiseCard, TableView } from './table';
import type { CardId, GameState, Pile, PileId } from '../model';
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
  readonly current: () => GameState;
  readonly move: (state: GameState) => void;
  readonly show: () => void;
  readonly dealNext: () => void;
};

/** The hooks of one card. A drop plays the sounds of its events and gives true when the card snapped. */
const cardHooks = (game: Game, cardId: CardId): Hooks => {
  let last = false;
  let completed: PileId | undefined;
  let flips: readonly CardId[] = [];
  return {
    targets: pileTargets,
    drop: (pileId) => {
      const outcome = apply(game.current(), dropCard(cardId, pileId));
      last = outcome.events.some((event) => event.type === 'levelComplete');
      completed = outcome.events.find((event) => event.type === 'groupComplete')?.pileId;
      flips = outcome.events.flatMap((event) => (event.type === 'flipped' ? [event.cardId] : []));
      playEventSounds(outcome.events);
      game.move(outcome.state);
      return outcome.events.some((event) => event.type === 'snapped');
    },
    landed: () => {
      flips.forEach((flipped) => raiseCard(flipped, (id) => cardHooks(game, id)));
      // The pile shows its new card before the parade copies read their places from the screen.
      game.show();
      const pile = completed === undefined ? undefined : game.current().piles.find((item) => item.id === completed);
      if (pile !== undefined) {
        parade(pile);
      }
      if (last) {
        celebrateLevel(game.dealNext);
      } else {
        saveGame(game.current());
      }
    },
  };
};

/** The levels that the board shows. `first` is the saved level, or a new game (main.tsx reads the save). */
const playLevels = (
  first: GameState
): {
  readonly dealt: Accessor<GameState>;
  readonly state: Accessor<GameState>;
  readonly hooksFor: (cardId: CardId) => Hooks;
  readonly onTapDeck: () => void;
  readonly current: () => GameState;
} => {
  const [dealt, setDealt] = createSignal(first);
  const [state, setState] = createSignal(first);
  // `model` is the state after the last move. The signal gets it when a card lands,
  // so the pile shows the card only at the end of its spring.
  let model = first;

  // The celebration plays first, then the next level replaces the table. Ticket 11 adds the sticker book.
  const dealNext = (): void => {
    model = nextLevel(model);
    batch(() => {
      setDealt(model);
      setState(model);
    });
    saveGame(model);
    applyUpdateIfWaiting();
  };

  const game: Game = { current: () => model, move: (next) => (model = next), show: () => setState(model), dealNext };

  const onTapDeck = (): void => {
    const outcome = apply(model, tapDeck());
    model = outcome.state;
    setState(model);
    playEventSounds(outcome.events);
    saveGame(model);
  };

  return {
    dealt,
    state,
    hooksFor: (cardId) => cardHooks(game, cardId),
    onTapDeck,
    current: () => model,
  };
};

export const Board = (props: { readonly initial: GameState }): JSX.Element => {
  const { dealt, state, hooksFor, onTapDeck, current } = playLevels(props.initial);
  onMount(() => {
    watchLifecycle({
      hidden: () => {
        cancelDrag();
        // `nextLevel` returns the same state until the level is finished. A page can hide during the
        // celebration, so save the next level then instead of a table with no cards.
        saveGame(nextLevel(current()));
      },
      visible: checkForUpdate,
    });
    // A safe point for a waiting update: the level starts and nobody has touched it yet.
    applyUpdateIfWaiting();
  });

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
