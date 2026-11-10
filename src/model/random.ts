// The seeded random source of the model. The model never uses Math.random: the same seed gives the same level.

/** Random choices from one seed. Each call moves the source to its next value. */
export type Random = {
  /** One of the items, or undefined when there is no item. */
  readonly pick: <T>(items: readonly T[]) => T | undefined;
  /** The items in a random order, as a new array. */
  readonly shuffle: <T>(items: readonly T[]) => readonly T[];
};

/** The murmur3 finaliser: it spreads each input bit over all 32 output bits. */
const finalise = (value: number): number => {
  const a = Math.imul(value ^ (value >>> 16), 0x85_eb_ca_6b);
  const b = Math.imul(a ^ (a >>> 13), 0xc2_b2_ae_35);
  return (b ^ (b >>> 16)) >>> 0;
};

/** Mixes numbers (for example a game seed and a level number) into one 32-bit seed. */
export const mixSeed = (...parts: readonly number[]): number =>
  parts.reduce((hash, part) => finalise(Math.imul(hash ^ (part >>> 0), 0x9e_37_79_b1)), 0x81_1c_9d_c5);

/** A random source from a 32-bit seed (mulberry32). */
export const randomFrom = (seed: number): Random => {
  let state = seed >>> 0;
  /** A number from 0 (included) to 1 (not included). */
  const next = (): number => {
    state = (state + 0x6d_2b_79_f5) >>> 0;
    const a = Math.imul(state ^ (state >>> 15), state | 1);
    const b = a ^ (a + Math.imul(a ^ (a >>> 7), a | 61));
    return ((b ^ (b >>> 14)) >>> 0) / 2 ** 32;
  };
  return {
    pick: (items) => items[Math.floor(next() * items.length)],
    shuffle: (items) =>
      items
        .map((item) => ({ item, key: next() }))
        .toSorted((x, y) => x.key - y.key)
        .map(({ item }) => item),
  };
};
