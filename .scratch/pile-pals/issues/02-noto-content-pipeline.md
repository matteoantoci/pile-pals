# 02: Noto content pipeline

Spec: [spec.md](../spec.md)

**What to build:** The fixed level shows real Noto 2D cards instead of placeholders. The content pipeline makes one catalog and the optimised picture and animation files from the Noto sources.

**Blocked by:** 01 (Tracer bullet: one level on the iPhone)

**Status:** ready-for-agent

- [x] The pipeline uses Noto 2D pictures for all cards. The Fluent pictures are not used.
- [x] For each card with a Noto animated twin, the pipeline reads the Lottie `rest` marker and encodes the loop again so that it starts at the rest frame. The still picture of that card is the rest frame.
- [x] Colour tags are computed again from the still picture that the game ships.
- [x] The catalog records each card's groups, `maybe` tags, colour, and animated twin. It also gives P, the number of pals with an animation.
- [x] The pipeline chooses AVIF or WebP for the animations from a size measurement. The total offline download size is recorded in this ticket. The limit is 150 MB. If the total is more than 150 MB, stop and report the largest files.
- [x] The old default path `/tmp/kids-solitaire-src` is renamed.
- [x] The fixed level from ticket 01 shows Noto cards from the catalog.

## Comments

**Offline size: 21,828,262 bytes (21.8 MB) of 150 MB.** 5.8 MB stills and 16.0 MB animations.
The largest files are 484 KB (ferris-wheel), 405 KB (bicycle) and 252 KB (pinata); each file is
below the 2 MiB precache limit, so the service worker holds all of them (`precache 818 entries`).

**P = 257 pals.** 564 cards are kept, 535 are shipped (a card with no group never shows in a level),
12 more pictures are anchors only (the coloured hearts and the red circle).

**Animation format: animated AVIF** (`avis`, 30 frames per second, 256 px, loop). The same loops
as WebP came to 107.9 MB, so AVIF is 6.7 times smaller. The measurement per card is
`research/content/data/animation_sizes.csv`. An iPhone 12 with iOS 26 decodes animated AVIF in an
`<img>` (Safari 16.1 and later).

**Rest frame.** The marker `rest`, matched with no case (6 files write `Rest`). 12 files have no
marker; for those the pipeline uses frame `ip`, but if one frame is clearly more like the Noto 2D
picture (1.5 times closer) then that frame is the rest frame. That rule is necessary for Dolphin and
Running shoe, whose frame 0 is empty, and it also fixes the bite in Pizza frame 0 and the nozzle in
Fuel pump frame 0. `pictures.loop_order` starts the loop at that frame and drops frame `op`, which
repeats frame `ip`.

**Stills.** 256 px WebP quality 90, from the Noto 2D 512 px PNG, or from the rest frame of the
Lottie file for a pal. 256 px is the size of the card picture: 80 CSS px at 3x on an iPhone 12 is
240 device px, and the lift makes the picture a little larger.

**Colour tags.** `colour.analyse` now reads the still that the game ships. The hue borders were
retuned on Noto 2D: Noto draws red as a bright orange-red (the red apple is `#ff5116`, hue 15) and
wood as the same hue but darker, and metal and glass in a light blue-grey. The pixel names `pale`
and `steel` make no colour group. `tag_schema.COLOUR_OVERRIDES` was redone on the Noto contact
sheets (`research/content/data/sheets/*.png`); a person should re-check them before release.
305 cards have a colour. Purple has 4 members and stays a GAP.

**Open item for ticket 16 (device only, not tested here):** the decode cost of 8 animated AVIF
cards on the iPhone. Ticket 07 limits the number of animations that play at the same time.

**Notes for the next tickets:** `src/model/catalog.ts` has the catalog shape, P (`catalog.pals`), and the
fields that the fairness rule of ticket 03 needs. `src/ui/pictures.ts` loads a picture and an animation.
