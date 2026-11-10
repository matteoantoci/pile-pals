"""Dominant colour and simple shape of a Fluent 3D PNG (Pillow only).

Colour, kept simple on purpose:
1. Shrink the picture to 96x96 and keep only pixels that are mostly opaque.
2. Name every pixel with one of 11 colour names by hue, saturation and
   brightness (HSV). The thresholds were tuned by eye on contact sheets of the
   Fluent 3D set; they are a starting point, not ground truth.
3. The main colour is the name with the most pixels. The picture is "clearly
   one colour" if the main colour covers at least CLEAR_SHARE of it, or covers
   at least CLEAR_SHARE_LOW and, together with its NEIGHBOURS (colours that 3D
   shading blends into it, for example orange into yellow), at least
   CLEAR_FAMILY_SHARE.
4. Any other colour that covers at least ALSO_SHARE is a second colour. The
   level rule treats a second colour as "this card could also go there".

Shape: from the opaque mask.
- fill = opaque area / area of the circle that holds the shape.
- elongation = sqrt(largest / smallest spread of the mask), from the 2x2
  covariance of pixel positions, so it works for diagonal pictures too.
Round: fill >= ROUND_FILL and elongation <= ROUND_MAX_ELONGATION.
Long:  elongation >= LONG_MIN_ELONGATION.
"""

import colorsys
import math

COLOURS = ("red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "white", "grey", "black")

# Colours that sit next to each other. Used twice: (a) shading blends them, so
# they count together when deciding if a picture is clearly one colour;
# (b) children's colour words are broad at these borders (Wagner et al. 2013),
# so two neighbours are never shown as groups in the same level.
NEIGHBOURS = {
    "red": {"orange", "pink", "brown"},
    "orange": {"red", "yellow", "brown"},
    "yellow": {"orange", "brown"},
    "green": set(),
    "blue": {"purple"},
    "purple": {"pink", "blue", "black"},
    "pink": {"red", "purple"},
    "brown": {"red", "orange", "yellow"},
    "white": {"grey"},
    "grey": {"white", "black"},
    "black": {"grey", "purple"},
}

CLEAR_SHARE = 0.50
CLEAR_SHARE_LOW = 0.35
CLEAR_FAMILY_SHARE = 0.70
ALSO_SHARE = 0.20
ROUND_FILL = 0.80
ROUND_MAX_ELONGATION = 1.15
LONG_MIN_ELONGATION = 2.4


def colour_name(r: int, g: int, b: int) -> str:
    """Name one pixel. Fluent 3D reds lean to magenta (hue ~340) and its browns
    are light, dull oranges, so the borders differ from textbook HSV wheels."""
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h *= 360
    if v < 0.22 or (v < 0.40 and s < 0.45):
        return "black"
    if s < 0.22:
        return "white" if v >= 0.82 else "grey"
    if h >= 325 or h < 12:  # reds and pinks
        if s >= 0.62:
            return "red" if v >= 0.45 else "brown"
        return "pink" if v >= 0.75 else "brown"
    if h < 36:  # orange, or brown when dull or dark
        return "orange" if (s >= 0.58 and v >= 0.80) else "brown"
    if h < 68:  # yellow, or brown/olive when dull or dark
        return "yellow" if (s >= 0.45 and v >= 0.75) else "brown"
    if h < 165:
        return "green"
    if h < 250:
        return "blue"
    if h < 300 and s < 0.48 and v < 0.60:  # Fluent draws black things as dark slate purple
        return "black"
    if h < 290:
        return "purple"
    return "pink" if v >= 0.60 else "purple"


def analyse(png_path: str) -> dict:
    from PIL import Image  # only analyse() needs Pillow; count_levels.py imports NEIGHBOURS without it

    img = Image.open(png_path).convert("RGBA").resize((96, 96), Image.Resampling.BOX)
    w, h = img.size
    px = img.load()
    counts = dict.fromkeys(COLOURS, 0)
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 160:
                continue
            counts[colour_name(r, g, b)] += 1
            xs.append(x)
            ys.append(y)
    area = len(xs)
    shares = {c: n / area for c, n in counts.items() if n}
    main = max(shares, key=shares.get)
    family = shares[main] + sum(shares.get(c, 0) for c in NEIGHBOURS[main])
    clear = shares[main] >= CLEAR_SHARE or (shares[main] >= CLEAR_SHARE_LOW and family >= CLEAR_FAMILY_SHARE)
    also = sorted(c for c, s in shares.items() if c != main and s >= ALSO_SHARE)

    cx, cy = sum(xs) / area, sum(ys) / area
    radius = max(math.hypot(x - cx, y - cy) for x, y in zip(xs, ys)) + 0.5
    fill = area / (math.pi * radius * radius)
    sxx = sum((x - cx) ** 2 for x in xs) / area
    syy = sum((y - cy) ** 2 for y in ys) / area
    sxy = sum((x - cx) * (y - cy) for x, y in zip(xs, ys)) / area
    half_trace, det = (sxx + syy) / 2, sxx * syy - sxy * sxy
    root = math.sqrt(max(half_trace * half_trace - det, 0.0))
    big, small = half_trace + root, max(half_trace - root, 1e-9)
    elongation = math.sqrt(big / small)
    return {
        "main_colour": main,
        "main_share": round(shares[main], 3),
        "clear_colour": clear,
        "also_colours": also,
        "shares": {c: round(s, 3) for c, s in sorted(shares.items(), key=lambda kv: -kv[1])},
        "fill": round(fill, 3),
        "elongation": round(elongation, 2),
        "round": fill >= ROUND_FILL and elongation <= ROUND_MAX_ELONGATION,
        "long": elongation >= LONG_MIN_ELONGATION,
    }
