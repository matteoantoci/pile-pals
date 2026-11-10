# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow"]
# ///
"""Build the card catalogue and per-category counts.

    ./fetch_sources.sh            # once; downloads into /tmp/kids-solitaire-src
    uv run build_content.py       # writes data/ and prints the numbers

Inputs (from fetch_sources.sh): Fluent Emoji assets, the Noto 3D/png/512 file
list, and Unicode emoji-test.txt 18.0.
Outputs in data/: summary.json, catalog.json, excluded.csv, colours.csv,
categories.json, category_counts.csv, noto_only.csv.
"""

import argparse
import csv
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import colour  # noqa: E402
import curation  # noqa: E402
import tag_schema as ts  # noqa: E402

SKIN_TONES = {"1f3fb", "1f3fc", "1f3fd", "1f3fe", "1f3ff"}
GAP_BELOW = 5  # a category with fewer members than this is a gap


def noto_file(codepoints: list[str]) -> str:
    """Noto file name for a codepoint sequence: underscores, no fe0f, 4+ hex digits."""
    parts = [c.lower().zfill(4) for c in codepoints if c.lower() != "fe0f"]
    return "emoji_u" + "_".join(parts) + ".png"


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


def find_3d_png(folder: Path) -> Path | None:
    for pattern in ("3D/*.png", "Default/3D/*.png"):
        hits = sorted(folder.glob(pattern))
        if hits:
            return hits[0]
    return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=os.environ.get("SRC", "/tmp/kids-solitaire-src"))
    ap.add_argument("--out", default=str(HERE / "data"))
    args = ap.parse_args()
    src, out = Path(args.src), Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    assets = src / "fluentui-emoji" / "assets"

    # ---------------------------------------------------------------- 1. Fluent totals
    meta, png = {}, {}
    for folder in sorted(p for p in assets.iterdir() if p.is_dir()):
        meta[folder.name] = json.loads((folder / "metadata.json").read_text(encoding="utf-8"))
        png[folder.name] = find_3d_png(folder)
    all_paths = (src / "fluent_all_paths.txt").read_text().splitlines()
    png_files_3d = [p for p in all_paths if "/3D/" in p and p.endswith(".png")]
    field_counts = Counter(k for m in meta.values() for k in m)
    summary = {
        "fluent_emoji_folders": len(meta),
        "folders_with_3d_png": sum(1 for p in png.values() if p),
        "3d_png_files_including_skin_tones": len(png_files_3d),
        "folders_with_skin_tones": sum(1 for m in meta.values() if "unicodeSkintones" in m),
        "metadata_fields": dict(field_counts.most_common()),
        "fluent_groups": dict(Counter(m["group"] for m in meta.values()).most_common()),
    }

    # ---------------------------------------------------------------- 2. filter
    reasons = {n: curation.drop_reason(n, m["group"]) for n, m in meta.items()}
    kept = [n for n in meta if reasons[n] is None and png[n]]
    summary["kept_cards"] = len(kept)
    summary["dropped_by_reason"] = dict(Counter(r for r in reasons.values() if r).most_common())
    summary["kept_by_group"] = dict(Counter(meta[n]["group"] for n in kept).most_common())
    with open(out / "excluded.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["name", "group", "reason"])
        for n in meta:
            if reasons[n]:
                w.writerow([n, meta[n]["group"], reasons[n]])

    # ---------------------------------------------------------------- 3. colour and shape
    look = {n: colour.analyse(str(png[n])) for n in kept}
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
    with open(out / "colours.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["name", "main_colour", "main_share", "clear", "also_colours", "final_colour",
                    "fill", "elongation", "round", "long", "shares"])
        for n in kept:
            a = look[n]
            w.writerow([n, a["main_colour"], a["main_share"], a["clear_colour"], " ".join(a["also_colours"]),
                        final_colour[n] or "", a["fill"], a["elongation"], shape["round"][n], shape["long"][n],
                        json.dumps(a["shares"])])

    # ---------------------------------------------------------------- 4. categories
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

    # ---------------------------------------------------------------- 5. Noto 3D join
    noto_files = set((src / "noto_3d_512.txt").read_text().split())
    emoji_test = load_emoji_test(src / "emoji-test.txt")
    has_noto = {n: noto_file(meta[n]["unicode"].split()) in noto_files for n in kept}
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
    summary["noto_3d_512_files"] = len(noto_files)
    summary["kept_cards_with_noto_3d_512"] = sum(has_noto.values())
    summary["fluent_folders_with_noto_3d_512"] = sum(
        1 for m in meta.values() if noto_file(m["unicode"].split()) in noto_files)
    summary["noto_files_not_in_fluent"] = len(noto_extra)
    summary["noto_files_not_in_fluent_by_kind"] = dict(extra_kinds.most_common())
    summary["noto_only_concrete_items"] = len(ts.NOTO_ONLY)
    with open(out / "noto_only.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["name", "noto_file", "emoji_version", "unicode_group", "member_of", "maybe"])
        w.writerows(noto_rows)

    # ---------------------------------------------------------------- 6. write
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
    catalog = [dict(
        name=n, glyph=meta[n]["glyph"], unicode=meta[n]["unicode"], group=meta[n]["group"],
        keywords=meta[n]["keywords"], png=str(png[n].relative_to(assets)), concept=concept[n],
        colour=final_colour[n], round=shape["round"][n], long=shape["long"][n],
        tags=tags_of[n], maybe=maybe_of[n], noto_3d_512=has_noto[n],
    ) for n in kept]
    summary["kept_cards_with_at_least_one_tag"] = sum(1 for n in kept if tags_of[n])
    summary["categories"] = len(categories)
    summary["categories_by_type"] = dict(Counter(c["type"] for c in categories))
    summary["gap_categories"] = [c["id"] for c in categories if c["gap"]]

    (out / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=1))
    (out / "categories.json").write_text(json.dumps(categories, ensure_ascii=False, indent=1))
    (out / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1))
    with open(out / "category_counts.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["type", "id", "anchor", "members", "concepts", "from_keywords", "by_hand", "computed", "maybe",
                    "gap", "noto_only_adds", "members_list"])
        for c in categories:
            w.writerow([c["type"], c["id"], c["anchor"], c["n_members"], c["n_concepts"], c["from_keywords"],
                        c["by_hand"], c["computed"], c["n_maybe"], "GAP" if c["gap"] else "",
                        " ".join(c.get("noto_only_members", [])), "; ".join(c["members"])])

    print(json.dumps({k: v for k, v in summary.items() if k != "metadata_fields"}, ensure_ascii=False, indent=1))
    print(f"\n{'type':12s} {'category':18s} members concepts kw hand comp maybe noto+")
    for c in categories:
        print(f"{c['type']:12s} {c['id']:18s} {c['n_members']:7d} {c['n_concepts']:8d} {c['from_keywords']:2d} "
              f"{c['by_hand']:4d} {c['computed']:4d} {c['n_maybe']:5d} {c['n_noto_only']:5d}"
              f"{'  GAP' if c['gap'] else ''}")


if __name__ == "__main__":
    main()
