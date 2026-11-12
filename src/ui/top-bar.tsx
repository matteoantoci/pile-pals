import { saveGame } from '../shell/save';
import { cancelDrag } from './drag';
import type { GameState } from '../model';
import type { JSX } from 'solid-js';

// The top bar of the board (spec, "Top bar and hint button"): the home button at the left and the level number at the
// centre. The level number is the only text on the board. The board has no hint button: the coach hops the hint after
// a time with no action. The styles are in src/ui/styles.css: the top bar uses --top-space of the board.

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
