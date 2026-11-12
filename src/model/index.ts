// The public interface of the game model. The UI and the tests import only from this file.
// The model is pure TypeScript: no DOM, no time, no audio.

export { dropCard, openCards, placeAnchor, tapDeck } from './apply';
export { catalog, palSize, pictureOf } from './catalog';
export { apply, go, isFinished, placeSticker } from './game';
export { demoFor, hintFor, sawDemo } from './demos';
export type { Demo, Hint } from './demos';
export { pileProgress } from './pile-progress';
export type { PileProgress } from './pile-progress';
export { restore, SAVE_VERSION, snapshot } from './save';
export { start } from './start';
export { PAGE_SIZE } from './stickers';
export { titleScene } from './title';
export { isParentAnswer, parentProblem } from './parent';
export type { ParentProblem } from './parent';
export { readSaveCode, saveCode } from './save-code';
export type { TitlePile, TitleScene } from './title';
export type { RestoreFailure, RestoreResult, RestoredGame, SaveData } from './save';
export type { Catalog, CatalogCard, CatalogGroup, PalSize, Picture } from './catalog';
export type {
  Action,
  Book,
  Card,
  CardId,
  DemoKind,
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
