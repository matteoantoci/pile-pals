// The game seed of a new game. The model has no random source: the same seed always gives the same deal,
// so the UI picks the seed. The deal of level L comes from the game seed and L, so one seed serves the whole game.

/** A new game seed from the device random source. 0 is a good seed: `mixSeed` accepts every number. */
export const newSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
