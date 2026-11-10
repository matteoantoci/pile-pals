# 12: Demo hand and hint hop

Spec: [spec.md](../spec.md)

**What to build:** The Child learns the game with no words. A ghost hand shows each new action one time, and a card hops when she does nothing.

**Blocked by:** 04 (Native drag feel), 07 (Category cards placed by the Child)

**Status:** ready-for-agent

- [x] In level 1, a semi-transparent hand drags the first card slowly to its pile.
- [x] The first touch of the Child stops the demo.
- [x] A short demo shows the first time that the deck, a face-down card, or a category card appears.
- [x] After about 5 seconds with no action, the correct card hops. After 2 hops with no action, the hand shows again.
- [x] Flags in the save data record the demos that the Child saw. A demo does not show again on each launch.

## Comments

Built on branch `ticket/12-demo-hand`.

- Model: `GameState.demos` holds the seen demos (`DemoKind`: `first`, `faceDown`, `anchor`, `deck`). `start` gives `[]`,
  and `go` carries the list to the next level. `demoFor(state)` gives the first demo that the Child did not see and
  that has a move now, in the order first, faceDown, anchor, deck. `hintFor(state)` gives the first legal move (a drop
  first, the deck last). `sawDemo(state, kind)` records a demo. Tests: `src/model/demo.test.ts`.
- Save: `SAVE_VERSION` is 4. A version 3 save has no demo flags and gives `reason: 'version'`.
- UI: `src/ui/coach/` shows the demos and the hints. The hand moves a copy of the card (the drag owns the card). The
  first demo plays 3 rounds; a later demo plays 1 round. A demo starts 600 ms after the board comes to rest. The
  demo is recorded and saved when it starts. The first touch (capture `pointerdown` on the document) stops the hand
  and the hops. After 5 s with no touch, the hint card hops (or the deck); after 2 hops, the hand shows the hint move.
- Decision: a face-down card is shown with the drop of the card on top of it, so the Child sees the card turn over.
  A deck demo taps the deck two times but does not deal.
- Checked in headless Chromium at 390 by 844: the first demo in level 1, the stop at the first touch, hops at 5 s and
  10 s and the hand at 15 s, no demo after a reload, the face-down, deck, and category-card demos at levels 11 and 13.
- The felt values (hand speed, hop height, idle time) belong to the device check of ticket 16.
