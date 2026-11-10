# 11: Sticker book reward

Spec: [spec.md](../spec.md)

**What to build:** After each level, the sticker book page opens with a new sticker. The Child drags it to any place on the page and taps the green arrow button. A gold sticker comes on every 20th level.

**Blocked by:** 08 (Group and level celebrations), 09 (Save, restore, and the shell)

**Status:** resolved

- [x] The sticker rules from the spec apply, with P from the catalog.
- [x] The `placeSticker` and `go` actions and the `stickerAwarded`, `stickerPlaced`, and `bookComplete` events exist.
- [x] If the Child taps the green arrow button with no drag, the sticker is placed by itself.
- [x] A full page opens a new page. Sticker positions are saved.
- [x] A tap on a sticker in the book plays its animation.
- [x] A book icon on the title scene opens the old pages.
- [x] A Vitest test over 2P + 10 levels proves the sticker rules from the spec.

## Comments

Built the sticker rules in the game model and the sticker book page in `src/ui/book/`.

- **Model.** `GameState.book` holds the pages (a page is a list of placed stickers) and `award`, the new sticker
  that waits for `go`. The drop that gives `levelComplete` also gives `stickerAwarded` (and `bookComplete` at
  level 2P). `placeSticker(position)` sets the place of the new sticker (page coordinates from 0 to 1) and gives
  `stickerPlaced`. `go()` puts the sticker on the page for good (with no drag, at the free grid spot and with
  `stickerPlaced`) and saves the next level in the state. `go()` replaces `nextLevel`. A page holds 12 stickers;
  the award after a full page opens a new page. The choice is seeded (game seed and level). The first choice is a
  pal of a group of the level, for normal and for gold stickers. `SAVE_VERSION` is 3 (ticket 07 used 2): a save
  without a book is refused.
- **Reward page.** After the confetti, the board shows the current page with the new sticker below it. The new
  sticker plays its animation and its pal sound. The Child drags it to any place on the page; the green arrow
  (`GoButton` of ticket 10) places it by itself when there was no drag, with a spring to the spot. Then the app
  shows the title scene (spec: level → reward → title scene), whose go button plays the saved next level. The
  finished level is saved with the waiting sticker, so a reload opens the page again. The Board no longer deals
  a level; its `watchLifecycle` listener now stops when the board unmounts. After level 2P, the page shows no new
  sticker and its stickers play one after the other.
- **Tap.** A tap on a sticker plays its animation loop for 3 s, a small hop, and its pal sound. Each play takes
  one slot of the shared `animationLimiter`.
- **Old pages.** `openBook()` (from `src/ui/book`) shows the saved pages, newest first, with arrow buttons and a
  close button, all with no text.
- **Book icon.** The merge with ticket 10 connects `onOpenBook={openBook}` in `App.tsx`.

Checks: `pnpm check` (the 2P + 10 run takes less than 1 s). Headless Chromium at 390 × 763 on the dev server:
a saved finished level opened the reward page; a drag put the sticker at (0.5, 0.4) and the save kept it; a
reload put it back at the same place with no animation; the arrow dealt level 16 and the page held the sticker;
level 20 gave a gold sticker of a pal that the Child had, and the arrow flew it to the free spot; `openBook()`
turned back to the full first page and closed; after level 2P the page showed no new sticker and its stickers
played in turn. After the merge with tickets 07 and 10: a restored finished level opened the reward page, the
arrow showed the title scene with level 4 in the save, the book icon showed the 3 stickers, the cross closed the
book, and the go button started level 4. The iPhone feel of the drag is ticket 16.
