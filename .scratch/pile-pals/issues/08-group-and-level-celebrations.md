# 08: Group and level celebrations

Spec: [spec.md](../spec.md)

**What to build:** A completed group leaves the table in a parade, and the animated pals move. A completed level shows confetti and plays a fanfare.

**Blocked by:** 03 (Level generator: easy levels), 04 (Native drag feel)

**Status:** ready-for-agent

- [x] On `groupComplete`, the cards of the group leave in a parade.
- [x] Cards with an animated twin play the animation during the parade. The still and the first frame match.
- [x] On `levelComplete`, confetti (canvas-confetti) and the fanfare play.
- [x] The maximum number of animations at the same time is a constant, with 8 as the start value. Ticket 16 sets the final value.

## Comments

Built `src/ui/celebration/` (public API in `index.ts`) and changed `src/ui/Board.tsx` and
`src/ui/styles.css`.

- **Parade.** After `groupComplete`, `landed` shows the new state and `parade(pile)` makes a copy of each
  card of the group in a fixed layer above the board. The copies start at the pile pictures and walk off
  the right edge with the numbers of `research/native-feel/motion.md`: 900 ms, `cubic-bezier(0.4, 0, 1, 1)`,
  stagger 90 ms, bob on the face 180 ms. The model state does not change, and the copies are removed at the
  end. Each copy shows the still first; at the start of its own walk it swaps to the `.avif` loop (frame 0
  is the still, so the picture does not jump) and calls `playPal(card.picture)`.
- **Confetti and fanfare.** The confetti is `canvas-confetti` 1.9.4 with the default cannon (worker,
  resize, own full-screen canvas) and one burst of 100 pieces. The fanfare is the `level` sound slot that
  `src/ui/sounds.ts` plays with the drop, inside the user gesture. `celebrateLevel` does not play it again.
- **The after-level hook.** `celebrateLevel(afterCelebration)` fires the confetti and calls the hook after
  1600 ms. Now the hook is `dealNext`. Ticket 11 passes a hook that shows the sticker book and then deals.
- **The animation limit.** `MAX_CONCURRENT_ANIMATIONS = 8` and `animationLimiter` are in
  `src/ui/celebration/limits.ts`. The parade takes one slot for each pal during its walk. Ticket 11 reuses
  the same limiter for the sticker book. Ticket 16 sets the final value from the iPhone test.

Checks: `pnpm check`, `pnpm build`, then a headless Chrome run on `pnpm preview` at 390 × 763. Level 1
(school group): a parade of 3 copies. Level 1 (fair group): a parade of 3 copies, 3 `.parade-card img`
elements with the `.avif` source, 1 confetti canvas, 1 start of the 3.6967 s fanfare clip, then level 2
dealt. No code test: the spec says motion, sound, drag feel, and the shell are not tested by code.
