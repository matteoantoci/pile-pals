# 11: Sticker book reward

Spec: [spec.md](../spec.md)

**What to build:** After each level, the sticker book page opens with a new sticker. The Child drags it to any place on the page and taps the green arrow button. A gold sticker comes on every 20th level.

**Blocked by:** 08 (Group and level celebrations), 09 (Save, restore, and the shell)

**Status:** ready-for-agent

- [ ] The sticker rules from the spec apply, with P from the catalog.
- [ ] The `placeSticker` and `go` actions and the `stickerAwarded`, `stickerPlaced`, and `bookComplete` events exist.
- [ ] If the Child taps the green arrow button with no drag, the sticker is placed by itself.
- [ ] A full page opens a new page. Sticker positions are saved.
- [ ] A tap on a sticker in the book plays its animation.
- [ ] A book icon on the title scene opens the old pages.
- [ ] A Vitest test over 2P + 10 levels proves the sticker rules from the spec.
