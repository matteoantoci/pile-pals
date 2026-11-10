"""Dominant colour and simple shape of the still picture that the game ships (Pillow only).

Colour, kept simple on purpose:
1. Shrink the picture to 96x96 and keep only pixels that are mostly opaque.
2. Name every pixel by hue, saturation and brightness (HSV): one of the 11
   COLOURS, or one of the NO_GROUP names for colours that a child has no clear
   word for. The thresholds were tuned by eye on contact sheets of the Noto 2D
   stills (see colour_name); they are a starting point, not ground truth.
3. The main colour is the name with the most pixels. The picture is "clearly
   one colour" if the main colour is one of COLOURS and covers at least
   CLEAR_SHARE of it, or covers at least CLEAR_SHARE_LOW and, together with its
   NEIGHBOURS (colours that shading blends into it, for example orange into
   yellow), at least CLEAR_FAMILY_SHARE.
4. Any other colour of COLOURS that covers at least ALSO_SHARE is a second
   colour. The level rule treats a second colour as "this card could also go there".

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
# Pixel names that never make a colour group. A picture with one of them as
# its main colour has no clear colour, so a colour level never deals it.
# pale:  light pastel tints (the peach pig, the cream banana flesh, lavender).
# steel: the blue-grey that Noto uses for metal and glass (wrench, jar, rhino).
NO_GROUP = ("pale", "steel")

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
    """Name one pixel. Noto 2D draws red with an orange hue (the red apple is
    #ff5116, hue 15), metal and glass in a light blue-grey, and baked food and
    light wood in a golden brown, so the borders differ from textbook HSV wheels."""
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h *= 360
    if v < 0.22 or (v < 0.45 and s < 0.45):
        return "black"
    if s < 0.15:
        return "white" if v >= 0.85 else "grey"
    if s < 0.35 and v >= 0.85:
        return "pale"
    if h >= 340 or h < 20:  # reds, pinks, and red-browns
        # Noto draws a red as a bright, strong orange-red (the red apple is #ff5116,
        # hue 15) and wood brown as the same hue but darker (the violin is #b34f2b).
        if s >= 0.70 and v >= 0.85:
            return "red"
        if (h >= 340 or h < 5) and s >= 0.55 and v >= 0.55:
            return "red"
        return "pink" if (h >= 340 or h < 8) and s >= 0.35 and v >= 0.75 else "brown"
    if h < 40:  # orange, or brown when dark or golden
        return "orange" if (s >= 0.66 and v >= 0.92) else "brown"
    if h < 60:  # yellow, or brown/olive when dull
        return "yellow" if (s >= 0.45 and v >= 0.75) else "brown"
    if h < 165:
        return "green"
    if h < 250:
        return "blue" if s >= 0.45 else "steel"
    if h < 320:
        return "purple"
    return "pink"


def analyse(png_path: str) -> dict:
    from PIL import Image  # only analyse() needs Pillow; count_levels.py imports NEIGHBOURS without it

    img = Image.open(png_path).convert("RGBA").resize((96, 96), Image.Resampling.BOX)
    w, h = img.size
    px = img.load()
    counts = dict.fromkeys(COLOURS + NO_GROUP, 0)
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
    family = shares[main] + sum(shares.get(c, 0) for c in NEIGHBOURS.get(main, ()))
    clear = main in COLOURS and (
        shares[main] >= CLEAR_SHARE or (shares[main] >= CLEAR_SHARE_LOW and family >= CLEAR_FAMILY_SHARE))
    also = sorted(c for c, s in shares.items() if c != main and c in COLOURS and s >= ALSO_SHARE)

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
