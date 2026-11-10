// The public interface of the game model. The UI and the tests import only from this file.
// The model is pure TypeScript: no DOM, no time, no audio.

export { apply, dropCard } from './apply';
export { start } from './start';
export type { Action, Card, CardId, GameEvent, GameState, GroupId, Outcome, Pile, PileId, Progress } from './types';
