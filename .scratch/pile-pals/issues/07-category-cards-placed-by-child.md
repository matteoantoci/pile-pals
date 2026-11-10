# 07: Category cards placed by the Child

Spec: [spec.md](../spec.md)

**What to build:** After about level 10, the category cards are mixed into the table and the deck. The Child finds a category card and puts it on an empty slot. Then that pile accepts its cards.

**Blocked by:** 06 (Face-down cards and the deck)

**Status:** ready-for-agent

- [ ] The level has one slot for each group.
- [ ] The `placeAnchor` action puts a category card on an empty slot.
- [ ] A card cannot go to a group that has no category card on a slot yet. The drop returns `rejected`.
- [ ] The dead-end check from ticket 06 covers these levels.
- [ ] A Vitest test proves that levels 1 to about 10 have all category cards on their piles at the start.
