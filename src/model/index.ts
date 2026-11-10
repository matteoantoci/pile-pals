// The public interface of the game model. The UI and the tests import only from this file.
// The model is pure TypeScript: no DOM, no time, no audio.

export { dropCard, tapDeck } from './apply';
export { catalog, pictureOf } from './catalog';
export { apply, go, isFinished, placeSticker } from './game';
export { restore, SAVE_VERSION, snapshot } from './save';
export { start } from './start';
export { PAGE_SIZE } from './stickers';
export type { RestoreFailure, RestoreResult, RestoredGame, SaveData } from './save';
export type { Catalog, CatalogCard, CatalogGroup, Picture } from './catalog';
export type {
  Action,
  Book,
  Card,
  CardId,
  GameEvent,
  GameState,
  GroupId,
  LevelAction,
  Outcome,
  Pile,
  PileId,
  PictureId,
  PlacedSticker,
  Position,
  Progress,
  Stack,
  StackId,
  Sticker,
  TableCard,
} from './types';
