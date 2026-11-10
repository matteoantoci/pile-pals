# 16: iPhone device checks

Spec: [spec.md](../spec.md)

**What to build:** the Parent checks on the iPhone 12 with iOS 26 the things that no code test can check. The results go into this ticket, and the agent changes the code where a check fails.

**Blocked by:** 01 (Tracer bullet: one level on the iPhone), 04 (Native drag feel), 05 (Card sound effects), 08 (Group and level celebrations)

**Status:** ready-for-human

- [ ] The app installs from Safari to the home screen and opens with no browser bars.
- [ ] The drag feels native: lift, follow, snap, and shake back.
- [ ] With the silent switch on, record whether the game plays sound.
- [ ] With Safari Web Inspector, record the frame drops with 1, 4, and 8 animations during a drag. Set the maximum number of animations at the same time from the result.
