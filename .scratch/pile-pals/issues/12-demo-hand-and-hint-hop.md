# 12: Demo hand and hint hop

Spec: [spec.md](../spec.md)

**What to build:** The Child learns the game with no words. A ghost hand shows each new action one time, and a card hops when she does nothing.

**Blocked by:** 04 (Native drag feel), 07 (Category cards placed by the Child)

**Status:** ready-for-agent

- [ ] In level 1, a semi-transparent hand drags the first card slowly to its pile.
- [ ] The first touch of the Child stops the demo.
- [ ] A short demo shows the first time that the deck, a face-down card, or a category card appears.
- [ ] After about 5 seconds with no action, the correct card hops. After 2 hops with no action, the hand shows again.
- [ ] Flags in the save data record the demos that the Child saw. A demo does not show again on each launch.
