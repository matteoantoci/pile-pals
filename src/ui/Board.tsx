import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { apply, dropCard, isFinished, openCards, placeAnchor, tapDeck } from '../model';
import { watchLifecycle } from '../shell/lifecycle';
import { saveGame } from '../shell/save';
import { checkForUpdate } from '../shell/update';
import { RewardPage } from './book';
import { celebrateLevel, parade } from './celebration';
import { startCoach } from './coach';
import { cancelDrag } from './drag';
import { stillUrl } from './pictures';
import { createSoundGate } from './sound-gate';
import { playEventSounds } from './sounds';
import { hasDeck, raiseCard, TableView } from './table';
import type { Action, CardId, GameState, Outcome, Pile, PileId } from '../model';
import type { Coach } from './coach';
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
  const places = deal.table.length + (hasDeck(deal) ? 1 : 0);
  if (deal.piles.length > 3 || places > 12) {
    return 'small';
  }
  return deal.piles.length > 2 || places > 6 ? 'medium' : 'large';
};

/** A category pile: the anchor picture on its face, and the cards that landed on it. An empty slot has no picture. */
const PileView = (props: { pile: Pile }): JSX.Element => (
  <div class="pile" classList={{ slot: props.pile.picture === null }} data-pile={props.pile.id}>
    <div class="pile-face">
      <Show when={props.pile.picture}>{(picture) => <img src={stillUrl(picture())} alt="" />}</Show>
    </div>
    <div class="pile-cards">
      <For each={props.pile.cards}>{(card) => <img class="pile-card" src={stillUrl(card.picture)} alt="" />}</For>
    </div>
  </div>
);

/** The action of a drop: a category card goes on a slot, and a picture card goes on a pile. The model decides. */
const dropAction = (state: GameState, cardId: CardId, pileId: PileId): Action =>
  openCards(state).some((card) => card.id === cardId && card.anchor)
    ? placeAnchor(cardId, pileId)
    : dropCard(cardId, pileId);

/** What the hooks need from the board: the newest state, the way to draw it, the coach, and the book page. */
type Game = {
  readonly current: () => GameState;
  readonly move: (state: GameState) => void;
  readonly show: () => void;
  readonly rest: () => void;
  readonly showReward: () => void;
};

/** The hooks of one card. A drop plays the sounds of its events and gives true when the card snapped. */
const cardHooks = (game: Game, cardId: CardId): Hooks => {
  let last = false;
  let completed: PileId | undefined;
  let flips: readonly CardId[] = [];
  return {
    targets: pileTargets,
    drop: (pileId) => {
      const outcome = apply(game.current(), dropAction(game.current(), cardId, pileId));
      last = outcome.events.some((event) => event.type === 'levelComplete');
      completed = outcome.events.find((event) => event.type === 'groupComplete')?.pileId;
      flips = outcome.events.flatMap((event) => (event.type === 'flipped' ? [event.cardId] : []));
      playEventSounds(outcome.events);
      game.move(outcome.state);
      return outcome.events.some((event) => event.type === 'snapped' || event.type === 'anchorPlaced');
    },
    landed: () => {
      flips.forEach((flipped) => raiseCard(flipped, (id) => cardHooks(game, id)));
      // The pile shows its new card before the parade copies read their places from the screen.
      game.show();
      const pile = completed === undefined ? undefined : game.current().piles.find((item) => item.id === completed);
      if (pile !== undefined) {
        parade(pile);
      }
      // The finished level is saved with its new sticker, so a reload opens the sticker book page again.
      saveGame(game.current());
      if (last) {
        celebrateLevel(game.showReward);
        return;
      }
      game.rest();
    },
  };
};

/** What the board draws, and the inputs of the table and of the sticker book page. */
type Levels = {
  readonly initial: Accessor<GameState>;
  readonly state: Accessor<GameState>;
  readonly reward: Accessor<boolean>;
  readonly hooksFor: (cardId: CardId) => Hooks;
  readonly onTapDeck: () => void;
  readonly act: (action: Action) => Outcome;
  readonly current: () => GameState;
  readonly coach: Coach;
};

/** The level that the board shows. `first` is the saved level, or a new game (App.tsx reads the save). */
const playLevels = (first: GameState): Levels => {
  const [state, setState] = createSignal(first);
  // A saved level that is finished comes back on its sticker book page.
  const [reward, setReward] = createSignal(isFinished(first));
  // `model` is the state after the last move. The signal gets it when a card lands,
  // so the pile shows the card only at the end of its spring.
  let model = first;

  // The sticker actions of the book page. After `go`, the model and the save hold the next level.
  const act = (action: Action): Outcome => {
    const outcome = apply(model, action);
    model = outcome.state;
    playEventSounds(outcome.events);
    saveGame(model);
    return outcome;
  };

  // The coach shows the demos and the hints. A seen demo goes in the state and in the save at once.
  const coach = startCoach({
    current: () => model,
    record: (next) => {
      model = next;
      saveGame(model);
    },
  });

  const game: Game = {
    current: () => model,
    move: (next) => (model = next),
    show: () => setState(model),
    rest: coach.rest,
    showReward: () => setReward(true),
  };

  return {
    initial: () => first,
    state,
    reward,
    hooksFor: (cardId) => cardHooks(game, cardId),
    onTapDeck: () => {
      act(tapDeck());
      setState(model);
      coach.rest();
    },
    act,
    current: () => model,
    coach,
  };
};

/**
 * One level, then its sticker book page. `onTitle` runs after the green arrow of the book page: the save then
 * holds the next level, and the app shows the title scene (spec: level -> reward -> title scene).
 */
export const Board = (props: {
  readonly initial: GameState;
  readonly askTap: boolean;
  readonly onTitle: () => void;
}): JSX.Element => {
  const { initial, state, reward, hooksFor, onTapDeck, act, current, coach } = playLevels(props.initial);
  const soundGate = createSoundGate(props.askTap, coach.rest);
  onMount(() => {
    const stop = watchLifecycle({
      hidden: () => {
        coach.pause();
        cancelDrag();
        saveGame(current());
      },
      visible: () => {
        checkForUpdate();
        soundGate.check();
      },
    });
    onCleanup(() => {
      stop();
      coach.stop();
    });
    soundGate.start();
  });

  // The table draws each dealt card in a fixed place. A card that left the table stays hidden in its place,
  // so the other cards do not move under the finger.
  return (
    <main class="board" data-size={sizeOf(initial())}>
      <section class="piles">
        <For each={state().piles}>{(pile) => <PileView pile={pile} />}</For>
      </section>
      <TableView initial={initial} state={state} hooksFor={hooksFor} onTapDeck={onTapDeck} />
      <Show when={reward()}>
        <RewardPage book={state().book} act={act} done={props.onTitle} />
      </Show>
      <soundGate.View />
    </main>
  );
};
