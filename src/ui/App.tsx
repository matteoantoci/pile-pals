import { createSignal } from 'solid-js';
import { start } from '../model';
import { loadGame, saveGame } from '../shell/save';
import { newSeed } from '../shell/seed';
import { Board } from './Board';
import { openBook } from './book';
import { ParentArea } from './parent/ParentArea';
import { TitleScene } from './title/TitleScene';
import type { GameState } from '../model';
import type { JSX } from 'solid-js';

// The screens of the app: the title scene, the level (spec: title scene -> level -> reward -> title scene), and
// the parent area. The level screen ends with the sticker book page. A restored level skips the title scene
// (spec Module 9). The parent area opens from the title scene and goes back to it.

type Screen =
  | { readonly name: 'title' }
  | { readonly name: 'level'; readonly state: GameState }
  | { readonly name: 'parent' };

/** `restored` is the saved level that main.tsx read before the first frame, or undefined. */
export const App = (props: { readonly restored: GameState | undefined }): JSX.Element => {
  const restored = props.restored;
  const [screen, setScreen] = createSignal<Screen>(restored ? { name: 'level', state: restored } : { name: 'title' });

  // The go button plays the saved level, or level 1 of a new game. The save gets the level before the board
  // shows, so a reload shows the same level again.
  const play = (): void => {
    const state = loadGame()?.state ?? start({ level: 1 }, newSeed());
    saveGame(state);
    setScreen({ name: 'level', state });
  };

  return (
    <>
      {(() => {
        const now = screen();
        if (now.name === 'level') {
          return <Board initial={now.state} onTitle={() => setScreen({ name: 'title' })} />;
        }
        if (now.name === 'parent') {
          return <ParentArea onClose={() => setScreen({ name: 'title' })} />;
        }
        return <TitleScene onGo={play} onOpenBook={openBook} onParent={() => setScreen({ name: 'parent' })} />;
      })()}
    </>
  );
};
