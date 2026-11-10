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

- [ ] Each slot has 3 candidates when a choice is open. The agent sets one candidate as the first choice and marks the slot `sure` or `doubt`. A slot is `doubt` when two candidates are close or no candidate is good.
- [ ] The first choice of each slot ships and plays in the game.
- [ ] A listening page at `/listen/` plays each candidate. It shows the `doubt` slots first and the `sure` slots below them. It has keep and replace buttons and a Copy answers button, as in labrynth2 (`.scratch/labyrinth-game/prototypes/sounds-LISTEN/`). The page is deployed with the app, has no link from the game, and is not in the precache.
- [ ] Convert each file to mono WAV, 16-bit, 44.1 kHz, as in labrynth2 spec §9.5.
- [ ] Fades: a clip cut from a longer recording gets a fade-in of 0.05 s and a fade-out of 0.2 s, as in labrynth2 §9.5. A file that is not cut gets no fade-in, because a fade removes the attack of a click or the pluck. Trim only the silence below −50 dBFS at the start, so the sound starts at once.
- [ ] Level of a file of 0.4 s or longer: the labrynth2 loudness step (spec §9.6), gain `-18 - I`, with a true-peak limit of −1 dBTP.
- [ ] Level of a file shorter than 0.4 s: ebur128 cannot measure its integrated loudness. Set the gain to `-6 - TP`, so the true peak is −6 dBTP. The snap and the pluck use this rule.
- [ ] No file is louder than the snap. To compare, pad each file after its gain with silence to 0.4 s (`apad=whole_dur=0.4`) and read the maximum momentary loudness M with `ebur128=peak=true`. Lower each file with an M above the snap until it passes. A table in code holds the measured values and the gains.
- [ ] One `AudioContext` is unlocked by the first touch and reused. After a lock, an app switch, or a phone call, the context comes back with the `healAudio` function in `research/native-feel/shell.md`.
- [ ] The app sets `navigator.audioSession.type = "playback"`. The silent switch test is in ticket 16.
- [ ] The credits list has an entry for each shipped file.
