# Content model: picture groups for a 4–5-year-old

This document answers five questions for the picture version of "Solitaire Associations":

1. Which kinds of groups can a 4–5-year-old sort, according to research?
2. How many usable pictures does Microsoft Fluent Emoji 3D give us?
3. Which groups (tags) can we build from them, and how many cards does each group get?
4. Which rule keeps a level fair when one picture fits several groups?
5. How many fair levels does this give, and which pictures are missing?

All counts below come from the scripts in `research/content/`, run on the real data (see [How to reproduce](#9-how-to-reproduce)). Anything without a source is marked **unverified**.

---

## Summary

- **Research:** 4–5-year-olds sort well by "basic" kinds (dogs, cars), by everyday scripts ("things for breakfast"), and by clear colours. They find it hard to switch between two ways of sorting in one task, and their colour and emotion words are broad at the edges. So: **one association type per level**, **no neighbouring colours together**, **feelings only as happy vs sad**.
- **Data:** Fluent Emoji has **1,595** emoji folders. **All 1,595** have a 3D PNG (256 px wide). After removing flags, symbols, gestures, gender and skin-tone copies, faces, adult, scary, culture-specific and duplicate pictures, **564 cards** remain.
- **Schema:** **84 groups** in **9 association types**. 542 of the 564 cards are in at least one group. **7 groups have fewer than 5 cards** (gaps): fish, dinosaurs, furniture, polar animals, shopping, things that hop, things that crawl.
- **Fair levels:** with the "no card fits two shown groups" rule, the data supports **27,544** different fair level setups with 3 cards per group (**11,692** with 5 cards per group). At 2–3 minutes per level (**assumption**) that is **918–1,377 hours** of play before any group combination repeats. Even the gentle setups alone (2–3 groups, 3 cards) give **5,006 setups = 167–250 hours**.
- **Noto 3D:** every one of the 564 cards also exists as a Noto 3D 512 px PNG. Noto adds **13** child-friendly pictures that Fluent does not have (Emoji 16–18), for example orca, shovel, harp and lighthouse.

---

## 1. What 4–5-year-olds can sort

### 1.1 Sources

| # | Finding (quoted) | Source | What it means for the game |
|---|---|---|---|
| 1 | "Basic objects are shown to be the most inclusive categories for which a concrete image of the category as a whole can be formed, to be the first categorizations made during perception of the environment, to be the earliest categories sorted and earliest named by children" | Rosch et al. 1976, *Basic objects in natural categories*, Cognitive Psychology 8 (abstract): full text at <https://www.cns.nyu.edu/~msl/courses/2223/Readings/Rosch-CogPsych1976.pdf>, record at <https://eric.ed.gov/?id=EJ143955> | Groups whose members share one shape ("cars", "birds", "shoes") are the easiest. |
| 2 | "At all age levels, basic level sorts were virtually perfect; for the 3-yr-olds, the percentage correct for basic level sorts was 99, and for 4 yr and older, basic level sorts were perfect. Performance was considerably lower for the youngest age group, however, on sorts of the triads which could only be paired at the superordinate level: 3-yr olds, 55% correct; 4-yr olds, 96% correct." | Rosch et al. 1976, Experiment 8 (same PDF) | Broad groups such as "animals" vs "vehicles" work for 4-year-olds in a simple "which one goes with this?" format. |
| 3 | "For the basic level categories, all but one child in kindergarten and all but one child in the first grade sorted in an adult taxonomic fashion. For superordinate level sorts, however, only half of the children in each of those grades sorted taxonomically." (kindergarten mean age 5 yr 7 mo) | Rosch et al. 1976, Experiment 9 (same PDF) | Free sorting into several broad groups is still hard at 5–6. Start with 2 groups and use groups whose members look alike; add groups slowly. |
| 4 | "Children revealed no pervasive preference for either thematic or taxonomic relations." (ages 2–4) | Waxman & Namy 1997, Developmental Psychology 33(3): <https://pubmed.ncbi.nlm.nih.gov/9149935> | Both "same kind" groups and "goes together" groups suit this age. |
| 5 | "The results showed that 4- and 7-year-olds categorized foods into all 3 categories, and 3-year-olds used both taxonomic and script categories. Experiment 3 found that 4- and 7-year-olds can cross-classify items, that is, classify a single food into both taxonomic and script categories." | Nguyen & Murphy 2003, *An apple is more than just a fruit*, Child Development 74(6): <https://pubmed.ncbi.nlm.nih.gov/14669896> | Script groups ("breakfast things") work. A child will also see that one picture fits several groups, so the level rule must stop that (section 5). |
| 6 | "For the 5-year-olds, slot-filler categories led to superior recall, higher levels of organisation, and shorter latencies than taxonomic categories in both recall conditions" | Yu & Nelson 1993, International Journal of Behavioral Development 16(1): <https://www.ovid.com/journals/ijbd/abstract/10.1177/016502549301600101~slot-filler-and-conventional-category-organisation-in-young> | Routine-based groups (bath time, bedtime, beach) may be even easier than "same kind" groups at 5. |
| 7 | "Most 3-year-olds perseverate during the post-switch phase … By 5 years of age, most children switch when instructed to do so." | Zelazo 2006, *The Dimensional Change Card Sort*, Nature Protocols 1: <https://experts.umn.edu/en/publications/the-dimensional-change-card-sort-dccs-a-method-of-assessing-execu/> | Switching between two ways of sorting (colour, then kind) is hard until about 5. **One association type per level.** A mixed level ("red things" next to "fruit") could be a later hard mode for 5+ (**unverified** for this game). |
| 8 | "Recent reports suggest that children now acquire color words earlier, around 3 or 4 years of age, but nevertheless struggle to learn them" and "these overextensions are due to overly broad color categories" | Wagner, Dobkins & Barner 2013, *Slow mapping*, Cognition 127(3): <https://quote.ucsd.edu/kdobkins/files/2017/05/WDB2013-1.pdf>, abstract at <https://pubmed.ncbi.nlm.nih.gov/23542408> | Colour groups suit this age, but children's colour borders are wide. **Never show neighbouring colours together** (red+orange, pink+purple …). The game asks for matching, not naming; that matching is easier than naming is **unverified**. |
| 9 | "Children identified circles quite accurately, only a few of the youngest children chose the ellipse and curved shape" and children "were less accurate recognizing triangles and rectangles" (ages 3–6) | Clements 1998, *Geometric and Spatial Thinking in Young Children* (reports Clements et al. 1999): <https://files.eric.ed.gov/fulltext/ED436232.pdf> | "Round" is the safest shape group. Avoid triangle and rectangle groups. The study used line drawings, not objects, so using it for object pictures is **unverified**. |
| 10 | "Four-year-olds were reliably accurate about the movement potentials for each of the five classes of items" | Massey & Gelman 1988, Developmental Psychology 24(3): <https://www.ovid.com/journals/depsy/abstract/00063061-198805000-00001~preschoolers-ability-to-decide-whether-a-photographed> | "How does it move?" groups (flies, swims, has wheels) fit 4-year-olds. The narrower groups "hops" and "crawls" are **unverified**. |
| 11 | "Emotion categories begin broad, including all emotions/faces of the same valence, and then gradually narrow over the preschool years." | Widen & Russell 2008, *Children acquire emotion categories gradually*, Cognitive Development 23(2): <https://eric.ed.gov/?id=EJ794664> | Use feelings only as **happy vs sad**. Do not ask for sad vs angry vs scared. |
| 12 | "The children were also significantly better at assigning forest animals to the correct habitat compared to other habitats." and "pre-schoolers` knowledge about local nature, in which they spend time on a weekly basis, is rather high compared to other types of nature." | Wold et al. 2023, Cogent Education: <https://doi.org/10.1080/2331186X.2023.2259513> (abstract read via <https://api.openalex.org/works/doi:10.1080/2331186X.2023.2259513>) | Habitat groups work best for places the child knows (farm, garden, sea). Far places (polar, desert, jungle) depend on books and need very clear anchor pictures (**unverified**). |

### 1.2 Association types chosen

| Type | Example groups | Why it fits 4–5 |
|---|---|---|
| **kind** (taxonomic) | fruit, birds, cars and trucks, shoes, balls | Sources 1–3: basic-level groups are easy; broad groups are fine with 2 groups at a time. |
| **goes with** (function / script) | bath time, breakfast, beach, birthday, rain, doctor | Sources 4–6. |
| **home** (habitat) | farm, sea, forest, jungle, garden | Source 12, best for places the child knows. |
| **colour** | red, yellow, green, blue … | Source 8, with the no-neighbours rule. |
| **moves** | flies, swims, has wheels | Source 10. |
| **shape** | round vs long | Source 9 supports "round"; "long" is **unverified**. |
| **feelings** | happy vs sad | Source 11, two groups only. |
| **hot or cold** | fire, sun vs snow, ice | **unverified** (no source found); two groups only. |
| **big or tiny** (real size, not picture size) | elephant, whale vs ant, snail | **unverified**; extreme examples only. |

### 1.3 Left out as too abstract or not usable

- **Two association types in one level** (source 7). Possible later for 5+ as a hard mode.
- **Fine emotions** (sad vs angry vs scared) (source 11).
- **Triangles, squares, rectangles** as groups (source 9).
- **Neighbouring colours together** (source 8).
- **Living vs non-living, materials (wood/metal/plastic), "opposites" in general, numbers, letters, rhymes.** Rhymes and letters need words, and the game has no text and no speech. Living vs non-living and materials cannot be seen in a picture. All **unverified** (judgement, no source checked).
- **Very fine kinds** (kinds of dog, kinds of car): the emoji set has almost none, and basic level is the easy level (sources 1–3).

---

## 2. The picture source: Fluent Emoji 3D

Repository: <https://github.com/microsoft/fluentui-emoji>, pinned at commit `1ffb34c752ecf5d402f04cfb4b392c77f57c54bc` (2026-08-24). Licence file: "MIT License … Copyright (c) Microsoft Corporation." (<https://github.com/microsoft/fluentui-emoji/blob/1ffb34c752ecf5d402f04cfb4b392c77f57c54bc/LICENSE>).

**Layout (checked in the clone).** One folder per emoji under `assets/<Name>/`, with a `metadata.json`. The 3D picture is `assets/<Name>/3D/<name>_3d.png`. Emoji with skin tones have six sub-folders instead (`Default`, `Light`, `Medium-Light`, `Medium`, `Medium-Dark`, `Dark`), and the 3D picture is under `Default/3D/`. Of the 1,595 default 3D PNGs, 1,593 are 256×256 and 2 are 256×264; 1,578 are RGBA and 17 use a colour palette (the scripts convert all to RGBA).

**Real field names in `metadata.json`** (count of folders that have the field):

| Field | Folders | Example (`Red apple`) |
|---|---:|---|
| `cldr` | 1,595 | `"red apple"` |
| `fromVersion` | 1,595 | `"0.6"` |
| `glyph` | 1,595 | `"🍎"` |
| `group` | 1,595 | `"Food & Drink"` |
| `keywords` | 1,595 | `["apple", "fruit", "red"]` |
| `tts` | 1,595 | `"red apple"` |
| `unicode` | 1,595 | `"1f34e"` (space-separated for sequences) |
| `mappedToEmoticons` | 1,546 | `["apple"]` |
| `glyphAsUtfInEmoticons` | 1,350 | `["apple"]` |
| `unicodeSkintones` | 310 | only on skin-tone emoji |
| `comments` | 1 | |

There is **no `subgroup` field**, only the 9 top-level `group`s. Keywords are thin: `Cow` has only `["cow"]`, `Octopus` only `["octopus"]`. So keyword tagging alone cannot build habitat or script groups; most groups need a hand list (section 4).

**Counts (from `build_content.py`):**

| What | Count |
|---|---:|
| Emoji folders | **1,595** |
| Folders with a 3D PNG | **1,595** (all) |
| 3D PNG files, counting every skin-tone copy | 3,144 |
| Folders with skin tones | 310 |

Folders per Fluent group: People & Body 343, Objects 260, Symbols 223, Travel & Places 218, Smileys & Emotion 169, Animals & Nature 152, Food & Drink 136, Activities 86, Flags 8.

---

## 3. Filter: concrete pictures a child knows

Rules (code: `curation.py`; the full list of dropped pictures with reasons is `data/excluded.csv`):

- Drop whole groups **Flags** and **Symbols**.
- **People & Body**: keep only 46 named pictures (body parts, gender-neutral jobs, story characters, "person swimming / in bed / taking bath"). Drop every "Man …"/"Woman …" copy of a neutral picture, and all hand gestures.
- **Smileys & Emotion**: keep 16 faces for the feelings groups (8 happy, 8 sad) and 4 characters (ghost, robot, alien, clown).
- **Skin tones**: only the `Default` picture is used, so the 3,144 − 1,595 = 1,549 extra skin-tone PNGs never enter.
- Drop by hand: clock faces showing a time, moon phases, religious buildings and objects, adult things (alcohol, money, office paperwork), scary things (coffin, weapons), culture-specific things a European pre-schooler is unlikely to know (oden, mahjong, kimono), abstract pictures, and second pictures of the same thing ("Cat face" next to "Cat").

Every keep/drop choice is a judgement (**unverified**: no study tested these exact pictures with children).

| Result | Count |
|---|---:|
| **Kept cards** | **564** |
| Dropped: symbol | 253 |
| Dropped: gender copy | 165 |
| Dropped: face | 149 |
| Dropped: duplicate | 95 |
| Dropped: person (not in keep list) | 88 |
| Dropped: adult | 57 |
| Dropped: culture-specific | 46 |
| Dropped: hand gesture | 44 |
| Dropped: unfamiliar | 41 |
| Dropped: abstract | 33 |
| Dropped: clock time | 24 |
| Dropped: moon phase | 10 |
| Dropped: religious | 9 |
| Dropped: scary | 9 |
| Dropped: flag | 8 |

Kept cards per Fluent group: Objects 135, Animals & Nature 119, Food & Drink 102, Travel & Places 97, People & Body 46, Activities 45, Smileys & Emotion 20.

---

## 4. Tag schema

### 4.1 How a group is defined

Each group (code: `tag_schema.py`) has:

| Field | Meaning |
|---|---|
| `id`, `type` | Group name and association type. A level uses one type only. |
| `anchor` | Suggested anchor-pile picture: the clearest example of the group. |
| `kw` | Fluent keywords that add a card automatically (for example `fruit`, `insect`, `bird`, `music`). |
| `add` | Cards added by hand (keywords are too thin, see section 2). |
| `remove` | Wrong keyword hits (for example "Crystal ball" has the keyword `ball`; "Feather" has `bird`). |
| `maybe` | Pictures a child **could** also put here, but which we never deal to this group. The fairness rule treats `maybe` as "fits". Tag generously: a missing `maybe` is what makes a level unfair. |
| `maybe_groups` | Every kept card from these Fluent groups is a `maybe` (for example all food is a `maybe` for "kitchen"). |
| `CONCEPT` | Pictures of the same thing (Red apple / Green apple, Books / Open book). At most one per level. |

**Colour groups are computed** (code: `colour.py`, Python + Pillow):

1. Shrink each 3D PNG to 96×96 and keep the opaque pixels.
2. Name every pixel with one of 11 colours by hue, saturation and brightness. The borders are tuned to the Fluent style: its reds lean to magenta (hue about 340°), its browns are light dull oranges, and its blacks are dark slate purple.
3. A card gets a colour if that colour covers at least 50 % of the picture, or at least 35 % and at least 70 % together with its shading neighbours.
4. Any other colour that covers at least 20 % makes the card a `maybe` for that colour.
5. People, body parts and faces never go into colour groups (skin colour is not an object colour).
6. Checked by eye on contact sheets (`data/sheets/<colour>.png`). This led to 57 hand corrections in `COLOUR_OVERRIDES` (50 pictures taken out of colour groups because they have several colours or a colour like "gold" or "beige"; 7 moved to the right colour). The eye check was done by the agent on the sheets; **a person should re-check** before release.

Result: 336 of the 498 colour-eligible cards have one clear colour.

**Shape groups are computed** from the picture outline: "round" = the shape fills at least 80 % of its enclosing circle and is not stretched; "long" = the outline is at least 2.4 times longer than wide (measured along its own axis, so diagonal pencils count). 11 hand corrections after the eye check (for example the cube "Game die" was taken out of "round").

### 4.2 All groups with counts

"Cards" = members; "Distinct things" = members after merging pictures of the same thing; "+ Noto-only" = extra cards from Noto 3D that Fluent does not have (section 8). Groups with fewer than 5 cards are marked **GAP**.

| Type | Category | Anchor | Cards | Distinct things | From keywords | By hand | Computed | "Maybe" | Gap (<5) | + Noto-only |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|
| kind | fruit | Red apple | 20 | 18 | 18 | 2 | 0 | 2 |  |  |
| kind | vegetables | Carrot | 16 | 16 | 8 | 8 | 0 | 4 |  | root vegetable |
| kind | sweets | Lollipop | 13 | 11 | 12 | 1 | 0 | 5 |  |  |
| kind | bread | Bread | 6 | 5 | 0 | 6 | 0 | 8 |  |  |
| kind | meals | Pizza | 15 | 15 | 0 | 15 | 0 | 8 |  |  |
| kind | drinks | Glass of milk | 6 | 6 | 0 | 6 | 0 | 3 |  |  |
| kind | birds | Bird | 16 | 15 | 15 | 1 | 0 | 3 |  |  |
| kind | bugs | Lady beetle | 14 | 14 | 8 | 6 | 0 | 1 |  | monarch butterfly |
| kind | fish | Fish | 4 | 3 | 0 | 4 | 0 | 11 | **GAP** |  |
| kind | flowers | Tulip | 10 | 10 | 10 | 0 | 0 | 4 |  |  |
| kind | trees_leaves | Deciduous tree | 10 | 10 | 0 | 10 | 0 | 4 |  | leafless tree |
| kind | dinosaurs | T-rex | 3 | 3 | 0 | 3 | 0 | 3 | **GAP** |  |
| kind | cars_trucks | Automobile | 14 | 13 | 0 | 14 | 0 | 11 |  |  |
| kind | boats | Sailboat | 6 | 6 | 0 | 6 | 0 | 4 |  |  |
| kind | aircraft | Airplane | 6 | 5 | 0 | 6 | 0 | 4 |  |  |
| kind | trains | Locomotive | 7 | 5 | 0 | 7 | 0 | 2 |  |  |
| kind | instruments | Guitar | 10 | 10 | 9 | 1 | 0 | 4 |  | trombone, harp |
| kind | tools | Hammer | 8 | 8 | 0 | 8 | 0 | 9 |  |  |
| kind | clothes | T-shirt | 16 | 13 | 0 | 16 | 0 | 4 |  |  |
| kind | shoes | Running shoe | 9 | 8 | 5 | 4 | 0 | 3 |  |  |
| kind | hats | Billed cap | 5 | 5 | 0 | 5 | 0 | 2 |  |  |
| kind | balls | Soccer ball | 9 | 9 | 9 | 0 | 0 | 4 |  |  |
| kind | toys | Teddy bear | 11 | 11 | 0 | 11 | 0 | 19 |  |  |
| kind | furniture | Chair | 4 | 4 | 0 | 4 | 0 | 4 | **GAP** |  |
| kind | body | Nose | 10 | 10 | 0 | 10 | 0 | 1 |  |  |
| kind | jobs | Firefighter | 14 | 14 | 0 | 14 | 0 | 2 |  |  |
| kind | fairy_tale_people | Princess | 8 | 8 | 0 | 8 | 0 | 6 |  |  |
| kind | weather | Sun behind cloud | 9 | 8 | 0 | 9 | 0 | 3 |  |  |
| kind | buildings | House | 8 | 8 | 0 | 8 | 0 | 4 |  | lighthouse |
| home | farm | Cow | 13 | 13 | 0 | 13 | 0 | 10 |  |  |
| home | sea | Water wave | 16 | 15 | 0 | 16 | 0 | 6 |  | orca |
| home | jungle | Palm tree | 16 | 16 | 0 | 16 | 0 | 10 |  |  |
| home | forest | Evergreen tree | 14 | 14 | 0 | 14 | 0 | 18 |  |  |
| home | pond | Lotus | 7 | 7 | 0 | 7 | 0 | 7 |  |  |
| home | polar | Snowflake | 3 | 3 | 0 | 3 | 0 | 5 | **GAP** |  |
| home | desert | Cactus | 5 | 5 | 0 | 5 | 0 | 1 |  |  |
| home | pets | House | 8 | 7 | 0 | 8 | 0 | 7 |  |  |
| home | garden | Sunflower | 15 | 15 | 0 | 15 | 0 | 16 |  | monarch butterfly |
| goes_with | bath | Bathtub | 12 | 12 | 0 | 12 | 0 | 5 |  |  |
| goes_with | kitchen | Cooking | 12 | 12 | 0 | 12 | 0 | 91 |  |  |
| goes_with | bedtime | Bed | 7 | 7 | 0 | 7 | 0 | 14 |  |  |
| goes_with | beach | Beach with umbrella | 14 | 13 | 0 | 14 | 0 | 24 |  | lighthouse, shovel |
| goes_with | party | Birthday cake | 7 | 7 | 0 | 7 | 0 | 18 |  |  |
| goes_with | rain | Cloud with rain | 5 | 5 | 0 | 5 | 0 | 9 |  |  |
| goes_with | snow | Snowman | 11 | 11 | 0 | 11 | 0 | 11 |  |  |
| goes_with | school | Backpack | 18 | 11 | 0 | 18 | 0 | 10 |  | eraser |
| goes_with | doctor | Stethoscope | 10 | 10 | 0 | 10 | 0 | 6 |  |  |
| goes_with | gardening | Seedling | 8 | 8 | 0 | 8 | 0 | 18 |  | shovel |
| goes_with | camping | Tent | 11 | 10 | 0 | 11 | 0 | 10 |  |  |
| goes_with | firefighters | Fire engine | 5 | 5 | 0 | 5 | 0 | 4 |  |  |
| goes_with | building_site | Building construction | 10 | 10 | 0 | 10 | 0 | 10 |  | shovel |
| goes_with | space | Rocket | 13 | 11 | 0 | 13 | 0 | 5 |  | meteor |
| goes_with | fair | Circus tent | 7 | 7 | 0 | 7 | 0 | 13 |  |  |
| goes_with | breakfast | Croissant | 14 | 14 | 9 | 5 | 0 | 25 |  |  |
| goes_with | christmas | Christmas tree | 7 | 7 | 0 | 7 | 0 | 15 |  |  |
| goes_with | fairy_tale | Castle | 14 | 14 | 0 | 14 | 0 | 15 |  | treasure chest |
| goes_with | sport | Trophy | 16 | 16 | 0 | 16 | 0 | 16 |  |  |
| goes_with | police | Police car | 5 | 5 | 0 | 5 | 0 | 5 |  |  |
| goes_with | shopping | Shopping cart | 4 | 4 | 0 | 4 | 0 | 109 | **GAP** |  |
| goes_with | halloween | Jack-o-lantern | 7 | 7 | 0 | 7 | 0 | 12 |  |  |
| moves | flies | Bird | 27 | 25 | 0 | 27 | 0 | 21 |  | monarch butterfly |
| moves | swims | Fish | 23 | 22 | 0 | 23 | 0 | 21 |  | orca |
| moves | wheels | Bicycle | 29 | 26 | 0 | 29 | 0 | 9 |  |  |
| moves | hops | Kangaroo | 4 | 4 | 0 | 4 | 0 | 20 | **GAP** |  |
| moves | crawls | Snake | 4 | 4 | 0 | 4 | 0 | 14 | **GAP** |  |
| temperature | hot | Fire | 11 | 11 | 0 | 11 | 0 | 17 |  |  |
| temperature | cold | Snowflake | 8 | 7 | 0 | 8 | 0 | 20 |  |  |
| size | big_animals | Elephant | 14 | 14 | 0 | 14 | 0 | 18 |  | orca |
| size | tiny_animals | Ant | 14 | 14 | 0 | 14 | 0 | 16 |  | monarch butterfly |
| feelings | happy | Grinning face | 8 | 8 | 0 | 8 | 0 | 0 |  |  |
| feelings | sad | Crying face | 8 | 8 | 0 | 8 | 0 | 0 |  |  |
| colour | red | Red heart | 49 | 49 | 0 | 0 | 49 | 56 |  |  |
| colour | orange | Orange heart | 17 | 17 | 0 | 0 | 17 | 67 |  |  |
| colour | yellow | Yellow heart | 20 | 19 | 0 | 0 | 20 | 67 |  |  |
| colour | green | Green heart | 36 | 35 | 0 | 0 | 36 | 36 |  |  |
| colour | blue | Blue heart | 51 | 50 | 0 | 0 | 51 | 65 |  |  |
| colour | purple | Purple heart | 9 | 9 | 0 | 0 | 9 | 27 |  |  |
| colour | pink | Pink heart | 15 | 14 | 0 | 0 | 15 | 23 |  |  |
| colour | brown | Brown heart | 63 | 62 | 0 | 0 | 63 | 69 |  |  |
| colour | white | White heart | 29 | 28 | 0 | 0 | 29 | 76 |  |  |
| colour | grey | Grey heart | 35 | 35 | 0 | 0 | 35 | 47 |  |  |
| colour | black | Black heart | 12 | 12 | 0 | 0 | 12 | 36 |  |  |
| shape | round | Red circle | 16 | 16 | 0 | 0 | 16 | 59 |  |  |
| shape | long | Pencil | 31 | 29 | 0 | 0 | 31 | 38 |  |  |

Group count by type: kind 29, goes with 22, colour 11, home 9, moves 5, and 2 each for shape, hot or cold, big or tiny, feelings: **84 groups**.

The colour and shape anchors (coloured hearts from "Smileys & Emotion", "Red circle" from "Symbols") are not cards, so they can never collide with a card.

**542 of 564 cards** belong to at least one group. The 22 without a group are: Aerial tramway, Baby, Bone, Bow and arrow, Child, Fireworks, Framed picture, Hourglass done, Lipstick, Mobile phone, Mouse trap, Nest with eggs, Ninja, Older person, Playground slide, Printer, Robot, Sparkler, Stopwatch, Television, Thread, Vertical traffic light. Several of them are `maybe` pictures that protect other groups.

The member list of every group is in the [appendix](#appendix-members-of-every-group) and in `data/category_counts.csv`.

---

## 5. The fairness rule

**Problem.** One picture fits many groups: "Red apple" is a member of *fruit* and *red*, and a `maybe` for *breakfast*, *kitchen*, *fairy tale* and *shopping*. "Duck" is a member of *birds*, *farm*, *pond*, *flies* and *swims*. If a level shows *farm* and *pond*, a child can put the duck on either pile, and the game would call one of them wrong.

**Rule (code: `count_levels.py`, function `safe_pools`).**

1. **One association type per level.** All groups in a level are colours, or all are habitats, and so on (source 7).
2. **No card fits two shown groups.** A picture may be dealt to group G only if it is a member of G **and** it is neither a member nor a `maybe` of any other group shown in the same level. The anchor picture obeys the same rule.
3. **Never show two confusable groups together**, even if safe cards exist:
   - neighbouring colours: red–orange, red–pink, red–brown, orange–yellow, orange–brown, yellow–brown, pink–purple, purple–blue, purple–black, white–grey, grey–black (source 8);
   - clothes–shoes, clothes–hats, sea–pond, forest–jungle, kitchen–breakfast, snow–christmas (their anchors look alike, or the child would have to split hairs; **unverified** judgement).
4. **At most one picture per thing** in a level (Red apple and Green apple never appear together).
5. A group can be shown only if it still has at least **n + 1 safe things** (n cards + 1 anchor).

Plain example from the data: in a *farm* + *pond* level, "Duck" and "Goose" are removed from both piles, and "Duck" also from the pond pile; the farm still has 11 safe animals and the pond 6.

Nested groups take care of themselves: every ball is a `maybe` for *toys*, so *balls* and *toys* can never be shown together (the balls pile would be empty).

**Tagging must be generous.** The rule is only as good as the tags: if "Duck" were missing from *swims*, a "flies vs swims" level could deal the duck to *flies* and the child would be right to put it on *swims*. That is why `maybe` lists are long (for example every food is a `maybe` for *kitchen*), and why colour `maybe`s are computed from every colour that covers 20 % or more of the picture.

Example levels dealt by the script (`uv run count_levels.py --examples 8 --seed 7`, full output in `data/level_report.txt`):

```
[moves, 3 groups, 4 cards each]
  flies   anchor='Bird'     cards=['Parachute', 'Rocket', 'Butterfly', 'Dove']
  swims   anchor='Fish'     cards=['Octopus', 'Blowfish', 'Seal', 'Beaver']
  wheels  anchor='Bicycle'  cards=['Person biking', 'Automobile', 'Roller skate', 'Bus']

[colour, 4 groups, 5 cards each]
  red     anchor='Red heart'    cards=['Toothbrush', 'Cherries', 'Womans boot', 'Red apple', 'Boxing glove']
  yellow  anchor='Yellow heart' cards=['Ticket', 'Trumpet', 'Cheese wedge', 'Baby chick', 'Taco']
  purple  anchor='Purple heart' cards=['Bed', 'Hyacinth', 'Eggplant', 'Gloves', 'Video game']
  grey    anchor='Grey heart'   cards=['Cow', 'Radio', 'Spoon', 'Wolf', 'Shopping cart']

[goes_with, 4 groups, 5 cards each]
  beach     anchor='Beach with umbrella' cards=['Sunglasses', 'Water wave', 'Person surfing', 'Crab', 'Ring buoy']
  doctor    anchor='Stethoscope'         cards=['Adhesive bandage', 'Hospital', 'Crutch', 'Ambulance', 'Syringe']
  space     anchor='Rocket'              cards=['Telescope', 'Globe showing americas', 'Satellite', 'Shooting star', 'Comet']
  halloween anchor='Jack-o-lantern'      cards=['Black cat', 'Broom', 'Ghost', 'Spider', 'Spider web']
```

---

## 6. How many fair levels, and how long they last

A **level setup** = one association type + a set of 2, 3 or 4 groups of that type that passes the rule above. The same setup can be dealt with different cards; "card deals" counts those (anchor included), as a power of ten.

| Type | Groups in type | Groups shown | Group combinations | Blocked (confusable) | Fair setups, 3 cards | Fair setups, 5 cards | Card deals, 3 cards (log10) |
|---|---:|---:|---:|---:|---:|---:|---:|
| kind | 29 | 2 | 406 | 2 | 347 | 229 | 9.1 |
| kind | 29 | 3 | 3,654 | 53 | 2,826 | 1,500 | 13.1 |
| kind | 29 | 4 | 23,751 | 676 | 16,379 | 6,936 | 17.0 |
| home | 9 | 2 | 36 | 2 | 24 | 16 | 8.2 |
| home | 9 | 3 | 84 | 14 | 33 | 8 | 11.6 |
| home | 9 | 4 | 126 | 41 | 18 | 2 | 14.4 |
| goes_with | 22 | 2 | 231 | 2 | 225 | 142 | 8.5 |
| goes_with | 22 | 3 | 1,540 | 40 | 1,413 | 657 | 12.3 |
| goes_with | 22 | 4 | 7,315 | 379 | 6,072 | 2,001 | 15.8 |
| moves | 5 | 2 | 10 | 0 | 7 | 3 | 9.6 |
| moves | 5 | 3 | 10 | 0 | 3 | 1 | 13.2 |
| moves | 5 | 4 | 5 | 0 | 0 | 0 | – |
| temperature | 2 | 2 | 1 | 0 | 1 | 1 | 5.3 |
| size | 2 | 2 | 1 | 0 | 1 | 1 | 7.2 |
| feelings | 2 | 2 | 1 | 0 | 1 | 1 | 4.9 |
| colour | 11 | 2 | 55 | 11 | 44 | 44 | 12.6 |
| colour | 11 | 3 | 165 | 85 | 80 | 80 | 17.8 |
| colour | 11 | 4 | 330 | 261 | 69 | 69 | 22.2 |
| shape | 2 | 2 | 1 | 0 | 1 | 1 | 8.8 |

**Totals.**

| Setups | 2 groups | 3 groups | 4 groups | All |
|---|---:|---:|---:|---:|
| 3 cards per group | 651 | 4,355 | 22,538 | **27,544** |
| 5 cards per group | 438 | 2,246 | 9,008 | **11,692** |

**Play time.** **Assumption:** one level takes 2 to 3 minutes. No source was checked for this.

| Which setups | Setups | Hours at 2 min | Hours at 3 min |
|---|---:|---:|---:|
| All fair setups, 3 cards | 27,544 | 918 | 1,377 |
| All fair setups, 5 cards | 11,692 | 390 | 585 |
| Gentle only: 2–3 groups, 3 cards | 5,006 | 167 | 250 |
| All types except "kind", 3 cards | 7,992 | 266 | 400 |

What these numbers do and do not say:

- They count **different group combinations**. Card deals per setup are huge (10^5 to 10^22), so the same card set practically never repeats.
- The real limit on variety is the **number of groups**, not cards: 84 groups appear again and again in different combinations. "kind" makes 19,552 of the 27,544 setups. A child will meet "fruit" many times (**unverified** how much repetition a 4–5-year-old enjoys).
- Small types run out fast: *moves* has 10 fair setups, *home* 75, *colour* 193. Filling the gaps in section 7 raises these most.

---

## 7. Gaps: pictures to generate

### 7.1 Groups with fewer than 5 cards

| Group | Cards now | Pictures to generate |
|---|---|---|
| fish | 4 (3 distinct: Fish, Tropical fish, Blowfish, Shark) | goldfish, clownfish, seahorse, swordfish, stingray, eel |
| dinosaurs | 3 (T-rex, Sauropod, Mammoth) | triceratops, stegosaurus, pterodactyl, ankylosaurus, velociraptor, dinosaur egg |
| furniture | 4 (Bed, Chair, Couch and lamp, Mirror) | table, wardrobe, bookshelf, desk, armchair, cot, stool, table lamp |
| polar | 3 (Penguin, Polar bear, Seal) | walrus, arctic fox, reindeer, snowy owl, husky, narwhal, igloo (Noto adds orca as a `maybe`) |
| shopping | 4 (Shopping cart, Shopping bags, Basket, Coin) | shop front, cash register, wallet, price tag, fruit crate at a market stall |
| hops | 4 (Kangaroo, Rabbit, Frog, Cricket) | grasshopper, flea, child jumping, pogo stick, trampoline, skipping rope |
| crawls | 4 (Snake, Worm, Snail, Bug/caterpillar) | slug, centipede, crawling baby, tortoise, inchworm |

### 7.2 Thin groups (5–7 cards; often too few for 5-card levels once other groups take their share)

| Group | Cards now | Pictures to generate |
|---|---:|---|
| hats | 5 | woolly hat, sun hat, party hat, chef's hat, cowboy hat, police cap |
| rain | 5 | rain boots, raincoat, puddle, umbrella with rain |
| desert | 5 | meerkat, fennec fox, tortoise, vulture, oasis |
| firefighters | 5 | fire hose, fire hydrant, fire station, fire alarm |
| police | 5 | police cap, police badge, police station, police dog, police motorbike |
| bread | 6 (5 distinct) | bread roll, breadsticks, toast, focaccia, sliced loaf |
| drinks | 6 | glass of water, glass of juice, milkshake, water bottle, mug of cocoa |
| boats | 6 | submarine, pirate ship, kayak, raft, rubber dinghy |
| aircraft | 6 (5 distinct) | hot-air balloon, glider, airship, jet plane, paper plane |
| trains | 7 (5 distinct) | freight wagon, toy train, steam train seen from the side, underground train |
| bedtime, party, fair, christmas, halloween, pond, pets | 7–8 | bedtime: pillow, pyjamas, slippers, night light, blanket. party: party hat, garland, party bag. pond: dragonfly, water lily leaf, tadpole, heron |
| purple (colour) | 9 | plum, purple crayon, purple balloon, lavender, purple t-shirt |

### 7.3 Whole groups that matter for this age but Fluent cannot build at all

The interest claims in this list are **unverified** (no source checked).

- **Building-site vehicles:** digger, crane, dump truck, cement mixer, bulldozer, road roller, forklift.
- **Mother and baby animals** (a new association type): calf, lamb, piglet, foal, kitten, puppy, duckling (chick exists).
- **Kitchen things:** whisk, rolling pin, saucepan, oven, fridge, kettle, mug, plate.
- **Bath time:** rubber duck, towel, shampoo bottle, potty, bath toys.
- **Beach:** sandcastle, beach ball, spade and bucket (Noto has "shovel"), beach towel, sun cream.
- **Garden tools:** watering can, wheelbarrow, rake, flower pot, garden gloves.
- **Playground:** swing, seesaw, sandpit (slide exists).

---

## 8. Noto 3D as a second source

Repository: <https://github.com/googlefonts/noto-emoji>, pinned at commit `99701e07d3d1fe1bdbcdb14964547f0fd592966f` (2026-10-26). The path `3D/png/512/` exists and holds **4,007** files named `emoji_u<codepoints>.png` (checked with `git ls-tree`; sizes 32, 72, 128 and 512 exist as sibling folders). Names and Emoji versions come from Unicode `emoji-test.txt` version 18.0 (<https://www.unicode.org/Public/18.0.0/emoji/emoji-test.txt>).

Join: Fluent `unicode` (space-separated) → lower-case, drop `fe0f`, pad to 4 hex digits, join with `_`.

| What | Count |
|---|---:|
| Fluent folders with a Noto 3D 512 px file | 1,595 of 1,595 |
| **Curated cards with a Noto 3D 512 px file** | **564 of 564** |
| Noto files with no Fluent folder | 2,412 |
| … skin-tone copies | 2,050 |
| … flags | 288 |
| … joined sequences (families, couples) | 37 |
| … single emoji | 37 |

Noto-only pictures that add to a group (all Emoji 16–18, listed in `data/noto_only.csv`):

| Noto picture | Emoji version | Member of | Also a `maybe` for |
|---|---|---|---|
| orca | 17.0 | sea, swims, big animals | fish, polar, beach, cold |
| monarch butterfly | 18.0 | bugs, garden, flies, tiny animals | gardening |
| leafless tree | 16.0 | trees and leaves | snow, forest, halloween |
| root vegetable | 16.0 | vegetables | gardening |
| pickle | 18.0 | – | vegetables, meals |
| lighthouse | 18.0 | beach, buildings | boats, sea |
| meteor | 18.0 | space | flies, hot |
| trombone | 17.0 | instruments | – |
| harp | 16.0 | instruments | fairy tale |
| treasure chest | 17.0 | fairy tale | beach, shopping |
| eraser | 18.0 | school | – |
| net with handle | 18.0 | – | garden, beach, camping, gardening |
| shovel | 16.0 | gardening, building site, beach | snow, tools |

The other Emoji 16–18 additions are faces, a "fight cloud", hand signs, a fingerprint, a splatter, a landslide, a "hairy creature", a ballet dancer and a flag; none was kept.

Two open points (**unverified**):

- **Style:** Noto 3D and Fluent 3D are drawn differently; mixing them in one level may look odd. Not checked by eye.
- **Licence:** the Noto README says "Emoji fonts (under the fonts subdirectory) are under the SIL Open Font License, version 1.1." and "Tools and most image resources are under the Apache license, version 2.0" (<https://github.com/googlefonts/noto-emoji/blob/99701e07d3d1fe1bdbcdb14964547f0fd592966f/README.md>). Whether the `3D/png` images fall under "most image resources" was not checked.

---

## 9. How to reproduce

Everything is in `research/content/`:

| File | What it does |
|---|---|
| `fetch_sources.sh` | Downloads the pinned Fluent assets (metadata + default 3D PNGs, about 60 MB), the Noto `3D/png/512` file list and `emoji-test.txt` into `/tmp/kids-solitaire-src` (set `SRC=` to change). |
| `curation.py` | Keep/drop rules with reason codes. |
| `tag_schema.py` | All groups, `maybe` lists, colour/shape corrections, confusable pairs, same-thing pairs, Noto-only pictures. |
| `colour.py` | Dominant colour and shape of a PNG (Pillow). |
| `build_content.py` | Counts, filter, colour analysis, tagging, Noto join. Writes `data/summary.json`, `catalog.json`, `categories.json`, `category_counts.csv`, `colours.csv`, `excluded.csv`, `noto_only.csv`. |
| `contact_sheets.py` | Eye-check images in `data/sheets/` (colour and shape groups by default; any group ids as arguments). Members on top, `maybe` pictures under the grey bar. |
| `count_levels.py` | The fairness rule, level counts (`data/level_counts.json`, `.csv`) and example levels. |

```sh
cd research/content
./fetch_sources.sh
uv run build_content.py      # prints the counts in sections 2-4 and 8
uv run contact_sheets.py     # optional
uv run count_levels.py --examples 8 --seed 7   # prints section 6 and example levels
```

`build_content.py` stops with an error if `tag_schema.py` names a picture that is not a kept card, so typos cannot silently shrink a group.

---

## Appendix: members of every group

**kind (taxonomic)**

- **fruit** (20): Avocado, Banana, Blueberries, Cherries, Coconut, Grapes, Green apple, Kiwi fruit, Lemon, Lime, Mango, Melon, Peach, Pear, Pineapple, Red apple, Strawberry, Tangerine, Tomato, Watermelon
- **vegetables** (16): Avocado, Bell pepper, Broccoli, Brown mushroom, Carrot, Cucumber, Ear of corn, Eggplant, Garlic, Green salad, Hot pepper, Leafy green, Onion, Pea pod, Potato, Tomato
- **sweets** (13): Birthday cake, Candy, Chocolate bar, Cookie, Cupcake, Custard, Doughnut, Honey pot, Ice cream, Lollipop, Pie, Shortcake, Soft ice cream
- **bread** (6): Bagel, Baguette bread, Bread, Croissant, Flatbread, Pretzel
- **meals** (15): Burrito, Cooked rice, Dumpling, French fries, Hamburger, Hot dog, Meat on bone, Pizza, Pot of food, Poultry leg, Sandwich, Spaghetti, Steaming bowl, Sushi, Taco
- **drinks** (6): Baby bottle, Beverage box, Cup with straw, Glass of milk, Hot beverage, Teapot
- **birds** (16): Baby chick, Bird, Blackbird, Chicken, Dove, Duck, Eagle, Flamingo, Goose, Owl, Parrot, Peacock, Penguin, Rooster, Swan, Turkey
- **bugs** (14): Ant, Beetle, Bug, Butterfly, Cockroach, Cricket, Fly, Honeybee, Lady beetle, Mosquito, Scorpion, Snail, Spider, Worm
- **fish** (4): Blowfish, Fish, Shark, Tropical fish
- **flowers** (10): Blossom, Bouquet, Cherry blossom, Hibiscus, Hyacinth, Lotus, Rose, Sunflower, Tulip, Wilted flower
- **trees_leaves** (10): Cactus, Deciduous tree, Evergreen tree, Fallen leaf, Four leaf clover, Herb, Maple leaf, Palm tree, Potted plant, Seedling
- **dinosaurs** (3): Mammoth, Sauropod, T-rex
- **cars_trucks** (14): Ambulance, Articulated lorry, Automobile, Bus, Delivery truck, Fire engine, Motor scooter, Motorcycle, Pickup truck, Police car, Racing car, Sport utility vehicle, Taxi, Tractor
- **boats** (6): Canoe, Ferry, Motor boat, Person rowing boat, Sailboat, Ship
- **aircraft** (6): Airplane, Flying saucer, Helicopter, Parachute, Rocket, Small airplane
- **trains** (7): Bullet train, Light rail, Locomotive, Mountain railway, Railway car, Train, Tram
- **instruments** (10): Accordion, Banjo, Drum, Flute, Guitar, Maracas, Musical keyboard, Saxophone, Trumpet, Violin
- **tools** (8): Axe, Carpentry saw, Hammer, Ladder, Nut and bolt, Screwdriver, Toolbox, Wrench
- **clothes** (16): Bikini, Briefs, Coat, Dress, Gloves, Jeans, Lab coat, Necktie, One-piece swimsuit, Running shirt, Safety vest, Scarf, Shorts, Socks, T-shirt, Womans clothes
- **shoes** (9): Ballet shoes, Flat shoe, High-heeled shoe, Hiking boot, Mans shoe, Running shoe, Thong sandal, Womans boot, Womans sandal
- **hats** (5): Billed cap, Crown, Rescue workers helmet, Top hat, Womans hat
- **balls** (9): American football, Baseball, Basketball, Bowling, Ping pong, Rugby football, Soccer ball, Tennis, Volleyball
- **toys** (11): Balloon, Boomerang, Flying disc, Game die, Kite, Nesting dolls, Puzzle piece, Teddy bear, Video game, Water pistol, Yo-yo
- **furniture** (4): Bed, Chair, Couch and lamp, Mirror
- **body** (10): Ear, Eye, Flexed biceps, Foot, Leg, Mouth, Nose, Raised hand, Tongue, Tooth
- **jobs** (14): Artist, Astronaut, Construction worker, Cook, Detective, Farmer, Firefighter, Health worker, Mechanic, Pilot, Police officer, Scientist, Singer, Teacher
- **fairy_tale_people** (8): Dragon, Person elf, Person fairy, Person mage, Person merpeople, Prince, Princess, Unicorn
- **weather** (9): Cloud, Cloud with lightning, Cloud with rain, Cloud with snow, Rainbow, Snowflake, Sun, Sun behind cloud, Tornado
- **buildings** (8): Building construction, Castle, Circus tent, Cityscape, Hospital, House, Hut, School

**home (habitat)**

- **farm** (13): Baby chick, Chicken, Cow, Donkey, Duck, Ewe, Goat, Goose, Horse, Pig, Rabbit, Rooster, Turkey
- **sea** (16): Blowfish, Coral, Crab, Dolphin, Fish, Jellyfish, Lobster, Octopus, Oyster, Seal, Shark, Shrimp, Spiral shell, Squid, Tropical fish, Whale
- **jungle** (16): Crocodile, Elephant, Giraffe, Gorilla, Hippopotamus, Leopard, Lion, Monkey, Orangutan, Panda, Parrot, Rhinoceros, Sloth, Snake, Tiger, Zebra
- **forest** (14): Badger, Bat, Bear, Boar, Chipmunk, Deer, Fox, Hedgehog, Moose, Mushroom, Owl, Raccoon, Skunk, Wolf
- **pond** (7): Beaver, Duck, Frog, Lotus, Otter, Swan, Turtle
- **polar** (3): Penguin, Polar bear, Seal
- **desert** (5): Cactus, Camel, Lizard, Scorpion, Snake
- **pets** (8): Black cat, Cat, Dog, Hamster, Mouse, Parrot, Rabbit, Turtle
- **garden** (15): Ant, Beetle, Blossom, Bug, Butterfly, Cricket, Honeybee, Hyacinth, Lady beetle, Rose, Snail, Spider, Sunflower, Tulip, Worm

**goes with (function / script)**

- **bath** (12): Bathtub, Bubbles, Lotion bottle, Person taking bath, Plunger, Razor, Roll of paper, Shower, Soap, Sponge, Toilet, Toothbrush
- **kitchen** (12): Bowl with spoon, Canned food, Chopsticks, Cook, Cooking, Fork and knife, Jar, Kitchen knife, Pot of food, Salt, Spoon, Teapot
- **bedtime** (7): Alarm clock, Bed, Candle, Crescent moon, Night with stars, Person in bed, Teddy bear
- **beach** (14): Beach with umbrella, Bikini, Bucket, Crab, Desert island, Diving mask, One-piece swimsuit, Person surfing, Person swimming, Ring buoy, Spiral shell, Sunglasses, Thong sandal, Water wave
- **party** (7): Balloon, Birthday cake, Cupcake, Party popper, Piñata, Ribbon, Wrapped gift
- **rain** (5): Cloud with lightning, Cloud with rain, Droplet, Rainbow, Umbrella
- **snow** (11): Cloud with snow, Gloves, Ice, Ice skate, Scarf, Skier, Skis, Sled, Snowboarder, Snowflake, Snowman
- **school** (18): Abacus, Artist palette, Backpack, Blue book, Books, Closed book, Crayon, Green book, Open book, Orange book, Paintbrush, Paperclip, Pen, Pencil, School, Scissors, Straight ruler, Teacher
- **doctor** (10): Adhesive bandage, Ambulance, Crutch, Health worker, Hospital, Manual wheelchair, Pill, Stethoscope, Syringe, Thermometer
- **gardening** (8): Blossom, Herb, Hyacinth, Potted plant, Rose, Seedling, Sunflower, Tulip
- **camping** (11): Axe, Backpack, Camping, Compass, Fire, Fishing pole, Flashlight, Hiking boot, Mountain, Tent, Wood
- **firefighters** (5): Fire, Fire engine, Fire extinguisher, Firefighter, Rescue workers helmet
- **building_site** (10): Brick, Building construction, Carpentry saw, Construction worker, Hammer, Ladder, Safety vest, Screwdriver, Toolbox, Wrench
- **space** (13): Alien, Astronaut, Comet, Crescent moon, Flying saucer, Full moon, Globe showing americas, Ringed planet, Rocket, Satellite, Shooting star, Star, Telescope
- **fair** (7): Carousel horse, Circus tent, Clown face, Ferris wheel, Popcorn, Roller coaster, Ticket
- **breakfast** (14): Bacon, Bagel, Bowl with spoon, Bread, Butter, Cooking, Croissant, Doughnut, Egg, Glass of milk, Honey pot, Hot beverage, Pancakes, Waffle
- **christmas** (7): Bell, Candle, Christmas tree, Santa claus, Snowman, Star, Wrapped gift
- **fairy_tale** (14): Castle, Crown, Crystal ball, Dragon, Gem stone, Magic wand, Person elf, Person fairy, Person mage, Person merpeople, Prince, Princess, Ring, Unicorn
- **sport** (16): American football, Badminton, Baseball, Basketball, Bowling, Boxing glove, Goal net, Person running, Ping pong, Rugby football, Running shirt, Soccer ball, Sports medal, Tennis, Trophy, Volleyball
- **police** (5): Detective, Locked, Magnifying glass tilted left, Police car, Police officer
- **shopping** (4): Basket, Coin, Shopping bags, Shopping cart
- **halloween** (7): Bat, Black cat, Broom, Ghost, Jack-o-lantern, Spider, Spider web

**moves (motion)**

- **flies** (27): Airplane, Balloon, Bat, Bird, Blackbird, Butterfly, Dove, Dragon, Duck, Eagle, Flamingo, Fly, Flying saucer, Goose, Helicopter, Honeybee, Kite, Lady beetle, Mosquito, Owl, Parachute, Parrot, Person fairy, Person superhero, Rocket, Small airplane, Swan
- **swims** (23): Beaver, Blowfish, Crocodile, Dolphin, Duck, Fish, Frog, Goose, Jellyfish, Lobster, Octopus, Otter, Penguin, Person merpeople, Person swimming, Seal, Shark, Shrimp, Squid, Swan, Tropical fish, Turtle, Whale
- **wheels** (29): Ambulance, Articulated lorry, Automobile, Bicycle, Bullet train, Bus, Delivery truck, Fire engine, Kick scooter, Light rail, Locomotive, Manual wheelchair, Motor scooter, Motorcycle, Mountain railway, Person biking, Pickup truck, Police car, Racing car, Railway car, Roller skate, Shopping cart, Skateboard, Sport utility vehicle, Taxi, Tractor, Train, Tram, Wheel
- **hops** (4): Cricket, Frog, Kangaroo, Rabbit
- **crawls** (4): Bug, Snail, Snake, Worm

**hot or cold**

- **hot** (11): Candle, Cooking, Desert, Fire, Hot beverage, Hot pepper, Pot of food, Steaming bowl, Sun, Teapot, Volcano
- **cold** (8): Cloud with snow, Ice, Ice cream, Penguin, Polar bear, Snowflake, Snowman, Soft ice cream

**big or tiny**

- **big_animals** (14): Bear, Bison, Camel, Elephant, Giraffe, Gorilla, Hippopotamus, Mammoth, Moose, Polar bear, Rhinoceros, Sauropod, T-rex, Whale
- **tiny_animals** (14): Ant, Beetle, Bug, Butterfly, Cockroach, Cricket, Fly, Honeybee, Lady beetle, Mosquito, Mouse, Snail, Spider, Worm

**feelings**

- **happy** (8): Beaming face with smiling eyes, Grinning face, Grinning face with big eyes, Grinning face with smiling eyes, Grinning squinting face, Slightly smiling face, Smiling face, Smiling face with smiling eyes
- **sad** (8): Crying face, Disappointed face, Frowning face, Loudly crying face, Pensive face, Slightly frowning face, Weary face, Worried face

**colour (computed)**

- **red** (49): Accordion, Axe, Backpack, Bacon, Balloon, Bird, Boxing glove, Cherries, Chopsticks, Closed book, Crab, Cut of meat, Diving mask, Fire engine, Fire extinguisher, Folding hand fan, French fries, Fuel pump, Goal net, High-heeled shoe, Hot pepper, Lobster, Magnet, Maple leaf, Motor scooter, Mushroom, Nesting dolls, Paintbrush, Pickup truck, Pill, Plunger, Postbox, Red apple, Rescue workers helmet, Ribbon, Rose, Safety vest, Scarf, Scissors, Screwdriver, Steaming bowl, Strawberry, Teapot, Telephone, Tomato, Toolbox, Toothbrush, Watermelon, Womans boot
- **orange** (17): Basketball, Boomerang, Brick, Coral, Fire, Fox, Mango, Megaphone, Orange book, Orangutan, Peach, Pencil, Pineapple, Ringed planet, Rugby football, Tangerine, Tiger
- **yellow** (20): Baby chick, Banana, Bell, Butter, Cheese wedge, Crescent moon, Ear of corn, Full moon, Key, Lemon, Light bulb, Pizza, Saxophone, Star, Sun, Sunflower, Taco, Taxi, Ticket, Trumpet
- **green** (36): Avocado, Battery, Beetle, Bell pepper, Beverage box, Broccoli, Cactus, Christmas tree, Cricket, Crocodile, Cucumber, Deciduous tree, Evergreen tree, Four leaf clover, Green apple, Green book, Herb, Kiwi fruit, Leafy green, Lime, Lizard, Melon, Olive, Palm tree, Pea pod, Peacock, Puzzle piece, Running shirt, Sauropod, Seedling, Shorts, Snake, T-rex, T-shirt, Tent, Water pistol
- **blue** (51): Adhesive bandage, Anchor, Badminton, Billed cap, Blue book, Bowl with spoon, Briefs, Bucket, Bus stop, Canoe, Cityscape, Cloud with lightning, Couch and lamp, Desktop computer, Dolphin, Dress, Droplet, Ferry, Fish, Flat shoe, Fly, Flying disc, Gem stone, Glasses, Globe showing americas, Goggles, Ice, Jar, Jeans, Jellyfish, Kick scooter, Laptop, Luggage, Magnifying glass tilted left, Mirror, Necktie, Pen, Razor, Shield, Shopping bags, Skis, Snowflake, Socks, Sport utility vehicle, Thong sandal, Tropical fish, Watch, Water wave, Whale, Window, Yarn
- **purple** (9): Bed, Eggplant, Gloves, Grapes, Hyacinth, Stethoscope, Umbrella, Video game, Yo-yo
- **pink** (15): Ballet shoes, Bikini, Cherry blossom, Flamingo, Hibiscus, Lotion bottle, Lotus, One-piece swimsuit, Pig, Ping pong, Soap, Squid, Tulip, Womans clothes, Worm
- **brown** (63): American football, Baguette bread, Basket, Bat, Beans, Bear, Beaver, Bison, Boar, Bread, Briefcase, Broom, Brown mushroom, Camel, Chair, Chestnut, Chipmunk, Chocolate bar, Coat, Cockroach, Coconut, Cookie, Croissant, Deer, Dog, Door, Doughnut, Eagle, Egg, Feather, Flute, Goat, Goose, Handbag, Hedgehog, Hiking boot, Honey pot, Horse, Hut, Kangaroo, Ladder, Mammoth, Mans shoe, Monkey, Moose, Onion, Otter, Owl, Package, Pancakes, Peanuts, Pie, Potato, Poultry leg, Pretzel, Scorpion, Sloth, Snail, Teddy bear, Turkey, Violin, Wheel, Wood
- **white** (29): Baby bottle, Baseball, Blossom, Chicken, Cloud, Cloud with rain, Cloud with snow, Computer mouse, Dove, Envelope, Ewe, Game die, Glass of milk, Lab coat, Llama, Newspaper, Open book, Polar bear, Rabbit, Rock, Roll of paper, Salt, Snowman, Sun behind cloud, Swan, Syringe, Toilet, Volleyball, Wrench
- **grey** (35): Bathtub, Camera, Carpentry saw, Cow, Crutch, Donkey, Elephant, Flashlight, Fork and knife, Fountain, Gorilla, Headphone, Hippopotamus, Hospital, Kitchen knife, Koala, Microphone, Microscope, Mouse, Nut and bolt, Paperclip, Raccoon, Radio, Rhinoceros, Seal, Shark, Shopping cart, Shower, Spider web, Spiral shell, Spoon, Straight ruler, Tornado, Wastebasket, Wolf
- **black** (12): Ant, Black cat, Blackbird, Crystal ball, Electric plug, Movie camera, Satellite, Skateboard, Skunk, Spider, Sunglasses, Top hat

**shape (computed)**

- **round** (16): Baseball, Basketball, Coconut, Coin, Cookie, Doughnut, Flatbread, Full moon, Globe showing americas, Jack-o-lantern, Kiwi fruit, Olive, Pie, Soccer ball, Sun, Volleyball
- **long** (31): Adhesive bandage, Axe, Boomerang, Broom, Bug, Candle, Carpentry saw, Crayon, Crutch, Cucumber, Flute, Guitar, Hammer, Key, Kitchen knife, Magic wand, Microphone, Paintbrush, Pen, Pencil, Plunger, Rocket, Screwdriver, Sewing needle, Skateboard, Spoon, Straight ruler, Syringe, Thermometer, Toothbrush, Wrench
