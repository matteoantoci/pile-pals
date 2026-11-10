# 07: Category cards placed by the Child

Spec: [spec.md](../spec.md)

**What to build:** After about level 10, the category cards are mixed into the table and the deck. The Child finds a category card and puts it on an empty slot. Then that pile accepts its cards.

**Blocked by:** 06 (Face-down cards and the deck)

**Status:** resolved

- [x] The level has one slot for each group.
- [x] The `placeAnchor` action puts a category card on an empty slot.
- [x] A card cannot go to a group that has no category card on a slot yet. The drop returns `rejected`.
- [x] The dead-end check from ticket 06 covers these levels.
- [x] A Vitest test proves that levels 1 to about 10 have all category cards on their piles at the start.

## Comments

**Built (branch `ticket/07-category-cards`):**

- Model: `Card.anchor` (true for a category card), `Pile.group` and `Pile.picture` can be null (an empty slot).
  New action `placeAnchor(cardId, slotId)` and new event `anchorPlaced { cardId, pileId }`.
  Any empty slot accepts any category card. A drop on an empty slot, or of a card whose group has no slot yet,
  returns `rejected` and the same state.
- Difficulty: new column `looseAnchors`. Levels 1 to 12: 0. Levels 13 to 15: 1 loose category card. From level 16:
  all category cards are loose. Level 11 starts the deck and the face-down cards, so each new action starts
  2 levels after the one before (one action at a time for the Child).
- Generator: a loose category card goes on the table or in the deck, never face-down. A level with no loose
  category card uses no new random value, so the deals of levels 1 to 12 did not change.
- Dead-end check: `legalMoves` adds `placeAnchor` for each open category card and each empty slot.
  `cardsLeft` already counts the loose category cards.
- Save: `SAVE_VERSION` is now 2. A save of version 1 has no `anchor` field on its cards, so it gives
  `reason: 'version'` and the Child starts a new game. `restore` accepts a pile with both `group` and `picture`,
  or with both null.
- UI: an empty slot shows a light face with no picture. A category card has the cream colour of a pile face.
  The Board sends `placeAnchor` for a category card and `dropCard` for a picture card. `anchorPlaced` plays the
  `snap` sound at note 0.
- Tests: `src/model/anchor.test.ts` (slots, `placeAnchor`, rejects, dead-end check for levels 13 to 30, levels 1 to 10
  with all category cards on their piles). `level.test.ts` reads the groups from the category cards, not from the piles.
- Headless Chromium at 390 × 763, level 16: a picture card on an empty slot sprang back, the category card snapped
  onto the slot, and then a card of its group snapped onto it.

**Open:** the device feel of the slots and the category card colour on the iPhone belongs to ticket 16. The demo hand
for the first category card belongs to ticket 12.
