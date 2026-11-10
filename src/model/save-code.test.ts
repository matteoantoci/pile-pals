import { describe, expect, it } from 'vitest';
import { apply, placeAnchor, readSaveCode, saveCode, snapshot, start } from './index';
import { openCards, playOut } from './test-player';
import type { GameState, RestoredGame } from './index';

/** A level with an empty slot, a placed category card, face-down cards, and a deck. */
const playedLevel = (): GameState => {
  const state = start({ level: 16 }, 3);
  const anchor = openCards(state).find((card) => card.anchor);
  const slot = state.piles.find((pile) => pile.group === null);
  if (!anchor || !slot) {
    throw new Error('The level has no open category card or no empty slot.');
  }
  return apply(state, placeAnchor(anchor.id, slot.id)).state;
};

/** The game of a save code, or a failure that fails the test with the reason. */
const read = async (code: string): Promise<RestoredGame> => {
  const result = await readSaveCode(code);
  if (!result.ok) {
    throw new Error(`readSaveCode rejected the code: ${result.reason}`);
  }
  return result;
};

describe('saveCode', () => {
  it('is text that a person can copy: letters, digits, "-", and "_"', async () => {
    const code = await saveCode(snapshot(playedLevel()));

    expect(code).toMatch(/^[\w-]+$/u);
  });

  it('is compressed: shorter than the save data as JSON', async () => {
    const save = snapshot(playedLevel());

    const code = await saveCode(save);

    expect(code.length).toBeLessThan(JSON.stringify(save).length / 2);
  });
});

describe('readSaveCode', () => {
  it('gives the same game back', async () => {
    const state = playedLevel();

    const game = await read(await saveCode(snapshot(state)));

    expect(game.state).toEqual(state);
    expect(game.progress).toEqual(snapshot(state).progress);
  });

  it('gives a game that plays the same as the original', async () => {
    const state = playedLevel();

    const game = await read(await saveCode(snapshot(state)));

    expect(playOut(game.state)).toEqual(playOut(state));
  });

  it('reads a code with spaces and line breaks in it', async () => {
    const state = playedLevel();
    const code = await saveCode(snapshot(state));
    const pasted = ` ${code.slice(0, 20)}\n${code.slice(20, 40)} \r\n${code.slice(40)}\n`;

    expect((await read(pasted)).state).toEqual(state);
  });

  it('refuses the code of an unknown schema version', async () => {
    const code = await saveCode({ ...snapshot(playedLevel()), version: 99 });

    expect(await readSaveCode(code)).toEqual({ ok: false, reason: 'version' });
  });

  it('refuses text that is not a save code', async () => {
    const code = await saveCode(snapshot(playedLevel()));

    expect(await readSaveCode('')).toEqual({ ok: false, reason: 'shape' });
    expect(await readSaveCode('hello')).toEqual({ ok: false, reason: 'shape' });
    expect(await readSaveCode('not a save code!')).toEqual({ ok: false, reason: 'shape' });
    expect(await readSaveCode(code.slice(0, code.length / 2))).toEqual({ ok: false, reason: 'shape' });
  });
});
