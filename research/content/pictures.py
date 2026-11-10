"""Still pictures and animation loops for the game (Pillow and rlottie-python).

Sources:
- Noto 2D: one 512 px PNG for each emoji (Apache 2.0).
- Noto Animated: one Lottie file for each animated emoji (CC BY 4.0).

Still picture of a card:
- a card with an animated twin: the rest frame of the Lottie file, so that the
  swap from the still to the animation shows no jump;
- each other card: the Noto 2D PNG.
The still is STILL_SIZE px square, lossy WebP.

Animation of a card: the Lottie loop, rendered at ANIM_SIZE px and ANIM_FPS.
Animated AVIF and WebP always start at frame 0, so the loop starts at the rest
frame. Frame `op` is the same picture as frame `ip`, so the loop uses frames
ip to op - 1.

The rest frame:
1. The frame of the marker "rest" (no case: 6 files spell it "Rest").
2. A file with no rest marker (12 files, all with `ip` 0): frame `ip`. But in
   some of these files frame `ip` is empty (Dolphin, Running shoe) or shows a
   different pose (Pizza with a bite, Fuel pump). So if one frame is clearly
   more like the Noto 2D picture (REST_CHECK_RATIO), that frame is the rest frame.

Sizes, from the card in src/ui/styles.css on an iPhone 12 (390 x 844 CSS px, 3x):
the picture on a card is 80 CSS px = 240 device px, and the lift grows the card
a little. 256 px covers both. The animation plays on the same card, so it has the
same size as the still and the swap shows no change in sharpness.
"""

import json
from pathlib import Path

STILL_SIZE = 256
ANIM_SIZE = 256
ANIM_FPS = 30
STILL_WEBP = dict(quality=90, method=4)  # method 6 with a lossless alpha takes 50 times longer for 3 % less
ANIM_ENCODE = {
    "avif": dict(quality=50, speed=6),
    "webp": dict(quality=70, method=4),
}
REST_CHECK_SIZE = 128
REST_CHECK_RATIO = 1.5
HERE = Path(__file__).resolve()


def up_to_date(out: Path, *sources: Path) -> bool:
    """True if `out` is newer than each source and than this file (the settings)."""
    if not out.exists():
        return False
    newest = max(p.stat().st_mtime for p in (*sources, HERE))
    return out.stat().st_mtime >= newest


def noto_still(noto_png: Path, size: int):
    from PIL import Image

    return Image.open(noto_png).convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)


def rest_frame(lottie: Path, noto_png: Path) -> int:
    """The rest frame of a Lottie file (see the module text). Frame numbers are relative to `ip`, as in rlottie."""
    from PIL import ImageChops, ImageStat
    from rlottie_python import LottieAnimation

    data = json.loads(lottie.read_text())
    marker = next((m["tm"] for m in data.get("markers", []) if m["cm"].lower() == "rest"), None)
    if marker is not None:
        return int(marker - data["ip"])
    anim = LottieAnimation.from_file(str(lottie))
    ref = noto_still(noto_png, REST_CHECK_SIZE)
    diffs = []
    for i in range(int(data["op"] - data["ip"])):
        frame = anim.render_pillow_frame(frame_num=i, width=REST_CHECK_SIZE, height=REST_CHECK_SIZE)
        diffs.append(sum(ImageStat.Stat(ImageChops.difference(frame, ref)).mean) / 4)
    best = min(range(len(diffs)), key=diffs.__getitem__)
    return 0 if diffs[0] <= REST_CHECK_RATIO * diffs[best] else best


def loop_order(lottie: Path, rest: int) -> tuple[list[int], int]:
    """Frame order of the loop from the rest frame, and the milliseconds for each frame."""
    data = json.loads(lottie.read_text())
    length = int(data["op"] - data["ip"])
    step = max(1, round(data["fr"] / ANIM_FPS))
    return [(rest + i) % length for i in range(0, length, step)], round(1000 * step / data["fr"])


def make_still(noto_png: Path, lottie: Path | None, out: Path) -> int | None:
    """Write the still picture of one card. Returns the rest frame, or None for a Noto 2D still."""
    rest = rest_frame(lottie, noto_png) if lottie else None
    if up_to_date(out, lottie or noto_png, noto_png):
        return rest
    if lottie:
        from rlottie_python import LottieAnimation

        anim = LottieAnimation.from_file(str(lottie))
        img = anim.render_pillow_frame(frame_num=rest, width=STILL_SIZE, height=STILL_SIZE)
    else:
        img = noto_still(noto_png, STILL_SIZE)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "WEBP", **STILL_WEBP)
    return rest


def make_animation(lottie: Path, rest: int, out_stem: Path) -> dict[str, int]:
    """Write the loop of one card in each format of ANIM_ENCODE. Returns the size of each file in bytes."""
    outs = {fmt: out_stem.with_suffix(f".{fmt}") for fmt in ANIM_ENCODE}
    if not all(up_to_date(p, lottie) for p in outs.values()):
        from rlottie_python import LottieAnimation

        order, ms = loop_order(lottie, rest)
        anim = LottieAnimation.from_file(str(lottie))
        frames = [anim.render_pillow_frame(frame_num=f, width=ANIM_SIZE, height=ANIM_SIZE) for f in order]
        out_stem.parent.mkdir(parents=True, exist_ok=True)
        for fmt, path in outs.items():
            frames[0].save(path, fmt.upper(), save_all=True, append_images=frames[1:], duration=ms, loop=0,
                           **ANIM_ENCODE[fmt])
    return {fmt: path.stat().st_size for fmt, path in outs.items()}
