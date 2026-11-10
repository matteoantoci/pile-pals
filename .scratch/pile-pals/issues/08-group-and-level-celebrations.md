# 08: Group and level celebrations

Spec: [spec.md](../spec.md)

**What to build:** A completed group leaves the table in a parade, and the animated pals move. A completed level shows confetti and plays a fanfare.

**Blocked by:** 03 (Level generator: easy levels), 04 (Native drag feel)

**Status:** ready-for-agent

- [ ] On `groupComplete`, the cards of the group leave in a parade.
- [ ] Cards with an animated twin play the animation during the parade. The still and the first frame match.
- [ ] On `levelComplete`, confetti (canvas-confetti) and the fanfare play.
- [ ] The maximum number of animations at the same time is a constant, with 8 as the start value. Ticket 16 sets the final value.
