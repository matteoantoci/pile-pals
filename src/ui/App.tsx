import { createSignal } from 'solid-js';
import { start } from '../model';
import { loadGame, saveGame } from '../shell/save';
import { newSeed } from '../shell/seed';
import { Board } from './Board';
import { TitleScene } from './title/TitleScene';
import type { GameState } from '../model';
import type { JSX } from 'solid-js';

// The screens of the app: the title scene and the level (spec: title scene -> level -> reward -> title scene).
// A restored level skips the title scene (spec Module 9).

type Screen = { readonly name: 'title' } | { readonly name: 'level'; readonly state: GameState };

/** `restored` is the saved level that main.tsx read before the first frame, or undefined. */
export const App = (props: { readonly restored: GameState | undefined }): JSX.Element => {
  const restored = props.restored;
  const [screen, setScreen] = createSignal<Screen>(restored ? { name: 'level', state: restored } : { name: 'title' });

  // The go button plays the saved level, or level 1 of a new game. The save gets the level before the board
  // shows, so a reload for an update at the start of the level shows the same level again.
  const play = (): void => {
    const state = loadGame()?.state ?? start({ level: 1 }, newSeed());
    saveGame(state);
    setScreen({ name: 'level', state });
  };

  return (
    <>
      {(() => {
        const now = screen();
        return now.name === 'title' ? <TitleScene onGo={play} /> : <Board initial={now.state} />;
      })()}
    </>
  );
};
