# Pile Pals: build spec

Status: ready-for-agent
Date: 2026-11-10

This spec overrides older text in `research/`. The research files give the evidence and the sources. This file gives the decisions. When a research file and this file do not agree, this file is correct.

## Problem Statement

The Parent has a daughter of 4 or 5 years. She cannot read. The Parent likes the game "Solitaire Associations: Words" (solitaireassociationswords.com), but that game is for adults:

- It uses written words.
- It has a move limit, and a level can end in a loss.
- It requires planning with hidden cards, a deck, free columns, and undo.

The Parent wants a version of this game for the Child. The game must run on the Child's iPhone as a home-screen app and feel like a native app. The game must teach itself with no words and no speech, and it must give the Child many hours of play with no frustration.

## Solution

Pile Pals is a picture card game. It is a home-screen web app (PWA) for iPhone. The Child drags picture cards onto category piles, for example fruit, animals that swim, or red things.

- **Pictures, no text.** Each card shows one Noto 2D emoji picture. The game shows no text and plays no speech. Motion and sound give all feedback.
- **No fail state.** The game has no move limit, no timer, and no loss. A wrong drop shakes the card, and the card springs back. Each level can always be finished.
- **Mechanics close to the original, made simpler.** Some cards are face-down and turn over when the card on top of them moves away. A deck gives more cards. In later levels, the Child finds the category cards and puts them on empty slots.
- **Cards that come alive.** About half of the cards have a Noto animated twin. The animation plays at reward moments. The code moves the cards that have no twin.
- **A sticker book as the reward.** After each level, the Child gets a new sticker and places it on a page of her sticker book.
- **Real sounds.** Recorded CC0 sounds play for card actions, and real animal and vehicle sounds play for the pals.

Screens: title scene → level → reward (the sticker book page) → title scene.

## User Stories

### Play

1. As the Child, I want to drag a picture card with my finger, so that I can move it to a pile.
2. As the Child, I want the card to follow my finger with no delay, so that the game feels real.
3. As the Child, I want the card to lift and grow a little when I touch it, so that I know that I hold it.
4. As the Child, I want a card to snap onto the correct pile when I drop it near the pile, so that I do not need an exact drop.
5. As the Child, I want a happy sound when a card snaps, so that I know that I was correct.
6. As the Child, I want each correct card on a pile to play a higher note than the last card, so that I hear the pile grow.
7. As the Child, I want a wrong drop to shake the card softly and send it back, so that I can try again without a feeling of failure.
8. As the Child, I want a wrong drop to play a soft "boing", so that I hear that the card does not go there.
9. As the Child, I want a wrong drop to cost nothing, so that I can try as many times as I want.
10. As the Child, I want a face-down card to turn over when the card on top of it moves away, so that I get a small surprise.
11. As the Child, I want to tap the deck to get new cards, so that I can continue when no card on the table fits.
12. As the Child, I want the deck to start again after its last card, so that no card is lost.
13. As the Child, in later levels, I want to find a category card and put it on an empty slot, so that I choose the piles myself.
14. As the Child, I want a completed group to leave the table in a parade, so that I see that I finished a group.
15. As the Child, I want animated pals to move during the parade, so that the reward feels alive.
16. As the Child, I want confetti and a fanfare when I finish a level, so that I feel proud.
17. As the Child, I want each level to show only one kind of association, for example only colours, so that I do not need to switch rules in one level.
18. As the Child, I want no card that fits two piles on the table, so that each correct answer is clear.
19. As the Child, I want no two piles that look alike in one level, for example red and orange, so that I can tell the piles apart.
20. As the Child, I want a level never to get stuck, so that I can always finish it.
21. As the Child, I want early levels with 2 piles and few cards, so that I can start easily.
22. As the Child, I want later levels with more piles, more cards, face-down cards, and the deck, so that the game stays interesting.
23. As the Child, I want many different groups (kinds, colours, homes, things that go together, how things move), so that the game does not repeat.

### Learning with no words

24. As the Child, I want a semi-transparent hand to show the first move in level 1, so that I understand the game with no words.
25. As the Child, I want the demo hand to stop when I touch the screen, so that I can play at once.
26. As the Child, I want a short hand demo the first time that a new action appears (the deck, a face-down card, a category card), so that I learn one action at a time.
27. As the Child, I want the correct card to hop after about 5 seconds of no action, so that I get a hint when I am stuck.
28. As the Child, I want the demo hand to show again after 2 hops with no action, so that I get more help when I need it.
29. As the Child, I want the demo not to show again on each launch, so that it does not interrupt me after I know the game.

### Title scene

30. As the Child, I want an animated title scene with pals that hop and fall into piles, so that the game looks fun at the start.
31. As the Child, I want to tap a pal on the title scene and see it jump with its sound, so that the start screen is fun to touch.
32. As the Child, I want one large green round button with a white arrow to start, so that I know where to tap without words.
33. As the Child, I want a book icon on the title scene, so that I can look at my old sticker pages.
34. As the Child, I want the title scene to wait for me, so that I decide when to play.

### Stickers

35. As the Child, I want a new sticker after each level, so that I get a reward for each level.
36. As the Child, I want the sticker to be a pal from a group of the level that I played, so that the reward links to what I sorted.
37. As the Child, I want never to get a sticker that I already have, so that each reward is new.
38. As the Child, I want a gold sticker on every 20th level, and on every level after I have all normal stickers, so that I can look forward to a special reward.
39. As the Child, I want to drag the new sticker to any place on the book page, so that I make my own picture.
40. As the Child, I want to tap a sticker in the book and see it move with its sound, so that my stickers are alive.
41. As the Child, I want a new page when the current page is full, so that I always have space.
42. As the Child, I want the green arrow button on the book page to place my sticker by itself if I do not drag it, so that I can skip the book when I want.
43. As the Child, I want a celebration with no sticker when the book is complete, so that the reward screen still feels good.

### Continuity

44. As the Child, I want the game to be on the same table when I come back, so that I do not lose my level.
45. As the Child, I want no white flash and no browser bars, so that the game feels like a real app.
46. As the Child, I want the game to work with no internet, so that I can play in the car.
47. As the Child, I want an app update never to interrupt a level, so that my game does not restart.

### Parent

48. As the Parent, I want to install the game from Safari to the home screen, so that I need no App Store.
49. As the Parent, I want a parent area that the Child cannot open, so that she cannot reset her progress.
50. As the Parent, I want to open the parent area with a 3-second hold on the logo and a multiplication problem, so that only an adult gets in, as in YouTube Kids.
51. As the Parent, I want a new multiplication problem each time, with factors from 3 to 9, so that the Child cannot learn the answer.
52. As the Parent, I want to export a save code, so that I can keep the progress if iOS deletes the app data.
53. As the Parent, I want to restore from a save code, so that I can move the progress to a new device.
54. As the Parent, I want to reset all game data with a confirmation, so that I can start again on purpose only.
55. As the Parent, I want to turn sound effects on or off, so that I can control the noise.
56. As the Parent, I want a credits page, so that the game obeys the CC BY 4.0 licence of Noto Animated and of the sounds that need a credit.
57. As the Parent, I want the game to play sound when the iPhone silent switch is on, if iOS allows it, so that I do not think that the game is broken.
58. As the Parent, I want all sounds to be soft, so that the game does not disturb other people.
59. As the Parent, I want to choose the sounds by listening, with keep and replace buttons, so that the sounds are of good quality.
60. As the Parent, I want updates to reach the phone with no action from me, so that the Child always has the latest version.

## Implementation Decisions

### Stack

- Vite, TypeScript 7 (the native compiler, all strict checks), vite-plugin-pwa, Vitest.
- Lint and format: oxlint and oxfmt through `oxc-config-ai-guardrails` (the Parent's own package). Use the `base` and `typescript` presets only.
- Pre-commit hook with git `core.hooksPath` and no hook library. It runs, cheapest first: `oxfmt --check` → `oxlint` → `oxlint --type-aware` → `tsc --noEmit` → `vitest run --passWithNoTests`.
- UI framework: Solid, as in smart-games. A re-render must never overwrite a transform that the drag code writes.
- Git default branch: `master`. The repo is public. Hosting: GitHub Pages.
- Issue tracker: local Markdown in `.scratch/`, as described in `docs/agents/issue-tracker.md`.

### Modules

1. **Game model (headless).** Pure TypeScript with no DOM, no time, and no audio. It is the only test seam. Interface:
   - `start(progress, seed) → GameState`: deals the next level for the current progress.
   - `apply(state, action) → { state, events }`.
   - Actions: `dropCard(cardId, pileId)`, `tapDeck()`, `placeAnchor(cardId, slotId)`, `placeSticker(position)`, `go()`.
   - Events: `snapped(cardId, pileId, noteIndex)`, `rejected(cardId)`, `flipped(cardId)`, `dealt`, `groupComplete(pileId)`, `levelComplete`, `stickerAwarded(stickerId, gold)`, `stickerPlaced`, `bookComplete`.
   - `snapshot(state) → SaveData` and `restore(SaveData) → GameState`.
   - The UI contains no game rule. It draws the state and plays motion and sound for each event.
2. **Level generator** (inside the game model). Builds a level from the content catalog and a seed:
   - One association type per level.
   - The fairness rule from `research/native-feel/content-model.md` §5: no card fits two shown groups, no confusable groups together, at most one picture of each thing, and enough safe cards for each group.
   - Difficulty grows with the level number: number of piles (2 to 4), cards for each group (3 to 5), face-down cards, the deck, and category cards that the Child places. Levels 1 to about 10 show all category cards on their piles at the start.
   - One slot for each group in the level.
   - **Dead-end check.** A move in this game can never make the table worse: cards only leave the table, a wrong drop changes nothing, and a category card always has a free slot. So the generator plays every legal move until no move is left. If cards remain, it rejects the deal and deals again with the next seed.
3. **Sticker rules** (inside the game model).
   - One sticker after each level. The sticker is a pal with a Noto animation.
   - The first choice is a pal from a group of the level that the Child does not have. The second choice is any pal that the Child does not have.
   - Every 20th level gives a gold sticker: the gold version of a pal that the Child already has.
   - When the Child has all normal stickers, every level gives a gold sticker.
   - No duplicates. Each pal exists as normal and gold. P is the number of pals in the catalog, which the content pipeline sets. So the book holds 2P stickers.
   - Count with these rules: after level N, the Child has N − ⌊N/20⌋ normal stickers while normal stickers remain. The last normal sticker comes at the smallest level L with L − ⌊L/20⌋ = P. Every level after L gives a gold sticker. Level 2P gives the last sticker and `bookComplete`.
   - Example with the current estimate P = 260: L = 273 (273 − 13 = 260), and the book is complete at level 520.
   - After level 2P, the reward screen shows a celebration with no sticker.
   - A page holds about 12 stickers. A full page opens a new page.
4. **Content pipeline** (build time, Python in `research/content/`). Changes from Fluent to Noto 2D:
   - Pictures come from the Noto 2D set (Apache 2.0). All 564 cards have a Noto picture.
   - Colour tags are computed again from the still picture that the game ships: the rest frame for a card with an animated twin, and the Noto 2D picture for the other cards. The colours of an animation can be different from the Noto 2D picture (the butterfly is an example).
   - Each card records whether a Noto animated twin exists. 260 of the 542 tagged cards have one.
   - Animated files are AVIF or WebP, which always start at frame 0. Frame 0 is not always the rest pose. The pipeline therefore reads the `rest` marker from each Lottie file and encodes the loop again so that it starts at the rest frame. No Lottie player ships in the game.
   - For a card with an animated twin, the still picture is the rest frame of the animation. So the swap from still to animation shows no jump.
   - Output: one catalog file that the game model imports, plus the optimised picture and animation files.
5. **Missing pictures.** 10 things have no emoji: towel, rubber duck, starfish, seahorse, excavator, crane, dump truck, sweater, pyjamas, pacifier. Make them with Grok Imagine (`grok-imagine-image-2.0` edits with 3 Noto 2D reference pictures) and remove the background with rembg and BiRefNet. These cards get no animation.
6. **Board UI.** Draws the table, the piles, the deck, and the slots. Drag rules from `research/native-feel/motion.md`:
   - Write the `transform` directly in `pointermove`. Use `touch-action: none` and `setPointerCapture`. Never use `touch-action: manipulation`.
   - Animate only `transform` and `opacity`, with WAAPI `element.animate()`. Use no Motion library and no CSS transitions on cards.
   - Springs are sampled keyframes with `easing: 'linear'`, and the release speed of the finger is given to the spring.
   - The card shadow is a separate element with a static shadow, faded with `opacity`.
7. **Motion and reward layer.** Plays the event animations: lift, snap, shake back, flip, parade, confetti (canvas-confetti), hint hop, and the demo hand. Animated pictures play only at reward moments. At most 8 play at the same time until the device test confirms more.
8. **Sound module.** One `AudioContext`, unlocked by the first touch on the title scene. Recorded files only:
   - Card actions: Kenney Casino Audio (CC0) for slide, place, flip, and deck sounds. Open the pack and confirm the files before use.
   - Effects reused from labrynth2: Boing 2 (wrong drop), Bubble Pop (lift or sticker), Success Fanfare Trumpets (level complete), all CC0.
   - Rising snap notes: one recorded pluck played at a higher `playbackRate` for each card on the pile.
   - Pal sounds: the 13 labrynth2 animal sounds, plus Freesound CC0 sounds for about 30 more pals, downloaded as `-hq.mp3` preview files (no login). The other pals get a short "pop" at a pitch for their size.
   - The Parent chooses the sounds on a listening page with keep and replace buttons, as in labrynth2.
   - Set `navigator.audioSession.type = "playback"` and test whether the silent switch then allows sound.
9. **Shell.** From `research/native-feel/shell.md`:
   - Start image and background colour so that no white flash shows.
   - vite-plugin-pwa with `registerType: 'prompt'` and no visible prompt. The app applies an update on the title scene before the first touch, or on the green arrow of the reward screen.
   - Save to `localStorage` after each resolved move. Save the full deal, not only the seed, with a schema version. On `visibilitychange` to `hidden`, cancel any drag and save.
   - Restore before the first frame. A restored level skips the title scene.
10. **Title scene.** Animated pals hop and fall into 3 small piles in a loop. The logo is a card pile with eyes. One green round button with a white arrow. A book icon opens the sticker book. A tap on a pal makes it jump with its sound. A 3-second hold on the logo opens the parent check.
11. **Parent area.** English text is allowed here. Entry: a 3-second hold on the logo, then a multiplication problem with factors from 3 to 9 and a digit pad. A wrong answer closes the check. Content: credits, export save code, restore save code, reset with confirmation, sound on or off.

### Save data shape

The save data holds a schema version, the current level number, the full current deal (table, face-down flags, deck, piles, slots), the sticker collection with gold flags, sticker positions for each page, and flags for the demos that the Child already saw. The export code is this data, compressed and encoded as text.

## Testing Decisions

- A good test checks the behaviour that the Child or the Parent can see through the game model interface: the actions in and the state, events, and save data out. A test never checks internal functions, the DOM, or the animation code.
- Only the game model is tested, with Vitest and the real content catalog.
- Tests to write:
  1. For many seeds and level numbers, each generated level can be finished: the dead-end check finds no stuck deal.
  2. For many seeds, no card in a level fits two shown groups, and no confusable groups appear together.
  3. A drop on a wrong pile returns a `rejected` event and the same state.
  4. A drop on the correct pile returns `snapped` with the correct note index, and the last card of a group gives `groupComplete`.
  5. Sticker rules, over a full run of 2P + 10 levels, with P read from the catalog: no duplicates; gold on every 20th level; the last normal sticker at level L as defined above; gold on every level after L; gold is always a version of a pal that the Child has; the last sticker and `bookComplete` at level 2P; no sticker after level 2P.
  6. `restore(snapshot(state))` gives a state that plays the same as the original.
  7. The difficulty grows: early levels have no face-down cards, no deck, and all category cards on their piles.
- Prior art: smart-games uses Vitest for its solver and legality rules as pure functions. labrynth2 has an asset test that checks each sound file against the credits list. Pile Pals can add the same credits check for pictures and sounds.
- Motion, sound, drag feel, and the shell are not tested by code. The Parent tests them on the iPhone 12 with iOS 26. Device checks:
  1. Does the silent switch mute the game?
  2. Do 8 animated stickers play smoothly during a drag?
  3. Is the total offline download size acceptable?

## Out of Scope

- Music. The Parent did not choose a track. Version 1 has no music.
- Haptics. iOS 26.5 and later blocks the script routes. A possible tap haptic on the deck is a later experiment.
- Two association types in one level, fine emotions, letters, numbers, and rhymes.
- Undo, hints that cost something, scores, stars, timers, and move limits.
- Parent options to turn off association types, to choose a level, or to limit play time.
- Accounts, cloud sync, analytics, and the App Store.
- Other languages and any speech.
- End-to-end UI tests.

## Further Notes

- Research files: `research/native-feel/motion.md`, `shell.md`, `haptics-assets.md`, `ai-sprites.md`, `content-model.md`, and the scripts in `research/content/`.
- `research/native-feel/content-model.md` and `ai-sprites.md` were written for Fluent 3D. The groups, the fairness rule, and the counts stay valid. Pictures, colour tags, and the style references change to Noto 2D.
- `research/content/data/compare-noto3d-vs-animated.png` shows why the game uses Noto 2D: the 3D stills and the flat animations do not match.
- The Noto 3D licence question (Apache 2.0 or OFL 1.1) no longer applies, because the game uses Noto 2D.
- Credits must list: Noto Animated (CC BY 4.0), Noto 2D (Apache 2.0), each CC BY sound (for example the otter sound), and each CC0 source as thanks.
- Some scripts in `research/content/` use the old default path `/tmp/kids-solitaire-src`. Rename it when the pipeline changes.
- Sticker timeline with P = 260 at 2 to 3 minutes for each level: the normal stickers last 273 levels, about 9 to 14 hours of play. The book is complete after 520 levels, about 17 to 26 hours. The first gold sticker comes at level 20, after about 40 to 60 minutes. These numbers change when the pipeline sets P.
