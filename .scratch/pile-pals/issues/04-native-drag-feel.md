# 04: Native drag feel

Spec: [spec.md](../spec.md)

**What to build:** A card feels like a real object under the finger. It lifts when touched, follows the finger, snaps to a near pile with a spring, and shakes back after a wrong drop.

**Blocked by:** 01 (Tracer bullet: one level on the iPhone)

**Status:** ready-for-agent

- [ ] Lift: the card grows a little, and a separate shadow element fades in with `opacity`.
- [ ] Snap: a magnet distance pulls the card onto the pile.
- [ ] Springs are sampled keyframes with `easing: 'linear'`, and the release speed of the finger starts the spring.
- [ ] Wrong drop: a soft shake, then a spring back to the start position.
- [ ] Only `transform` and `opacity` animate, with WAAPI. No CSS transitions on cards and no Motion library.
- [ ] The drag test on the iPhone is in ticket 16.
