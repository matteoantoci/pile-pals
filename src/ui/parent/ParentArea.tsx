import { createSignal, Show } from 'solid-js';
import { clearSave } from '../../shell/save';
import { storeSoundOn } from '../../shell/settings';
import { isSoundOn, setSoundOn } from '../../sound';
import { Credits } from './credits';
import { ExportCode, RestoreCode } from './save-code';
import type { JSX } from 'solid-js';

// The parent area (spec Module 11). English text is allowed here, because only an adult gets in.
// Content: the sound switch, the export and the restore of the save code, the reset, and the credits.

/** Turns the sound effects on or off. The switch stays for the next launch. */
const SoundSwitch = (): JSX.Element => {
  const [on, setOn] = createSignal(isSoundOn());
  const flip = (): void => {
    const next = !on();
    setSoundOn(next);
    storeSoundOn(next);
    setOn(next);
  };
  return (
    <section class="parent-section">
      <h2>Sound</h2>
      <button type="button" class="parent-switch" role="switch" aria-checked={on()} onClick={flip}>
        Sound effects: {on() ? 'On' : 'Off'}
      </button>
    </section>
  );
};

/** Deletes the saved game after a confirmation. The sound switch is a setting, not game data: it stays. */
const Reset = (): JSX.Element => {
  const [asking, setAsking] = createSignal(false);
  const [note, setNote] = createSignal('');
  const confirm = (): void => {
    setAsking(false);
    setNote(
      clearSave()
        ? 'All game data is deleted. The next game starts at level 1 with an empty sticker book.'
        : 'The game data could not be deleted.'
    );
  };
  return (
    <section class="parent-section">
      <h2>Reset</h2>
      <Show
        when={asking()}
        fallback={
          <button type="button" class="parent-danger" onClick={() => setAsking(true)}>
            Reset game
          </button>
        }
      >
        <p>Delete all game data? The level and the sticker book go away. You cannot undo this.</p>
        <button type="button" class="parent-danger" onClick={confirm}>
          Delete all game data
        </button>
        <button type="button" onClick={() => setAsking(false)}>
          Cancel
        </button>
      </Show>
      <p class="parent-note" aria-live="polite">
        {note()}
      </p>
    </section>
  );
};

export const ParentArea = (props: { readonly onClose: () => void }): JSX.Element => (
  <main class="parent-area">
    <header class="parent-bar">
      <h1>Parent area</h1>
      <button type="button" onClick={() => props.onClose()}>
        Done
      </button>
    </header>
    <SoundSwitch />
    <ExportCode />
    <RestoreCode />
    <Reset />
    <Credits />
  </main>
);
