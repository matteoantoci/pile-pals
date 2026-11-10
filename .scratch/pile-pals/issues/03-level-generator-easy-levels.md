# 03: Level generator: easy levels

Spec: [spec.md](../spec.md)

**What to build:** The Child plays level after level. Each level has 2 to 4 face-up piles of one association type, with all category cards on their piles at the start. The difficulty grows with the level number.

**Blocked by:** 01 (Tracer bullet: one level on the iPhone), 02 (Noto content pipeline)

**Status:** ready-for-agent

- [ ] The generator makes a level from the catalog, a seed, and the level number.
- [ ] Each level uses one association type.
- [ ] The fairness rule from the spec applies: no card fits two shown groups, no confusable groups together, at most one picture of each thing, and enough safe cards for each group.
- [ ] The number of piles and the cards for each group grow with the level number.
- [ ] `groupComplete` and `levelComplete` events exist. After `levelComplete`, the next level starts.
- [ ] A Vitest test over many seeds proves the fairness rule.
- [ ] A Vitest test proves that a correct drop returns the correct note index and that the last card of a group returns `groupComplete`.
