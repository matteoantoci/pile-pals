# 03: Level generator: easy levels

Spec: [spec.md](../spec.md)

**What to build:** The Child plays level after level. Each level has 2 to 4 face-up piles of one association type, with all category cards on their piles at the start. The difficulty grows with the level number.

**Blocked by:** 01 (Tracer bullet: one level on the iPhone), 02 (Noto content pipeline)

**Status:** resolved

- [x] The generator makes a level from the catalog, a seed, and the level number.
- [x] Each level uses one association type.
- [x] The fairness rule from the spec applies: no card fits two shown groups, no confusable groups together, at most one picture of each thing, and enough safe cards for each group.
- [x] The number of piles and the cards for each group grow with the level number.
- [x] `groupComplete` and `levelComplete` events exist. After `levelComplete`, the next level starts.
- [x] A Vitest test over many seeds proves the fairness rule.
- [x] A Vitest test proves that a correct drop returns the correct note index and that the last card of a group returns `groupComplete`.

## Comments

**Built (branch `ticket/03-level-generator`):**

- `src/model/difficulty.ts`: the difficulty table by level number, the only place that sets the size of a level. Levels 1 to 10 grow one step each 2 levels: 2×3, 2×4, 3×3, 3×4, 4×3 (piles × cards for each group). From level 11: 2 to 4 piles with 4 cards, from level 16 with 5 cards.
- `src/model/fairness.ts`: rules 1 to 5 of `content-model.md` §5, read from the catalog. `src/model/generator.ts`: picks a random first group (so each group comes equally often, and its type is the type of the level), fills the piles with groups of that type, picks the category card (the catalog anchor, or a safe member when the anchor fits another shown group), then the cards. `src/model/random.ts`: seeded random source (mulberry32), no `Math.random`.
- Events `groupComplete(pileId)` and `levelComplete`. `nextLevel(state)` deals level + 1 with the same game seed, and keeps a level that is not finished.
- Board: plays a level, then the next level when the last card lands. Sounds `group` and `level` play on the new events. Smaller card sizes (`data-size` medium and small) so 3 and 4 piles with up to 20 cards fit the iPhone 12 screen.
- Tests: `src/model/level.test.ts` (100 seeds × levels 1 to 30, real catalog; replaces `content.test.ts`) and new cases in `src/model/model.test.ts`.

**Decisions:**

- Seed rule: the state keeps the seed of the game. The deal of level L comes from `mixSeed(seed, L)`. So `nextLevel` of a finished level L equals `start({ level: L + 1 }, seed)`.
- From level 11, a type that cannot fill 4 piles fairly (for example "moves") gets fewer piles, and the 2-group types (hot and cold, big and tiny, happy and sad, round and long) show with 2 piles. Without this, these types never come after level 8 (user story 23). Measured over 2,000 seeds: level 11 has 4 piles in 82 % of the deals, level 16 in 73 %.
- The Board still starts a new game at level 1 with seed 1. Ticket 09 saves the state; a new game (ticket 09 or 14) can choose another seed.

**Checked:** in headless Chromium on `pnpm preview` (390 × 797 viewport), level 1 (fair and school) was finished by drags, and level 2 (big and tiny animals) started. The layout of each size class was measured with no card or pile outside the screen. The feel on the iPhone belongs to ticket 16.
