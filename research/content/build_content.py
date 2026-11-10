# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=13", "rlottie-python>=1.3.8"]
# ///
"""Build the card catalogue, the game pictures, and the per-category counts.

    ./fetch_sources.sh            # once; downloads into ~/.cache/pile-pals-impl/sources
    uv run build_content.py       # writes the game content and data/, and prints the numbers

Inputs (from fetch_sources.sh, in $SRC): Fluent Emoji metadata (names, keywords,
groups), Noto 2D 512 px PNGs, Noto Animated Lottie files and api.json, and
Unicode emoji-test.txt 18.0. No Fluent picture is used.

Game outputs (the Vite build serves them, the service worker precaches them):
  src/model/catalog.json     the catalog that the game model imports
  public/pictures/<id>.webp  the still picture of each card and anchor
  public/animations/<id>.*   the animation loop of each pal (AVIF or WebP, see below)
Research outputs in data/: summary.json, catalog.json, excluded.csv, colours.csv,
categories.json, category_counts.csv, noto_only.csv, animation_sizes.csv.
Work files (all stills, both animation formats) go to .build/ (not in git).

The game ships only the cards with at least one group (a card with no group
never comes into a level). A pal is a shipped card with an animated twin.
P = the number of pals. The sticker book holds 2P stickers.

Format of the animations: the pipeline encodes each pal as AVIF and as WebP,
writes the sizes to data/animation_sizes.csv, and ships the format with the
smaller total. If the shipped pictures and animations are more than
CONTENT_LIMIT bytes, the script stops and prints the largest files.
"""

import argparse
import csv
import json
import os
import re
import shutil
import sys
import unicodedata
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
sys.path.insert(0, str(HERE))

import colour  # noqa: E402
import curation  # noqa: E402
import pictures  # noqa: E402
import tag_schema as ts  # noqa: E402

DEFAULT_SRC = Path.home() / ".cache" / "pile-pals-impl" / "sources"
SKIN_TONES = {"1f3fb", "1f3fc", "1f3fd", "1f3fe", "1f3ff"}
GAP_BELOW = 5  # a category with fewer members than this is a gap
CONTENT_LIMIT = 150 * 1000 * 1000  # the offline size limit of the spec, in bytes
GAME_CATALOG = REPO / "src" / "model" / "catalog.json"
PUBLIC = REPO / "public"
STILLS, ANIMATIONS = "pictures", "animations"
WORK = HERE / ".build"


def noto_file(codepoints: list[str]) -> str:
    """Noto file name for a codepoint sequence: underscores, no fe0f, 4+ hex digits."""
    parts = [c.lower().zfill(4) for c in codepoints if c.lower() != "fe0f"]
    return "emoji_u" + "_".join(parts) + ".png"


def card_id(name: str) -> str:
    """Catalog id of a picture: the Fluent name in lower case ASCII, with '-' between the words."""
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-")


def load_emoji_test(path: Path) -> dict[str, dict]:
    """Map Noto file name -> {name, version, group} for fully-qualified emoji."""
    out, group = {}, None
    line_re = re.compile(r"^([0-9A-F ]+?)\s*;\s*fully-qualified\s*#\s*\S+\s+E(\d+\.\d+)\s+(.*)$")
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("# group:"):
            group = line.split(":", 1)[1].strip()
            continue
        m = line_re.match(line.strip())
        if m:
            out[noto_file(m.group(1).split())] = {"name": m.group(3), "version": float(m.group(2)), "group": group}
    return out


def write_csv(path: Path, header: list[str], rows) -> None:
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def make_stills(names, noto_png, lottie, workers) -> dict[str, dict]:
    """Write the still picture of each name into WORK. Returns {name: {rest_frame, path}}."""
    paths = {n: WORK / STILLS / f"{card_id(n)}.webp" for n in names}
    with ProcessPoolExecutor(workers) as pool:
        jobs = {n: pool.submit(pictures.make_still, noto_png[n], lottie.get(n), paths[n]) for n in names}
        return {n: {"rest_frame": job.result(), "path": paths[n]} for n, job in jobs.items()}


def make_animations(names, lottie, stills, workers) -> dict[str, dict[str, int]]:
    """Write each animation in each format into WORK. Returns {name: {format: bytes}}."""
    with ProcessPoolExecutor(workers) as pool:
        jobs = {n: pool.submit(pictures.make_animation, lottie[n], stills[n]["rest_frame"],
                               WORK / ANIMATIONS / card_id(n)) for n in names}
        return {n: job.result() for n, job in jobs.items()}


def build_categories(kept, meta, look, final_colour, shape) -> list[dict]:
    kept_set = set(kept)
    unknown = []
    for c in ts.CATEGORIES:
        for key in ("add", "remove", "maybe"):
            unknown += [(c["id"], key, n) for n in c.get(key, []) if n not in kept_set]
    if unknown:
        sys.exit(f"names in tag_schema.py that are not kept cards: {unknown}")

    kw_lower = {n: {k.lower() for k in meta[n]["keywords"]} for n in kept}
    categories = []
    for c in ts.CATEGORIES:
        kw_hits = {n for n in kept if kw_lower[n] & c.get("kw", set())} - set(c.get("remove", []))
        members = kw_hits | set(c.get("add", []))
        maybe = set(c.get("maybe", []))
        for g in c.get("maybe_groups", []):
            maybe |= {n for n in kept if meta[n]["group"] == g}
        categories.append(dict(
            id=c["id"], type=c["type"], anchor=c["anchor"],
            members=sorted(members), maybe=sorted(maybe - members),
            from_keywords=len(kw_hits), by_hand=len(members - kw_hits), computed=0,
        ))
    for col in colour.COLOURS:
        members = {n for n in kept if final_colour[n] == col}
        maybe = {n for n in kept
                 if col in look[n]["also_colours"] or (look[n]["main_colour"] == col and n not in members)}
        categories.append(dict(id=col, type="colour", anchor=ts.COLOUR_ANCHORS[col],
                               members=sorted(members), maybe=sorted(maybe - members),
                               from_keywords=0, by_hand=0, computed=len(members)))
    near = {
        "round": lambda a: a["fill"] >= 0.70 and a["elongation"] <= 1.35,
        "long": lambda a: a["elongation"] >= 1.9,
    }
    for s in ("round", "long"):
        members = {n for n in kept if shape[s][n]}
        maybe = {n for n in kept if near[s](look[n])}
        categories.append(dict(id=s, type="shape", anchor=ts.SHAPE_ANCHORS[s],
                               members=sorted(members), maybe=sorted(maybe - members),
                               from_keywords=0, by_hand=0, computed=len(members)))
    return categories


def confusable_with(categories) -> dict[str, list[str]]:
    """Group id -> the group ids that a level never shows next to it."""
    pairs = set(ts.CONFUSABLE) | {frozenset({a, b}) for a, ns in colour.NEIGHBOURS.items() for b in ns}
    ids = {c["id"] for c in categories}
    for pair in pairs:
        if not pair <= ids:
            sys.exit(f"confusable pair with an unknown group: {sorted(pair)}")
    return {c["id"]: sorted(next(iter(p - {c["id"]})) for p in pairs if c["id"] in p) for c in categories}


def ship(names, stills, animations, fmt) -> tuple[dict[str, str], dict[str, str]]:
    """Copy the shipped files into public/ and delete the old ones. Returns the paths in the catalog."""
    still_of = {n: f"{STILLS}/{card_id(n)}.webp" for n in names}
    anim_of = {n: f"{ANIMATIONS}/{card_id(n)}.{fmt}" for n in animations}
    wanted = set(still_of.values()) | set(anim_of.values())
    for folder in (STILLS, ANIMATIONS):
        (PUBLIC / folder).mkdir(parents=True, exist_ok=True)
        for old in (PUBLIC / folder).iterdir():
            if f"{folder}/{old.name}" not in wanted and old.name != "LICENSE.txt":
                old.unlink()
    for n, rel in still_of.items():
        shutil.copy2(stills[n]["path"], PUBLIC / rel)
    for n, rel in anim_of.items():
        shutil.copy2((WORK / ANIMATIONS / card_id(n)).with_suffix(f".{fmt}"), PUBLIC / rel)
    return still_of, anim_of


def write_licences(src: Path) -> None:
    apache = (src / "noto-emoji" / "2D" / "svg" / "LICENSE").read_text()
    (PUBLIC / STILLS / "LICENSE.txt").write_text(
        "Pictures: Noto Emoji 2D by Google, Apache License 2.0,\n"
        "https://github.com/googlefonts/noto-emoji (2D/png/512, commit in REVISION of the source).\n"
        "Changes: made smaller (256 px) and saved as WebP.\n"
        "The pictures of the cards with an animation are the rest frame of Noto Emoji Animation\n"
        "by Google, CC BY 4.0, https://googlefonts.github.io/noto-emoji-animation/.\n\n" + apache)
    (PUBLIC / ANIMATIONS / "LICENSE.txt").write_text(
        "Animations: Noto Emoji Animation by Google, CC BY 4.0,\n"
        "https://googlefonts.github.io/noto-emoji-animation/\n"
        "https://creativecommons.org/licenses/by/4.0/\n"
        "Changes: each loop starts at the frame with the marker 'rest', made smaller (256 px),\n"
        "30 frames per second, saved as animated AVIF or WebP.\n")


def check_size(files: list[Path]) -> int:
    total = sum(p.stat().st_size for p in files)
    if total > CONTENT_LIMIT:
        largest = sorted(files, key=lambda p: -p.stat().st_size)[:20]
        sys.exit(f"content is {total} bytes, more than {CONTENT_LIMIT}. Largest files:\n"
                 + "\n".join(f"{p.stat().st_size:9d} {p.relative_to(REPO)}" for p in largest))
    return total


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=os.environ.get("SRC", str(DEFAULT_SRC)))
    ap.add_argument("--out", default=str(HERE / "data"))
    ap.add_argument("--workers", type=int, default=os.cpu_count())
    args = ap.parse_args()
    src, out = Path(args.src), Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    assets = src / "fluentui-emoji" / "assets"
    noto_dir = src / "noto-emoji" / "2D" / "png" / "512"
    lottie_dir = src / "noto-animated" / "lottie"

    # ---------------------------------------------------------------- 1. Fluent metadata
    meta = {}
    for folder in sorted(p for p in assets.iterdir() if p.is_dir()):
        meta[folder.name] = json.loads((folder / "metadata.json").read_text(encoding="utf-8"))
    field_counts = Counter(k for m in meta.values() for k in m)
    summary = {
        "fluent_emoji_folders": len(meta),
        "folders_with_skin_tones": sum(1 for m in meta.values() if "unicodeSkintones" in m),
        "metadata_fields": dict(field_counts.most_common()),
        "fluent_groups": dict(Counter(m["group"] for m in meta.values()).most_common()),
    }

    # ---------------------------------------------------------------- 2. filter
    reasons = {n: curation.drop_reason(n, m["group"]) for n, m in meta.items()}
    kept = [n for n in meta if reasons[n] is None]
    summary["kept_cards"] = len(kept)
    summary["dropped_by_reason"] = dict(Counter(r for r in reasons.values() if r).most_common())
    summary["kept_by_group"] = dict(Counter(meta[n]["group"] for n in kept).most_common())
    write_csv(out / "excluded.csv", ["name", "group", "reason"],
              ([n, meta[n]["group"], reasons[n]] for n in meta if reasons[n]))

    # ---------------------------------------------------------------- 3. Noto join
    # An anchor is the suggested picture of a category card. Some anchors are not cards (the hearts).
    anchors = sorted({c["anchor"] for c in ts.CATEGORIES} | set(ts.COLOUR_ANCHORS.values())
                     | set(ts.SHAPE_ANCHORS.values()))
    extra = [a for a in anchors if a not in set(kept)]
    if any(a not in meta for a in extra):
        sys.exit(f"anchors with no Fluent metadata: {[a for a in extra if a not in meta]}")
    noto_png = {n: noto_dir / noto_file(meta[n]["unicode"].split()) for n in kept + extra}
    missing = [n for n, p in noto_png.items() if not p.exists()]
    if missing:
        sys.exit(f"pictures with no Noto 2D PNG: {missing}")
    animated = {i["codepoint"] for i in json.loads((src / "noto-animated" / "api.json").read_text())["icons"]}
    lottie = {}
    for n in kept:
        codepoint = meta[n]["unicode"].replace(" ", "_")
        if codepoint in animated:
            if not (lottie_dir / f"{codepoint}.json").exists():
                sys.exit(f"{n}: Noto Animated lists {codepoint}, but the Lottie file is missing. Run fetch_sources.sh.")
            lottie[n] = lottie_dir / f"{codepoint}.json"
    ids = Counter(card_id(n) for n in kept + extra)
    if max(ids.values()) > 1:
        sys.exit(f"two pictures with the same id: {[i for i, k in ids.items() if k > 1]}")

    # ---------------------------------------------------------------- 4. stills
    stills = make_stills(kept + extra, noto_png, lottie, args.workers)
    markers = Counter()
    for n, path in lottie.items():
        names = [m["cm"] for m in json.loads(path.read_text()).get("markers", [])]
        markers["rest" if "rest" in names else "other case" if "rest" in map(str.lower, names) else "none"] += 1
    summary["kept_cards_with_animation"] = len(lottie)
    summary["rest_marker"] = dict(markers)

    # ---------------------------------------------------------------- 5. colour and shape (from the shipped still)
    look = {n: colour.analyse(str(stills[n]["path"])) for n in kept}
    final_colour = {}
    for n in kept:
        a = look[n]
        if meta[n]["group"] in ts.NO_COLOUR_GROUPS:
            final_colour[n] = None
        elif n in ts.COLOUR_OVERRIDES:
            final_colour[n] = ts.COLOUR_OVERRIDES[n]
        else:
            final_colour[n] = a["main_colour"] if a["clear_colour"] else None
    shape = {"round": {}, "long": {}}
    for n in kept:
        a = look[n]
        allowed = meta[n]["group"] not in ts.NO_COLOUR_GROUPS
        for s in shape:
            shape[s][n] = allowed and ts.SHAPE_OVERRIDES[s].get(n, a[s])
    write_csv(out / "colours.csv",
              ["name", "main_colour", "main_share", "clear", "also_colours", "final_colour",
               "fill", "elongation", "round", "long", "shares"],
              ([n, look[n]["main_colour"], look[n]["main_share"], look[n]["clear_colour"],
                " ".join(look[n]["also_colours"]), final_colour[n] or "", look[n]["fill"], look[n]["elongation"],
                shape["round"][n], shape["long"][n], json.dumps(look[n]["shares"])] for n in kept))

    # ---------------------------------------------------------------- 6. categories
    categories = build_categories(kept, meta, look, final_colour, shape)

    # ---------------------------------------------------------------- 7. Noto-only items (Emoji 16-18)
    noto_files = {p.name for p in noto_dir.iterdir()}
    emoji_test = load_emoji_test(src / "emoji-test.txt")
    fluent_files = {noto_file(m["unicode"].split()) for m in meta.values()}
    noto_extra = sorted(f for f in noto_files - fluent_files)
    extra_kinds = Counter()
    for f in noto_extra:
        cps = f[len("emoji_u"):-len(".png")].split("_")
        if SKIN_TONES & set(cps):
            extra_kinds["skin-tone variant"] += 1
        elif all("1f1e6" <= c <= "1f1ff" for c in cps) or cps[0] == "1f3f4":
            extra_kinds["flag"] += 1
        elif "200d" in cps:
            extra_kinds["joined sequence (families, couples)"] += 1
        else:
            extra_kinds["single emoji"] += 1
    noto_rows = []
    by_id = {c["id"]: c for c in categories}
    for name, info in ts.NOTO_ONLY.items():
        f = noto_file(info["cps"].split("_"))
        et = emoji_test.get(f, {})
        if f not in noto_files or et.get("name") != name:
            sys.exit(f"Noto-only item {name!r}: file {f} present={f in noto_files}, emoji-test name={et.get('name')}")
        for cid in info["member_of"]:
            by_id[cid].setdefault("noto_only_members", []).append(name)
        for cid in info["maybe"]:
            by_id[cid].setdefault("noto_only_maybe", []).append(name)
        noto_rows.append([name, f, et["version"], et["group"], " ".join(info["member_of"]), " ".join(info["maybe"])])
    summary["noto_2d_512_files"] = len(noto_files)
    summary["noto_files_not_in_fluent"] = len(noto_extra)
    summary["noto_files_not_in_fluent_by_kind"] = dict(extra_kinds.most_common())
    summary["noto_only_concrete_items"] = len(ts.NOTO_ONLY)
    write_csv(out / "noto_only.csv", ["name", "noto_file", "emoji_version", "unicode_group", "member_of", "maybe"],
              noto_rows)

    # ---------------------------------------------------------------- 8. tags of each card
    concept = {n: ts.CONCEPT.get(n, n.lower()) for n in kept}
    for c in categories:
        c["n_members"] = len(c["members"])
        c["n_concepts"] = len({concept[n] for n in c["members"]})
        c["n_maybe"] = len(c["maybe"])
        c["gap"] = c["n_members"] < GAP_BELOW
        c["n_noto_only"] = len(c.get("noto_only_members", []))
    tags_of = {n: [] for n in kept}
    maybe_of = {n: [] for n in kept}
    for c in categories:
        for n in c["members"]:
            tags_of[n].append(c["id"])
        for n in c["maybe"]:
            maybe_of[n].append(c["id"])
    shipped = [n for n in kept if tags_of[n]]
    pals = [n for n in shipped if n in lottie]
    anchor_only = [a for a in anchors if a not in set(shipped)]

    # ---------------------------------------------------------------- 9. animations, format choice, game files
    sizes = make_animations(pals, lottie, stills, args.workers)
    totals = {fmt: sum(s[fmt] for s in sizes.values()) for fmt in pictures.ANIM_ENCODE}
    fmt = min(totals, key=totals.get)
    write_csv(out / "animation_sizes.csv", ["name", "rest_frame", "frames", *totals],
              ([n, stills[n]["rest_frame"], len(pictures.loop_order(lottie[n], stills[n]["rest_frame"])[0]),
                *sizes[n].values()] for n in pals))
    still_of, anim_of = ship(shipped + anchor_only, stills, pals, fmt)
    write_licences(src)
    content_bytes = check_size([PUBLIC / p for p in [*still_of.values(), *anim_of.values()]])
    summary["shipped_cards"] = len(shipped)
    summary["anchor_only_pictures"] = len(anchor_only)
    summary["pals"] = len(pals)
    summary["animation_bytes_by_format"] = totals
    summary["animation_format"] = fmt
    summary["content_bytes"] = content_bytes

    confusable = confusable_with(categories)
    game = {
        "pals": len(pals),
        "groups": [{"id": c["id"], "type": c["type"], "anchor": card_id(c["anchor"]), "confusable": confusable[c["id"]]}
                   for c in categories],
        "cards": [{"id": card_id(n), "name": n, "thing": concept[n], "colour": final_colour[n],
                   "groups": tags_of[n], "maybe": maybe_of[n], "still": still_of[n], "animation": anim_of.get(n)}
                  for n in shipped],
        "anchors": [{"id": card_id(n), "name": n, "still": still_of[n], "animation": None} for n in anchor_only],
    }
    GAME_CATALOG.write_text(json.dumps(game, ensure_ascii=False, indent=1) + "\n")

    # ---------------------------------------------------------------- 10. research data
    catalog = [dict(
        id=card_id(n), name=n, glyph=meta[n]["glyph"], unicode=meta[n]["unicode"], group=meta[n]["group"],
        keywords=meta[n]["keywords"], noto=noto_png[n].name, still=str(stills[n]["path"].relative_to(HERE)),
        animation=lottie[n].name if n in lottie else None, rest_frame=stills[n]["rest_frame"], concept=concept[n],
        colour=final_colour[n], round=shape["round"][n], long=shape["long"][n],
        tags=tags_of[n], maybe=maybe_of[n],
    ) for n in kept]
    summary["kept_cards_with_at_least_one_tag"] = len(shipped)
    summary["categories"] = len(categories)
    summary["categories_by_type"] = dict(Counter(c["type"] for c in categories))
    summary["gap_categories"] = [c["id"] for c in categories if c["gap"]]

    (out / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=1))
    (out / "categories.json").write_text(json.dumps(categories, ensure_ascii=False, indent=1))
    (out / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1))
    write_csv(out / "category_counts.csv",
              ["type", "id", "anchor", "members", "concepts", "from_keywords", "by_hand", "computed", "maybe",
               "gap", "noto_only_adds", "members_list"],
              ([c["type"], c["id"], c["anchor"], c["n_members"], c["n_concepts"], c["from_keywords"],
                c["by_hand"], c["computed"], c["n_maybe"], "GAP" if c["gap"] else "",
                " ".join(c.get("noto_only_members", [])), "; ".join(c["members"])] for c in categories))

    print(json.dumps({k: v for k, v in summary.items() if k != "metadata_fields"}, ensure_ascii=False, indent=1))
    print(f"\n{'type':12s} {'category':18s} members concepts kw hand comp maybe noto+")
    for c in categories:
        print(f"{c['type']:12s} {c['id']:18s} {c['n_members']:7d} {c['n_concepts']:8d} {c['from_keywords']:2d} "
              f"{c['by_hand']:4d} {c['computed']:4d} {c['n_maybe']:5d} {c['n_noto_only']:5d}"
              f"{'  GAP' if c['gap'] else ''}")


if __name__ == "__main__":
    main()
