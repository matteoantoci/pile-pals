// The public interface of the game model. The UI and the tests import only from this file.
// The model is pure TypeScript: no DOM, no time, no audio.

export { apply, dropCard, placeAnchor, tapDeck } from './apply';
export { catalog, pictureOf } from './catalog';
export { restore, SAVE_VERSION, snapshot } from './save';
export { nextLevel, start } from './start';
export type { RestoreFailure, RestoreResult, RestoredGame, SaveData } from './save';
export type { Catalog, CatalogCard, CatalogGroup, Picture } from './catalog';
export type {
  Action,
  Card,
  CardId,
  GameEvent,
  GameState,
  GroupId,
  Outcome,
  Pile,
  PileId,
  PictureId,
  Progress,
  Stack,
  StackId,
  TableCard,
} from './types';
