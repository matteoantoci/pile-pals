# 09: Save, restore, and the shell

Spec: [spec.md](../spec.md)

**What to build:** The game feels like a native app. It shows no white flash. When the Child comes back after iOS closes the app, she sees the same table. An update never interrupts a level.

**Blocked by:** 03 (Level generator: easy levels)

**Status:** ready-for-agent

- [ ] The app saves to `localStorage` after each resolved move. The save holds a schema version and the full deal, not only the seed.
- [ ] On `visibilitychange` to `hidden`, the app cancels any drag and saves.
- [ ] The app restores the level before the first frame, with no animation.
- [ ] Start image and background colour give no white flash.
- [ ] vite-plugin-pwa uses `registerType: 'prompt'` with no visible prompt. The app applies an update only at a safe point before the first touch.
- [ ] A Vitest test proves that `restore(snapshot(state))` plays the same as the original state.
