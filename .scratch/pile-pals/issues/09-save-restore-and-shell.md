# 09: Save, restore, and the shell

Spec: [spec.md](../spec.md)

**What to build:** The game feels like a native app. It shows no white flash. When the Child comes back after iOS closes the app, she sees the same table. An update never interrupts a level.

**Blocked by:** 03 (Level generator: easy levels)

**Status:** resolved

- [x] The app saves to `localStorage` after each resolved move. The save holds a schema version and the full deal, not only the seed.
- [x] On `visibilitychange` to `hidden`, the app cancels any drag and saves.
- [x] The app restores the level before the first frame, with no animation.
- [x] Start image and background colour give no white flash.
- [x] vite-plugin-pwa uses `registerType: 'prompt'` with no visible prompt. The app applies an update only at a safe point before the first touch.
- [x] A Vitest test proves that `restore(snapshot(state))` plays the same as the original state.

## Comments

Built the save, the restore, and the shell.

- Model: `snapshot(state)` gives `SaveData` (schema version, the whole `GameState`, and a `progress` area). `restore(save)`
  never throws: it gives `{ ok: true, state, progress }` or `{ ok: false, reason: 'version' | 'shape' }`.
- Shell modules: `src/shell/save.ts` (localStorage), `src/shell/update.ts` (prompt-mode service worker and the safe
  point), `src/shell/lifecycle.ts` (`visibilitychange`), `src/shell/seed.ts` (a new game seed from `crypto`).
- The Board saves at each resolved move, saves and cancels the drag when the page goes hidden, and applies a waiting
  update at the start of a level.
- `main.tsx` reads the save before `render()` and passes the state to the Board. `data-restoring` turns off CSS motion
  for the first frame and is removed after one `requestAnimationFrame`.
- New iOS startup images in `public/splash/` (real PNG files, `scripts/shell/splash.py`) and the two
  `apple-touch-startup-image` links. `pwaAssets` adds the manifest, theme colour, and icons.
- A headless Chromium run played a move, reloaded, and showed the same table with 0 animations at the first frame. A
  save with an unknown version starts a new game with no error.
- Device checks (white flash on the real launch, status bar colour, insets, suspend against kill, update timing) belong
  to ticket 16.
