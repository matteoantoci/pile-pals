# 13: Pal sounds

Spec: [spec.md](../spec.md)

**What to build:** Pals on the title scene, in parades, and in the sticker book play real animal and vehicle sounds. Pals with no own sound play a pop. A big pal plays a low pop, and a small pal plays a high pop. The agent chooses a first sound for each pal. The Parent listens only to the sounds that the agent marks as a doubt (ticket 17).

**Blocked by:** 02 (Noto content pipeline), 05 (Card sound effects)

**Status:** ready-for-agent

## Sources

- labrynth2 (`~/Personal/labrynth2/assets/audio/friends/*.wav`) has 13 sounds: crab, dolphin, duck, fish, flamingo, jellyfish, octopus, otter, penguin, seal, squid, swan, whale. 5 of them are cartoon effects, not animal calls: scissors snips, a squeak, bubbles (2 files), and a bottle squirt (`credits.txt`). Reuse them.
- The otter sound is CC BY 4.0 ("Otters Squeaking.wav" by Motion_S). It goes into the credits with the text from labrynth2 `credits.txt`.
- New sounds: Freesound `-hq.mp3` preview files (no login). Use CC0 only. A CC BY file is allowed only when no CC0 file is good, and it goes into the credits.

## Acceptance

- [ ] The 13 labrynth2 sounds are used for the matching pals that the catalog of ticket 02 contains.
- [ ] The agent chooses about 30 more pals from the catalog: each pal whose real thing has a sound that a child knows. Examples: dog, cat, cow, lion, car horn, train, fire engine.
- [ ] Each of these pals has 3 Freesound candidates. The agent sets one as the first choice and marks the pal `sure` or `doubt`, with the rule of ticket 05.
- [ ] The pals are added to the listening page of ticket 05, `doubt` pals first.
- [ ] The agent tags each pal with no own sound `S`, `M`, or `L` for its real size. Examples: ant `S`, cat `M`, elephant `L`. The pop plays at a high, middle, or low `playbackRate` for the tag. No Parent check is necessary.
- [ ] Each file is converted, cut, and set to a level with the method of ticket 05. No pal sound gets a level above the snap.
- [ ] A Vitest test checks that each shipped picture and sound file has an entry in the credits list, as in labrynth2.
