import { batch, createSignal, For, onMount } from 'solid-js';
import { apply, dropCard, nextLevel } from '../model';
import { watchLifecycle } from '../shell/lifecycle';
import { saveGame } from '../shell/save';
import { applyUpdateIfWaiting, checkForUpdate } from '../shell/update';
import { playSound } from '../sound';
import { celebrateLevel, parade } from './celebration';
import { cancelDrag, draggable } from './drag';
import { stillUrl } from './pictures';
import { playEventSounds } from './sounds';
import type { Card, GameEvent, GameState, Pile, PileId } from '../model';
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

/** The pile of the group that a drop completed, or undefined when the drop completed no group. */
const completedPile = (events: readonly GameEvent[]): PileId | undefined =>
  events.find((event) => event.type === 'groupComplete')?.pileId;

/** The card size of the board. A level with more piles and cards gets smaller cards, so that all fit on the screen. */
const sizeOf = (deal: GameState): string => {
  if (deal.piles.length > 3 || deal.table.length > 15) {
    return 'small';
  }
  return deal.piles.length > 2 || deal.table.length > 8 ? 'medium' : 'large';
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

/** The levels that the board shows. `first` is the saved level, or a new game (main.tsx reads the save). */
const playLevels = (
  first: GameState
): {
  readonly dealt: Accessor<GameState>;
  readonly state: Accessor<GameState>;
  readonly hooksFor: (card: Card) => Hooks;
  readonly current: () => GameState;
} => {
  const [dealt, setDealt] = createSignal(first);
  const [state, setState] = createSignal(first);
  // `model` is the state after the last drop. The signal gets it when a card lands,
  // so the pile shows the card only at the end of its spring.
  let model = first;

  // When the last card of the level lands, the celebration plays, then the next level replaces the table.
  // Ticket 11 puts the sticker book in the `afterCelebration` hook of `celebrateLevel`.
  const dealNext = (): void => {
    model = nextLevel(model);
    batch(() => {
      setDealt(model);
      setState(model);
    });
    saveGame(model);
    // A new level starts and the Child has not touched it: ticket 10 and 11 move this call to their screens.
    applyUpdateIfWaiting();
  };

  const hooksFor = (card: Card): Hooks => {
    // True when the drop of this card finished the level.
    let last = false;
    // The pile of the group that the drop completed, if it completed one.
    let completed: PileId | undefined;
    return {
      targets: pileTargets,
      drop: (pileId) => {
        const outcome = apply(model, dropCard(card.id, pileId));
        model = outcome.state;
        last = outcome.events.some((event) => event.type === 'levelComplete');
        completed = completedPile(outcome.events);
        playEventSounds(outcome.events);
        return outcome.events.some((event) => event.type === 'snapped');
      },
      // The move is resolved when the card lands: save it then, never in the middle of an animation.
      landed: () => {
        // The pile shows its new card before the parade copies read their places from the screen.
        setState(model);
        const pile = completed === undefined ? undefined : model.piles.find((item) => item.id === completed);
        if (pile !== undefined) {
          parade(pile);
        }
        if (last) {
          // The celebration runs first, then `dealNext` saves the next level.
          celebrateLevel(dealNext);
          return;
        }
        saveGame(model);
      },
    };
  };
  return { dealt, state, hooksFor, current: () => model };
};

export const Board = (props: { readonly initial: GameState }): JSX.Element => {
  const { dealt, state, hooksFor, current } = playLevels(props.initial);
  onMount(() => {
    // The shell saves after each resolved move, and saves again and cancels the drag when the page goes hidden.
    watchLifecycle({
      hidden: () => {
        cancelDrag();
        // A page can hide during the celebration, before `dealNext` runs: save the next level,
        // because a level with no card on the table is finished and the Child cannot play it again.
        const state = current();
        saveGame(state.table.length === 0 ? nextLevel(state) : state);
      },
      visible: checkForUpdate,
    });
    // A safe point for a waiting update: the level starts and nobody has touched it yet (shell.md §4).
    applyUpdateIfWaiting();
  });

  // The table draws each dealt card in a fixed place. A card that left the table stays hidden in its place,
  // so the other cards do not move under the finger.
  return (
    <main class="board" data-size={sizeOf(dealt())}>
      <section class="piles">
        <For each={state().piles}>{(pile) => <PileView pile={pile} />}</For>
      </section>
      <section class="table">
        <For each={dealt().table}>
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
