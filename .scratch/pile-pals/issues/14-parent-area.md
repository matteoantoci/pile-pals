# 14: Parent area

Spec: [spec.md](../spec.md)

**What to build:** The Parent holds the logo for 3 seconds and answers a multiplication problem. The parent area then gives credits, export, restore, reset, and a sound switch.

**Blocked by:** 09 (Save, restore, and the shell), 10 (Title scene), 13 (Pal sounds)

**Status:** resolved

- [x] A 3-second hold on the logo shows a multiplication problem with factors from 3 to 9 and a digit pad.
- [x] A new problem shows each time. A wrong answer closes the check.
- [x] The parent area uses English text.
- [x] Export gives a save code. Restore from a save code gives the same game.
- [x] Reset deletes all game data after a confirmation.
- [x] Sound effects can be turned on or off.
- [x] The credits list Noto Animated (CC BY 4.0), Noto 2D (Apache 2.0), each CC BY sound, and each CC0 source.

## Comments

**Built (branch `ticket/14-parent-area`):**

- Game model: `parentProblem(seed, last?)` gives two factors from 3 to 9 and never the last problem again.
  `isParentAnswer(problem, answer)` checks the answer. `saveCode(save)` and `readSaveCode(code)` make and read the
  save code: the JSON of `SaveData`, compressed with raw DEFLATE (`CompressionStream`), in base64url. `readSaveCode`
  ignores spaces and line breaks, never throws, and gives the `restore` result (`version` or `shape` on a refusal).
  Tests: `src/model/parent.test.ts`, `src/model/save-code.test.ts` (round trip, same play, bad text, other version).
- Title scene: the logo (`src/ui/title/logo.tsx`) starts a 3-second timer at `pointerdown` (with pointer capture).
  A lift, a cancel, or a lost capture stops it. The check (`src/ui/parent/ParentCheck.tsx`) covers the title scene.
  It has a digit pad, Delete, OK, and Cancel. A wrong answer closes it; the right answer opens the parent area.
- Parent area (`src/ui/parent/ParentArea.tsx`, a screen of `App`): sound switch, export (with a copy button),
  restore (paste box), reset (with a confirmation step), credits. Done goes back to the title scene.
- Sound: `setSoundOn(on)` and `isSoundOn()` in `src/sound` (engine flag that `playClip` reads, so every slot and
  every pal sound is muted). `src/shell/settings.ts` keeps the switch in localStorage (`pile-pals:sound`), and
  `main.tsx` applies it after `installSound()`.
- Credits (`src/ui/parent/credits.tsx`) show every entry of `src/credits.json`, grouped by licence: CC BY 4.0 and
  Apache 2.0 first with the change text, then the CC0 works as thanks. Links to `pictures/LICENSE.txt` and
  `animations/LICENSE.txt`. The credits test of ticket 13 keeps `credits.json` equal to the shipped files.

**Decisions:**

- The reset deletes the save (`clearSave()`), which holds the level, the deal, and the sticker book. The sound
  switch is a setting, not game data, so it stays.
- Restore writes the restored state with `saveGame`. The Parent taps Done, and the go button of the title scene
  plays the restored game. No `SAVE_VERSION` change.
- Export makes the code from the save in localStorage. With no save, the area says "There is no saved game yet."

**Checks:** `pnpm check` passes. Vite dev server and headless Chrome at 390 x 763: a 1 s hold opens nothing, a 3.2 s
hold opens the check; a wrong answer closes it, the next check shows a new problem, the right answer opens the area;
a restored level 5 code is saved, and the export of that save gives the same code; a bad code and a version 1 code
show their messages; the switch stops `AudioBufferSourceNode.start` and stays off after a reload; reset with
confirmation deletes the save, and the go button then starts level 1; the credits show 50 entries and 2 licence
links. The iPhone checks (hold feel, paste on iOS, silent switch) belong to ticket 16.
