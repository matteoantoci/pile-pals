# 06: Face-down cards and the deck

Spec: [spec.md](../spec.md)

**What to build:** In later levels, some cards are face-down. A face-down card turns over when the card on top of it moves away. The Child taps the deck to get more cards, and the deck starts again after its last card.

**Blocked by:** 03 (Level generator: easy levels)

**Status:** resolved

- [x] The `flipped` event exists, and the UI turns the card with the flip from the motion research.
- [x] The `tapDeck` action and the `dealt` event exist. After the last card, the deck starts again with no limit.
- [x] The generator adds face-down cards and the deck from a level number that grows with difficulty.
- [x] The dead-end check plays every legal move. A deal that leaves cards on the table is rejected, and the generator deals again.
- [x] A Vitest test over many seeds and level numbers proves that each generated level can be finished.
- [x] A Vitest test proves that early levels have no face-down cards and no deck.

## Comments

2026-11-10:

- The table holds stacks. Only the top card can move. A correct drop turns the next card face-up.
- Levels 1 to 10 have no face-down cards and no deck. Levels 11 to 15 have two of each. Later levels have three of each.
- The deck puts the previous face-up card at its bottom. No card is lost, and the deck cycles with no limit.
- The dead-end check plays legal drops and deck taps. The generator rejects a deal with cards left and tries the next seed.
- The save data now validates stacks, face-down flags, the deck, and the dealt card.
- `pnpm check` and `pnpm build` pass after the merge with tickets 08 and 09.
- Headless Chromium checked a deck tap and a two-half rotateY flip at level 11. Level 1 shows no deck.
- The iPhone drag, flip, sound, and frame checks belong to ticket 16.
