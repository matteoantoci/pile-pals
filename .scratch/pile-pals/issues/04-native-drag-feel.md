# 04: Native drag feel

Spec: [spec.md](../spec.md)

**What to build:** A card feels like a real object under the finger. It lifts when touched, follows the finger, snaps to a near pile with a spring, and shakes back after a wrong drop.

**Blocked by:** 01 (Tracer bullet: one level on the iPhone)

**Status:** resolved

- [x] Lift: the card grows a little, and a separate shadow element fades in with `opacity`.
- [x] Snap: a magnet distance pulls the card onto the pile.
- [x] Springs are sampled keyframes with `easing: 'linear'`, and the release speed of the finger starts the spring.
- [x] Wrong drop: a soft shake, then a spring back to the start position.
- [x] Only `transform` and `opacity` animate, with WAAPI. No CSS transitions on cards and no Motion library.
- [ ] The drag test on the iPhone is in ticket 16.

## Comments

**Built (branch `ticket/04-drag-feel`):**

- `src/ui/motion/`: the motion module. `spring.ts` has the spring sampler (`sampleSpring`, `springTo`, `releaseVelocity`). `primitives.ts` has `translate3d`, `facePose`, `stop`, `freeze`, and `settle`. `card.ts` has the card effects `lift`, `land`, and `shake`. `src/ui/motion/index.ts` is the public API for the flip, the parade, the hint hop, and the demo hand.
- `src/ui/drag.ts`: lift at `pointerdown`, magnet pull in `pointermove`, and three moves at `pointerup`: snap, shake back, or spring back.
- `src/ui/Board.tsx`: gives the pile faces as drop targets and sends `dropCard` for the nearest pile in reach. Each `.card` has a `.card-shadow` and a `.card-face`.
- All numbers come from `research/native-feel/motion.md` ("Starting values for each moment"), except the magnet distance, which the research does not give.

**Decisions:**

- Magnet distance: 120 px from the card centre to the pile face centre. At the pile centre, the pull is 0.5 (half of the way from the finger to the pile). The pull is 0 at 120 px.
- With no pile in reach, the card springs back with the release speed and the UI does not call the model. A shake shows only after a `rejected` event.
- The shake uses the lifted scale (1), not the resting scale: the card is still "in the hand" during the shake. The face lands (squash to the resting scale) when the spring back gets home.
- The pile shows the card only when the landing ends: the UI keeps the newest model state in a variable and puts it in the signal at `landed`.
- The table draws the dealt cards in fixed places. A card that left the table gets the class `gone` (`visibility: hidden`). Thus the other cards do not move under the finger when a card leaves. Ticket 03 (columns) can change this.
- Reduced motion (research section 8) is not in this ticket and is not built.

**Checked:** in headless Chromium on `pnpm preview`: the lift animations on `.card-face` (120 ms, scale 0.926 to 1) and `.card-shadow` (opacity 0 to 1); the magnet pull values during the move; the landing spring on `.card` (28 linear keyframes, final inline transform at the pile centre, face squash with a delay at the first crossing); the shake (7 keyframes, 360 ms) and the spring back to `translate3d(0px, 0px, 0px)`; the spring back with no pile in reach; a new grab during a spring keeps the card at its position on the screen.

**Open:** the drag test on the iPhone (ticket 16), and the felt values (spring, magnet, shake), which ticket 16 tunes.
