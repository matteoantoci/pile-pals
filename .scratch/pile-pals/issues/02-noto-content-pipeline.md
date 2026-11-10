# 02: Noto content pipeline

Spec: [spec.md](../spec.md)

**What to build:** The fixed level shows real Noto 2D cards instead of placeholders. The content pipeline makes one catalog and the optimised picture and animation files from the Noto sources.

**Blocked by:** 01 (Tracer bullet: one level on the iPhone)

**Status:** ready-for-agent

- [ ] The pipeline uses Noto 2D pictures for all cards. The Fluent pictures are not used.
- [ ] For each card with a Noto animated twin, the pipeline reads the Lottie `rest` marker and encodes the loop again so that it starts at the rest frame. The still picture of that card is the rest frame.
- [ ] Colour tags are computed again from the still picture that the game ships.
- [ ] The catalog records each card's groups, `maybe` tags, colour, and animated twin. It also gives P, the number of pals with an animation.
- [ ] The pipeline chooses AVIF or WebP for the animations from a size measurement. The total offline download size is recorded in this ticket.
- [ ] The old default path `/tmp/kids-solitaire-src` is renamed.
- [ ] The fixed level from ticket 01 shows Noto cards from the catalog.
