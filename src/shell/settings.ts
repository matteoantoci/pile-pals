// The settings of the parent area in localStorage. They are not game data, so a reset of the game keeps them.

/** The key of the sound switch. The value is "off" when the Parent turned the sound effects off. */
const SOUND_KEY = 'pile-pals:sound';

/** The sound switch: true (on) when there is no setting or localStorage is blocked. */
export const loadSoundOn = (): boolean => {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
};

/** Keeps the sound switch for the next launch. A failed write keeps the switch for this session only. */
export const storeSoundOn = (on: boolean): void => {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    // The switch works until the app closes.
  }
};
