# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow"]
# ///
"""Contact sheets for checking computed groups by eye.

    uv run contact_sheets.py            # colour and shape groups
    uv run contact_sheets.py fruit sea  # any category ids

Reads data/categories.json and data/catalog.json (run build_content.py first).
Writes data/sheets/<category>.png: members first, then a grey bar, then the
"maybe" pictures (pictures that also count as fitting this group).
"""

import json
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
SRC = Path(os.environ.get("SRC", "/tmp/kids-solitaire-src")) / "fluentui-emoji" / "assets"
TILE, COLS = 72, 12


def sheet(cat: dict, png_of: dict) -> Image.Image:
    rows = [cat["members"], cat["maybe"]]
    n_rows = sum((len(r) + COLS - 1) // COLS for r in rows) or 1
    img = Image.new("RGB", (COLS * TILE, n_rows * (TILE + 12) + 8), "white")
    draw = ImageDraw.Draw(img)
    y = 0
    for i, names in enumerate(rows):
        if i == 1:
            draw.rectangle([0, y, COLS * TILE, y + 6], fill="#999999")
            y += 8
        for j, name in enumerate(names):
            x = (j % COLS) * TILE
            yy = y + (j // COLS) * (TILE + 12)
            pic = Image.open(SRC / png_of[name]).convert("RGBA").resize((TILE - 8, TILE - 8))
            img.paste(pic, (x + 4, yy + 2), pic)
            draw.text((x + 2, yy + TILE - 4), name[:12], fill="black")
        y += ((len(names) + COLS - 1) // COLS) * (TILE + 12)
    return img


def main() -> None:
    cats = {c["id"]: c for c in json.loads((DATA / "categories.json").read_text())}
    png_of = {c["name"]: c["png"] for c in json.loads((DATA / "catalog.json").read_text())}
    wanted = sys.argv[1:] or [i for i, c in cats.items() if c["type"] in ("colour", "shape")]
    (DATA / "sheets").mkdir(exist_ok=True)
    for cid in wanted:
        sheet(cats[cid], png_of).save(DATA / "sheets" / f"{cid}.png", optimize=True)
        print(f"data/sheets/{cid}.png")


if __name__ == "__main__":
    main()
