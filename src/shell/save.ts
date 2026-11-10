// The save in localStorage. Rules from research/native-feel/shell.md §3:
// - Write after each resolved move, because a kill can come with no event.
// - Save the state after the move, never the animation.
// - A save that this build cannot read gives a new game, not an error.

import { restore, snapshot } from '../model';
import type { GameState, RestoredGame } from '../model';

/** The key of the save in localStorage. The schema version is inside the data (`SaveData.version`). */
const SAVE_KEY = 'pile-pals:save';

/**
 * Writes the whole state. Furthest ticket 06, 11, and 12 fields go with it, because the data is the state itself.
 * A failed write (full storage or a blocked origin) must not stop the game; the next move tries again.
 */
export const saveGame = (state: GameState): void => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot(state)));
  } catch {
    // No save this time.
  }
};

/** The saved state and progress, or undefined when there is no save or this build cannot read it. */
export const loadGame = (): RestoredGame | undefined => {
  let raw: string | null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    return undefined;
  }
  if (raw === null) {
    return undefined;
  }
  try {
    const result = restore(JSON.parse(raw));
    return result.ok ? result : undefined;
  } catch {
    // JSON.parse throws on damaged data.
    return undefined;
  }
};
