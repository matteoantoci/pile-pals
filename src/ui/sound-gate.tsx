import { createSignal, Show } from 'solid-js';
import { audioNeedsTap, isSoundOn } from '../sound';
import { GoButton } from './go-button';
import type { JSX } from 'solid-js';

// iOS starts the sound only in a tap, and the end of a drag is not a tap. A board that shows with no tap before
// it (a restore at launch, or a return from the background) is covered by the go button. Its tap starts the
// sound (the unlock listeners of src/sound), and the first touch on the board is then a normal drag.

const needsTap = (): boolean => isSoundOn() && audioNeedsTap();

export type SoundGate = {
  /** Call at mount: runs `onReady` now, or after the tap if the go button shows. */
  readonly start: () => void;
  /** Call on a return from the background: shows the go button if the sound needs a tap, else runs `onReady`. */
  readonly check: () => void;
  readonly View: () => JSX.Element;
};

/** `askTap`: the board shows with no tap before it. `onReady`: the board is ready for play (the coach starts). */
export const createSoundGate = (askTap: boolean, onReady: () => void): SoundGate => {
  const [shown, setShown] = createSignal(askTap && needsTap());
  const start = (): void => {
    if (!shown()) {
      onReady();
    }
  };
  const open = (): void => {
    setShown(false);
    onReady();
  };
  return {
    start,
    check: () => {
      if (needsTap()) {
        setShown(true);
      }
      start();
    },
    View: () => (
      <Show when={shown()}>
        <div class="sound-gate">
          <GoButton onGo={open} />
        </div>
      </Show>
    ),
  };
};
