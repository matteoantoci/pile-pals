# 05: Card sound effects

Spec: [spec.md](../spec.md)

**What to build:** The Child hears a sound for each card action. A correct card on a pile plays a higher note than the last card on that pile. The agent chooses a first sound for each action, so the game has sound before the Parent listens. The Parent listens only to the sounds that the agent marks as a doubt (ticket 17).

**Blocked by:** 01 (Tracer bullet: one level on the iPhone)

**Status:** ready-for-agent

## Sound slots and sources

| Slot | First source to try |
|---|---|
| lift | labrynth2 Bubble Pop, or a Kenney Casino Audio card sound |
| snap | one recorded pluck (Freesound CC0), played at a higher `playbackRate` for each card on the pile |
| wrong drop | labrynth2 Boing 2 |
| flip | Kenney Casino Audio |
| deck tap | Kenney Casino Audio |
| group complete | Freesound CC0 (a short chime or "ta-da") |
| level complete | labrynth2 Success Fanfare Trumpets |

- labrynth2 is at `~/Personal/labrynth2`. Its effect files are `assets/audio/effects/{goal,item,move,splash,wall}.wav`. Find which file is Boing 2, Bubble Pop, and the fanfare from `credits.txt` and `.scratch/labyrinth-game/spec.md` §9. If no file matches, download the original from the Freesound URL in `credits.txt`.
- Kenney Casino Audio (CC0) is at kenney.nl. Open the pack and list its files before you choose.
- Freesound candidates: use the `-hq.mp3` preview files (no login). Use CC0 only. A CC BY file is allowed only when no CC0 file is good, and it goes into the credits.

## Acceptance

- [x] Each slot has 3 candidates when a choice is open. The agent sets one candidate as the first choice and marks the slot `sure` or `doubt`. A slot is `doubt` when two candidates are close or no candidate is good.
- [x] The first choice of each slot ships and plays in the game.
- [x] A listening page at `/listen/` plays each candidate. It shows the `doubt` slots first and the `sure` slots below them. It has keep and replace buttons and a Copy answers button, as in labrynth2 (`.scratch/labyrinth-game/prototypes/sounds-LISTEN/`). The page is deployed with the app, has no link from the game, and is not in the precache.
- [x] Convert each file to mono WAV, 16-bit, 44.1 kHz, as in labrynth2 spec §9.5.
- [x] Fades: a clip cut from a longer recording gets a fade-in of 0.05 s and a fade-out of 0.2 s, as in labrynth2 §9.5. A file that is not cut gets no fade-in, because a fade removes the attack of a click or the pluck. Trim only the silence below −50 dBFS at the start, so the sound starts at once.
- [x] Level of a file of 0.4 s or longer: the labrynth2 loudness step (spec §9.6), gain `-18 - I`, with a true-peak limit of −1 dBTP.
- [x] Level of a file shorter than 0.4 s: ebur128 cannot measure its integrated loudness. Set the gain to `-6 - TP`, so the true peak is −6 dBTP. The snap and the pluck use this rule.
- [x] No file is louder than the snap. To compare, pad each file after its gain with silence to 0.4 s (`apad=whole_dur=0.4`) and read the maximum momentary loudness M with `ebur128=peak=true`. Lower each file with an M above the snap until it passes. A table in code holds the measured values and the gains.
- [x] One `AudioContext` is unlocked by the first touch and reused. After a lock, an app switch, or a phone call, the context comes back with the `healAudio` function in `research/native-feel/shell.md`.
- [x] The app sets `navigator.audioSession.type = "playback"`. The silent switch test is in ticket 16.
- [x] The credits list has an entry for each shipped file.

## Comments

**2026-11-10, agent (branch `ticket/05-card-sounds`).** What I built:

- `src/sound/sounds.json`: the slots (lift, snap, wrong, flip, deck, group, level), their candidates, the first choice (`pick`), `sure` or `doubt`, and the source of each clip. This file is also the data of the listening page.
- `scripts/audio/prep.py` (Python 3.11, ffmpeg, no pip package): downloads each source into `.cache/audio/`, converts it, trims the start silence (peak detection, −50 dBFS), cuts and fades, measures I and TP, sets the gain, and applies the snap limit. It writes `public/sounds/` (picked files, precached), `public/listen/clips/` (other candidates, not precached), the code table `src/sound/levels.ts`, and the sound entries of `src/credits.json`. Tickets 13 and 17 use the same script.
- `src/sound/`: one `AudioContext`, made at the first touch and reused. `pointerdown` and `pointerup` call the unlock (for a touch, only `pointerup` is a user gesture). `visibilitychange` calls `healAudio` from shell.md. An offline context decodes the files before the first touch, so the buffers stay good when the heal makes a new context. `playSound(slot, note)` plays a slot at its gain. The snap plays the major scale: note n of the event `noteIndex`.
- The UI plays lift on `pointerdown` of a card, and the sound of each model event (`src/ui/sounds.ts`: `snapped` → snap with its note, `rejected` → wrong).
- `/listen/` is a second Vite page (`listen/index.html`). Its code goes to `dist/listen/`. `globIgnores: ['listen/**']` keeps it and its clips out of `sw.js`, and `navigateFallbackDenylist` stops the service worker from showing the game for `/listen/`.

Decisions:

- First choices, all from measurement only (nobody listened): snap Kalimba G4 (doubt), lift Bubble Pop (doubt), flip Kenney `card-place-1` (doubt), deck Kenney `cards-pack-take-out-1` (doubt), group "Tada Fanfare A" (doubt). Wrong drop (Boing 2) and level complete (fanfare) are `sure` with one candidate, because the spec names them.
- The sources of the labrynth2 effects are the same Freesound previews. The script gives the same I and TP as labrynth2 (Bubble Pop −29.0/−6.5, fanfare −20.2/−6.6).
- The fanfare keeps the labrynth2 cut: 0 to 3.7 s with a 0.5 s fade-out (`cut.fadeOut`). A cut that starts at 0 keeps the attack of the recording, so it gets no fade-in. A cut that starts later gets the 0.05 s fade-in. The default fade-out is 0.2 s.
- The rule follows the measured length. The kalimba is 2.5 s (a quiet ring: −20 dB after 0.15 s), so the −18 − I rule with the −1 dBTP limit sets it. The short snap candidate "Pizzicato D6" (0.36 s) gets −6 − TP. A snap candidate gets no snap limit, because it is the reference when the Parent picks it.
- The gain is not in the file. The sound module applies `gainDb` from `src/sound/levels.ts`, as labrynth2 does with `volume_db`.

Open:

- Flip, deck, group complete, and level complete ship and have a slot, but the model has no `flipped`, `dealt`, `groupComplete`, or `levelComplete` event yet. Tickets 06 and 08 add a case to `playEventSound`.
- The silent switch, the heal after a lock or a phone call, and the iPhone speaker level are device checks of ticket 16. The headless check (Chromium) showed one `AudioContext`, snap note 0 at rate 1 and note 1 at rate 1.1225, the wrong drop at −4.5 dB, the start after a suspended context, and `audioSession.type` set to `playback`.

**2026-11-10, agent (branch `ticket/review-fixes`, code review 1).** The snap now uses the `-6 - TP` rule at each length, as the acceptance box says ("The snap and the pluck use this rule"). Before, `prep.py` chose the rule by the file length only, so the kalimba (2.5 s) got the `-1 - TP` limit. `gain_for` now gives the rule `pluck` to each snap candidate. The project has no other pluck slot: the snap is the pluck. Results of `python3 scripts/audio/prep.py`:

- The kalimba gain goes from +8.2 dB to +3.2 dB, so its true peak is −6.0 dBTP. Its maximum momentary loudness M goes from −21.1 to −26.1 LUFS.
- The snap limit lowers each other file to M ≤ −26.1 LUFS, so all sounds are about 5 dB quieter than before. The WAV files did not change (the gain is not in the file). Only `src/sound/levels.ts` changed.
- An independent measurement of each shipped file (`ffmpeg -af ebur128=peak=true`, and `volume=<gain>dB,apad=whole_dur=0.4,ebur128=peak=true` for M) gives the I and TP of `levels.ts`, the snap at −6.0 dBTP, and no file above the M of the snap.
- The level on the iPhone speaker stays a device check of ticket 16.
