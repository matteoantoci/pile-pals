import { createSignal, Show } from 'solid-js';
import { readSaveCode, saveCode, snapshot } from '../../model';
import { loadGame, saveGame } from '../../shell/save';
import type { RestoreFailure } from '../../model';
import type { JSX } from 'solid-js';

// The export and the restore of the save code (spec user stories 52 and 53). The code holds the saved game of
// localStorage, in the save format of this build (`snapshot`, `restore`).

const REFUSED: Readonly<Record<RestoreFailure, string>> = {
  version: 'This save code is from a different version of Pile Pals. It cannot be read.',
  shape: 'This is not a save code. Paste the full code.',
};

/** Makes the code of the saved game and shows it, with a copy button. */
export const ExportCode = (): JSX.Element => {
  const [code, setCode] = createSignal('');
  const [note, setNote] = createSignal('');
  const make = async (): Promise<void> => {
    const saved = loadGame();
    if (!saved) {
      setNote('There is no saved game yet.');
      return;
    }
    setCode(await saveCode(snapshot(saved.state)));
    setNote('Keep this code in a safe place, for example in a note.');
  };
  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(code());
    setNote('The code is copied.');
  };
  return (
    <section class="parent-section">
      <h2>Export save code</h2>
      <p>The save code holds the game: the level and the sticker book.</p>
      <button
        type="button"
        onClick={() => {
          make().catch(() => setNote('The save code could not be made.'));
        }}
      >
        Make save code
      </button>
      <Show when={code() !== ''}>
        <textarea class="parent-code" readonly rows="5" value={code()} aria-label="Save code" />
        <button
          type="button"
          onClick={() => {
            copy().catch(() => setNote('Copy did not work. Select the code and copy it.'));
          }}
        >
          Copy
        </button>
      </Show>
      <p class="parent-note" aria-live="polite">
        {note()}
      </p>
    </section>
  );
};

/** Reads a pasted save code and replaces the saved game with the game of the code. */
export const RestoreCode = (): JSX.Element => {
  const [text, setText] = createSignal('');
  const [note, setNote] = createSignal('');
  const run = async (): Promise<void> => {
    const result = await readSaveCode(text());
    if (!result.ok) {
      setNote(REFUSED[result.reason]);
      return;
    }
    saveGame(result.state);
    if (!loadGame()) {
      setNote('The game could not be saved on this device.');
      return;
    }
    setText('');
    setNote(`The game is restored at level ${String(result.state.level)}. Tap Done, then play.`);
  };
  return (
    <section class="parent-section">
      <h2>Restore save code</h2>
      <p>Paste a save code. Its game replaces the game on this device.</p>
      <textarea
        class="parent-code"
        rows="5"
        value={text()}
        aria-label="Save code to restore"
        autocomplete="off"
        spellcheck={false}
        onInput={(event) => setText(event.currentTarget.value)}
      />
      <button
        type="button"
        disabled={text().trim() === ''}
        onClick={() => {
          run().catch(() => setNote(REFUSED.shape));
        }}
      >
        Restore
      </button>
      <p class="parent-note" aria-live="polite">
        {note()}
      </p>
    </section>
  );
};
