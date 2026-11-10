# 06: Face-down cards and the deck

Spec: [spec.md](../spec.md)

**What to build:** In later levels, some cards are face-down. A face-down card turns over when the card on top of it moves away. The Child taps the deck to get more cards, and the deck starts again after its last card.

**Blocked by:** 03 (Level generator: easy levels)

**Status:** ready-for-agent

- [ ] The `flipped` event exists, and the UI turns the card with the flip from the motion research.
- [ ] The `tapDeck` action and the `dealt` event exist. After the last card, the deck starts again with no limit.
- [ ] The generator adds face-down cards and the deck from a level number that grows with difficulty.
- [ ] The dead-end check plays every legal move. A deal that leaves cards on the table is rejected, and the generator deals again.
- [ ] A Vitest test over many seeds and level numbers proves that each generated level can be finished.
- [ ] A Vitest test proves that early levels have no face-down cards and no deck.
