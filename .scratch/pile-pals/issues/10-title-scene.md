# 10: Title scene

Spec: [spec.md](../spec.md)

**What to build:** The app opens on a live title scene. Pals hop and fall into small piles. The Child taps a pal to make it jump, and taps the green arrow button to play.

**Blocked by:** 05 (Card sound effects), 08 (Group and level celebrations)

**Status:** ready-for-agent

- [x] Animated pals hop and fall into 3 small piles in a loop.
- [x] The logo is a card pile with eyes, with no text.
- [x] One large green round button with a white arrow starts the level.
- [x] A tap on a pal makes it jump and play a sound. Pals with no own sound play a pop.
- [x] The first touch on the title scene unlocks audio.
- [x] A restored level skips the title scene.
- [x] An app update applies on the title scene before the first touch.

## Comments

Built on branch `ticket/10-title-scene`.

- Model: `titleScene(seed)` in `src/model/title.ts` gives 3 piles of 3 pals. Each pile is a group of one association
  type, and the fairness rule of the levels applies (no pal fits two shown groups, no confusable groups, each thing one
  time). Only pals come in, so each tap plays a sound. Test: `src/model/title.test.ts` (200 seeds).
- UI: `src/ui/App.tsx` switches between the title scene and the level. `src/ui/title/` holds the scene, the loop, the
  logo, and `title.css`. `src/ui/go-button.tsx` and `go-button.css` are the shared green button (ticket 11 uses it too).
- The loop: 9 pals hop in from the left edge and fall onto 3 mats, one pile after the other. After 2.2 s they jump off
  the bottom edge, and a new round starts with other pals. The pals show still pictures: spec Module 7 plays animated
  pictures only at reward moments.
- A tap on a pal jumps it (WAAPI on `.title-pal-body`) and calls `playPal`. The first touch unlocks the audio through the
  document listeners of `src/sound`; no extra code was necessary. Headless Chromium counted one sound start for a tap.
- The go button plays the saved level, or level 1 of a new game. It saves the level before the board shows.
  A launch with a save shows the board at once (checked in headless Chromium after a reload).
- Update: `openSafeWindow()` in `src/shell/update.ts`. The title scene opens the window when it shows and closes it at
  the first `pointerdown`. A waiting update applies at once, and an update that becomes ready in the window applies
  when it is ready. Checked with `pnpm build` + `pnpm preview`: a new `sw.js` reloaded the title scene with no touch,
  and after a touch the new version waited.
- The book icon shows only when `onOpenBook` is set. Ticket 11 connects it to `openBook()`. The 3-second hold on the
  logo belongs to ticket 14.
- The startup image stays a plain table fill: a launch with a save shows the board, so a title picture in the splash
  would not match that first frame.
- Device checks (feel of the hops, sound on the first tap on iOS) belong to ticket 16.
