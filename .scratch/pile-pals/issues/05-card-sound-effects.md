# 05: Card sound effects

Spec: [spec.md](../spec.md)

**What to build:** The Child hears a sound for each card action. A correct card on a pile plays a higher note than the last card on that pile.

**Blocked by:** 01 (Tracer bullet: one level on the iPhone)

**Status:** ready-for-human

- [ ] One `AudioContext` is unlocked by the first touch and reused.
- [ ] Sounds for lift, snap, wrong drop, flip, deck tap, group complete, and level complete come from recorded files only: Kenney Casino Audio card sounds and the labrynth2 effects (Boing 2, Bubble Pop, Success Fanfare Trumpets).
- [ ] Open the Kenney Casino Audio pack and confirm the files before use.
- [ ] Rising snap notes come from one recorded pluck at a higher `playbackRate` for each card on the pile.
- [ ] A listening page with keep and replace buttons and a Copy answers button lets the Parent choose the sounds, as in labrynth2.
- [ ] The app sets `navigator.audioSession.type = "playback"`. The silent switch test is in ticket 16.
- [ ] No sound is louder than the snap.
