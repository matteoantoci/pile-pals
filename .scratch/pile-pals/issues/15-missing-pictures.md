# 15: Missing pictures

Spec: [spec.md](../spec.md)

**What to build:** The 10 things that have no emoji get a picture in the Noto 2D style, so the thin groups have enough cards.

**Blocked by:** 02 (Noto content pipeline)

**Status:** wontfix

Reason (2026-11-10): the 10 things came from a list of things that are not in Unicode 18.0, not from group counts. Their groups already have enough cards: bath 12, building site 10, clothes 16. Only seahorse helps a thin group (fish). Version 1 uses the 542 tagged cards with no generated pictures.

- [ ] Make towel, rubber duck, starfish, seahorse, excavator, crane, dump truck, sweater, pyjamas, and pacifier with `grok-imagine-image-2.0` edits and 3 Noto 2D reference pictures.
- [ ] Remove the background with rembg and BiRefNet.
- [ ] The Parent approves each picture before it goes into the catalog.
- [ ] The catalog includes the new cards, with tags and colour. They have no animation.
- [ ] The credits list records the source of these pictures.
