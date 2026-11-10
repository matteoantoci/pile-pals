# 13: Pal sounds

Spec: [spec.md](../spec.md)

**What to build:** Pals on the title scene, in parades, and in the sticker book play real animal and vehicle sounds. Pals with no own sound play a pop. A big pal plays a low pop, and a small pal plays a high pop. The agent chooses a first sound for each pal. The Parent listens only to the sounds that the agent marks as a doubt (ticket 17).

**Blocked by:** 02 (Noto content pipeline), 05 (Card sound effects)

**Status:** resolved

## Sources

- labrynth2 (`~/Personal/labrynth2/assets/audio/friends/*.wav`) has 13 sounds: crab, dolphin, duck, fish, flamingo, jellyfish, octopus, otter, penguin, seal, squid, swan, whale. 5 of them are cartoon effects, not animal calls: scissors snips, a squeak, bubbles (2 files), and a bottle squirt (`credits.txt`). Reuse them.
- The otter sound is CC BY 4.0 ("Otters Squeaking.wav" by Motion_S). It goes into the credits with the text from labrynth2 `credits.txt`.
- New sounds: Freesound `-hq.mp3` preview files (no login). Use CC0 only. A CC BY file is allowed only when no CC0 file is good, and it goes into the credits.

## Acceptance

- [x] The 13 labrynth2 sounds are used for the matching pals that the catalog of ticket 02 contains.
- [x] The agent chooses about 30 more pals from the catalog: each pal whose real thing has a sound that a child knows. Examples: dog, cat, cow, lion, car horn, train, fire engine.
- [x] Each of these pals has 3 Freesound candidates. The agent sets one as the first choice and marks the pal `sure` or `doubt`, with the rule of ticket 05.
- [x] The pals are added to the listening page of ticket 05, `doubt` pals first.
- [x] The agent tags each pal with no own sound `S`, `M`, or `L` for its real size. Examples: ant `S`, cat `M`, elephant `L`. The pop plays at a high, middle, or low `playbackRate` for the tag. No Parent check is necessary.
- [x] Each file is converted, cut, and set to a level with the method of ticket 05. No pal sound gets a level above the snap.
- [x] A Vitest test checks that each shipped picture and sound file has an entry in the credits list, as in labrynth2.

## Comments

**2026-11-10, agent (branch `ticket/13-pal-sounds`).** What I built:

- `src/sound/sounds.json` has a new section `Pals`: one `pop` slot and 41 pal slots. A pal slot id is `pal-<card id>`, and a clip id is `<card id>-<Freesound id>` (for example `dog-386766`). `python3 scripts/audio/prep.py` converts, cuts, and levels all files with the method of ticket 05. It writes `public/sounds/` (42 new shipped files, 7.5 MB with the card sounds), `public/listen/clips/` (the other candidates), `src/sound/levels.ts`, and the sound entries of `src/credits.json`.
- `src/sound/pal-sizes.json`: the size tag of each of the 257 pals, in three lists `S`, `M`, `L` (100, 105, 52).
- `playPal(cardId)` in `src/sound/index.ts`: the own sound of the pal (slot `pal-<card id>`), else the pop at `POP_RATE` for its size tag (`S` 1.5, `M` 1, `L` 2/3: a fifth up or down). Tickets 08, 10, and 11 call it.
- `/listen/` shows the pal rows with the card rows: all `doubt` rows first, then the `sure` rows. The pop row has three more buttons that play the pop at the S, M, and L rates.
- `src/credits.test.ts` (Vitest, data only): each file in `public/pictures/`, `public/animations/`, and `public/sounds/` must match a `files` path of a credits entry (a file path, or a folder pattern such as `pictures/*`). It also fails for a credits path with no shipped file, for an unknown licence, and for a credit-required work with no title, author, page, or change. A file with no entry makes the test fail (checked with an extra empty file).
- `src/sound/pal-sizes.test.ts` (data only): each pal of the catalog has exactly one size tag, and the file has no other id.
- `src/credits.json`: new licence `Apache-2.0` and two picture entries, Noto Emoji (`pictures/*`, Apache 2.0) and Noto Emoji Animation (`animations/*`, CC BY 4.0). The credits test needs them. The text follows `public/pictures/LICENSE.txt` and `public/animations/LICENSE.txt`.
- `scripts/audio/prep.py` stops when a `pal-` slot is not a pal of `src/model/catalog.json`.

Decisions:

- A pal is a shipped card with an animation (`catalog.pals` = 257). 9 of the 13 labrynth2 sounds are pals: crab, dolphin, fish, flamingo, jellyfish, octopus, otter, penguin, seal. They use the same Freesound previews and cuts as labrynth2, and the script measures the same I and TP. They are `sure`, with one candidate, because the Parent heard them in labrynth2. Duck, squid, swan, and whale are cards with no Noto animation, so they are not pals. Their sounds are not shipped.
- 32 more pals with a sound that a child knows: dog, lion, tiger, pig, horse, donkey, goat, rooster, baby chick, owl, frog, monkey, wolf, bird, goose, honeybee, cricket, dove, automobile (car horn), locomotive (train), motorcycle, airplane, bicycle (bell), rocket, alarm clock, bell, drum, guitar, trumpet, violin, maracas, cloud with lightning (thunder). The catalog has no cat, cow, sheep, elephant, or fire engine pal.
- Each of the 32 has 3 Freesound CC0 candidates (the licence link on each sound page was checked). No CC BY file was necessary. Nobody listened. A pal is `sure` (7: pig, horse, goat, rooster, frog, cricket, rocket) when its pick is a whole file with a title that names the sound, and it has a clear lead in downloads and rating over the other two. All other pals are `doubt` (25), because two candidates are close or the measurements show a problem (noise, a cut, a very quiet source, a sound that can scare a small child). The `why` of each slot gives the reason.
- A source longer than 3.3 s is cut to 2.5 s: the window with the most energy, moved back to the onset of the sound. The cut gets the fades of ticket 05.
- The pop: 3 candidates ("Pop sound" by deraj, "Mouth pop" by jcallison, Bubble Pop). It is `doubt`.
- All pals get a size tag, not only the pals with no own sound. Then a pal still plays the pop if the Parent answers "none of these is good" in ticket 17.
- No pal sound is louder than the snap: the snap limit of ticket 05 lowered 103 of the 107 new clips to M = -21.1 LUFS (the snap). The other 4 are below it. A rate change of the pop does not change the gain.

Open:

- The Parent listens to the 26 `doubt` rows of the Pals section in ticket 17.
- No game screen calls `playPal` yet. Tickets 08 (parades), 10 (title scene), and 11 (sticker book) call it.
- The pal sound level on the iPhone speaker is a device check of ticket 16.

**2026-11-10, agent (branch `ticket/review-fixes`, code review 1).** The size tags are now data of the game model, so the game model tests check them (spec, Testing Decisions). `src/sound/pal-sizes.json` moved to `src/model/pal-sizes.json`. The model exports `palSize(pictureId)`: `S`, `M`, `L`, or null for a picture that is not a pal. The UI gives the size to `playPal(cardId, size)`, so the sound module and the listening page do not load the catalog. `src/model/pal-sizes.test.ts` replaces `src/sound/pal-sizes.test.ts`. The snap rule of ticket 05 changed the snap level, so the pal sounds are about 5 dB quieter (see the ticket 05 comment).
