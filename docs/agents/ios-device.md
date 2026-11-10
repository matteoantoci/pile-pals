# iOS device behaviour

The game targets an iPhone Home Screen web app (WebKit). Chromium cannot show the rules below, so a green
`pnpm smoke` run does not prove them. The Parent checks them on the iPhone (ticket 16).

## Facts found on the device

- **Audio starts only in a tap.** The end of a touch drag is not a user gesture for audio, so a board that
  shows with no tap before it stays silent. The go button of `src/ui/sound-gate.tsx` covers such a board.
- **A context from the background can be silent.** iOS can report `running` and play nothing. After each
  return, the next tap closes the old `AudioContext` and starts a new one (`src/sound/engine.ts`, `stale`).
- **Reduce Motion turns off the confetti.** `disableForReducedMotion` in `src/ui/celebration/confetti.ts`
  follows the spec. Check Settings > Accessibility > Motion before a confetti bug hunt.
- **`playback` audio session.** The game plays with the silent switch on, and it stops music from other
  apps. The Parent chose this.
- **An update applies only on the title scene** (`src/shell/update.ts`). A launch with a save opens the
  board, so a new version reaches the iPhone only after the Child reaches the title scene and the app
  opens again.

## Diagnosis

1. Ask for the iPhone result first. A user report from the device is the ground truth.
2. For audio in Chromium, read the CDP `WebAudio` domain (`contextCreated`, `contextChanged`,
   `audioNodeCreated`). Patches of `AudioContext` from an init script run in an isolated world and see
   nothing. `scripts/smoke.ts` shows the method.
3. For live iPhone data, use Safari Web Inspector: the setup is in ticket 16.
