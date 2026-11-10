// The save data of the game. All data is plain JSON, so localStorage and a save code can hold it.
// The UI stores it after each resolved move (research/native-feel/shell.md §3).

import type { Card, GameState, Pile, Progress } from './types';

/**
 * The schema version of `SaveData`. A save with another version is not read.
 * Raise this number when `restore` cannot read the data of the older version.
 */
export const SAVE_VERSION = 1;

/**
 * The data of one save.
 * `state` is the level that the Child plays, whole: the deal, not only the seed.
 * `progress` is what the Child finished. Later tickets add the stickers, their positions on each page,
 * and the flags of the demos that the Child already saw.
 */
export type SaveData = {
  readonly version: number;
  readonly state: GameState;
  readonly progress: Progress;
};

/** Why `restore` refused a save. `version`: a schema version that this build does not know. `shape`: not save data. */
export type RestoreFailure = 'version' | 'shape';

/** `restore` gives the state and the progress that the Child comes back to. */
export type RestoredGame = {
  readonly state: GameState;
  readonly progress: Progress;
};

export type RestoreResult =
  | ({ readonly ok: true } & RestoredGame)
  | { readonly ok: false; readonly reason: RestoreFailure };

/** The `id` and `group` fields of a card or a pile, after the check that the value is an object. */
const isWithId = (value: unknown): value is { readonly id: string; readonly group: string } =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string' &&
  'group' in value &&
  typeof value.group === 'string';

/** A type guard narrows, so `restore` gives typed data after each check. */
const isCard = (value: unknown): value is Card =>
  isWithId(value) && 'picture' in value && typeof value.picture === 'string';

const isPile = (value: unknown): value is Pile =>
  isWithId(value) &&
  'picture' in value &&
  typeof value.picture === 'string' &&
  'cards' in value &&
  Array.isArray(value.cards) &&
  value.cards.every(isCard);

/** The `level` and `seed` of a state. */
const isLevelSeed = (value: unknown): value is { readonly level: number; readonly seed: number } =>
  typeof value === 'object' &&
  value !== null &&
  'level' in value &&
  typeof value.level === 'number' &&
  'seed' in value &&
  typeof value.seed === 'number';

/**
 * The checks of the fields of `GameState` that this build knows. A field of a later ticket passes
 * without a check; `restore` then keeps it in the state as it is.
 */
const isState = (value: unknown): value is GameState =>
  isLevelSeed(value) &&
  'table' in value &&
  Array.isArray(value.table) &&
  value.table.every(isCard) &&
  'piles' in value &&
  Array.isArray(value.piles) &&
  value.piles.every(isPile);

const isProgress = (value: unknown): value is Progress =>
  typeof value === 'object' && value !== null && 'level' in value && typeof value.level === 'number';

/** The version comes first: a save of an older build may fail the checks of the shape. */
const isVersioned = (value: unknown): value is { readonly version: number } =>
  typeof value === 'object' && value !== null && 'version' in value && typeof value.version === 'number';

const isSaveData = (value: { readonly version: number }): value is SaveData =>
  'state' in value && isState(value.state) && 'progress' in value && isProgress(value.progress);

/** The save data of one state. The progress is the level of the state until a ticket adds more to it. */
export const snapshot = (state: GameState): SaveData => ({
  version: SAVE_VERSION,
  state,
  progress: { level: state.level },
});

/**
 * Reads save data that comes from localStorage or from a save code. It never throws: a save that this build
 * cannot read gives a failure reason, and the UI starts a new game.
 */
export const restore = (save: unknown): RestoreResult => {
  if (!isVersioned(save)) {
    return { ok: false, reason: 'shape' };
  }
  if (save.version !== SAVE_VERSION) {
    return { ok: false, reason: 'version' };
  }
  if (!isSaveData(save)) {
    return { ok: false, reason: 'shape' };
  }
  return { ok: true, state: save.state, progress: save.progress };
};
