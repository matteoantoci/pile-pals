import { saveGame } from '../shell/save';
import { cancelDrag } from './drag';
import type { GameState } from '../model';
import type { JSX } from 'solid-js';

// The buttons of the board (spec, "Top bar and hint button"). The top bar has the home button at the left and the
// level number at the centre. The level number is the only text on the board. The hint bulb is at the bottom.
// The styles are in src/ui/styles.css: the top bar uses --top-space and the bulb uses --bottom-space of the board.

/** The top bar. Home keeps the level in the save and goes to the title scene, where the go button opens it again. */
export const TopBar = (props: {
  readonly level: number;
  readonly current: () => GameState;
  readonly onHome: () => void;
}): JSX.Element => {
  const home = (): void => {
    cancelDrag();
    saveGame(props.current());
    props.onHome();
  };
  return (
    <header class="top-bar">
      <button type="button" class="home-button" aria-label="Home" onClick={home}>
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M7 23 L24 8 L41 23 M12 19 V40 H36 V19 M20 40 V29 H28 V40" />
        </svg>
      </button>
      <span class="level-number">{props.level}</span>
    </header>
  );
};

/** The hint bulb: each tap hops the card or the deck of the hint. It costs nothing and works at any time. */
export const HintBulb = (props: { readonly onHint: () => void }): JSX.Element => (
  <button type="button" class="hint-bulb" aria-label="Hint" onClick={() => props.onHint()}>
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M18 31 C12 27 11 21 13 16 C15 11 19 8 24 8 C29 8 33 11 35 16 C37 21 36 27 30 31 V34 H18 Z" />
      <path d="M19 39 H29 M21 43 H27" />
    </svg>
  </button>
);
