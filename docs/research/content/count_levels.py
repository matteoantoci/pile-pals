# /// script
# requires-python = ">=3.11"
# ///
"""Count the fair levels the data supports, and deal example levels.

    uv run count_levels.py               # counts -> data/level_counts.json, .csv
    uv run count_levels.py --examples 5  # also print 5 random fair levels

A level = one association type, k groups (2-4) of that type, and for each group
one anchor picture plus n cards (3-5). Fairness rule, checked per card:

  A picture may be dealt to group G only if it is a member of G and it does
  not FIT any other group shown in the level. "Fits" = member or maybe
  (tag_schema.py). The anchor obeys the same rule.

Plus two level-wide rules:
  - never show two CONFUSABLE groups together (tag_schema.CONFUSABLE, and
    neighbouring colours from colour.NEIGHBOURS);
  - at most one picture per concept (tag_schema.CONCEPT), so pool sizes count
    distinct concepts.

A group combination is a valid "level setup" if every group still has at least
n + 1 safe concepts (n cards + 1 anchor).
"""

import argparse
import csv
import json
import math
import random
import sys
from itertools import combinations
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import colour  # noqa: E402
import tag_schema as ts  # noqa: E402

DATA = HERE / "data"
GROUP_COUNTS = (2, 3, 4)
CARD_COUNTS = (3, 5)


def load():
    cats = json.loads((DATA / "categories.json").read_text())
    concept = {c["name"]: c["concept"] for c in json.loads((DATA / "catalog.json").read_text())}
    blocked = set(ts.CONFUSABLE) | {frozenset({a, b}) for a, ns in colour.NEIGHBOURS.items() for b in ns}
    return cats, concept, blocked


def safe_pools(combo, concept) -> list[dict[str, list[str]]]:
    """For each group in the combo: concept -> safe pictures of that concept."""
    pools = []
    for g in combo:
        others = set()
        for h in combo:
            if h is not g:
                others |= set(h["members"]) | set(h["maybe"])
        pool: dict[str, list[str]] = {}
        for name in g["members"]:
            if name not in others:
                pool.setdefault(concept[name], []).append(name)
        pools.append(pool)
    return pools


def is_blocked(combo, blocked) -> bool:
    return any(frozenset({a["id"], b["id"]}) in blocked for a, b in combinations(combo, 2))


def count(cats, concept, blocked) -> list[dict]:
    rows = []
    for typ in dict.fromkeys(c["type"] for c in cats):
        group = [c for c in cats if c["type"] == typ]
        for k in GROUP_COUNTS:
            if k > len(group):
                continue
            row = {"type": typ, "categories": len(group), "groups": k, "combinations": math.comb(len(group), k),
                   "blocked_confusable": 0}
            for n in CARD_COUNTS:
                row[f"valid_n{n}"] = 0
                row[f"log10_deals_n{n}"] = None
            deals = {n: 0 for n in CARD_COUNTS}
            for combo in combinations(group, k):
                if is_blocked(combo, blocked):
                    row["blocked_confusable"] += 1
                    continue
                sizes = [len(p) for p in safe_pools(combo, concept)]
                for n in CARD_COUNTS:
                    if min(sizes) >= n + 1:
                        row[f"valid_n{n}"] += 1
                        # choose n+1 concepts per group, then which one is the anchor
                        deals[n] += math.prod(math.comb(s, n + 1) * (n + 1) for s in sizes)
            for n in CARD_COUNTS:
                if deals[n]:
                    row[f"log10_deals_n{n}"] = round(math.log10(deals[n]), 1)
            rows.append(row)
    return rows


def example_level(cats, concept, blocked, rng: random.Random, typ: str, k: int, n: int):
    group = [c for c in cats if c["type"] == typ]
    combos = [c for c in combinations(group, k) if not is_blocked(c, blocked)]
    rng.shuffle(combos)
    for combo in combos:
        pools = safe_pools(combo, concept)
        if min(len(p) for p in pools) < n + 1:
            continue
        level = []
        for g, pool in zip(combo, pools):
            # Prefer the suggested anchor (the clearest example). Colour and shape anchors
            # (coloured hearts, a red circle) are not cards, so they never collide.
            anchor_concept = concept.get(g["anchor"])
            if anchor_concept is None:
                anchor = g["anchor"]
                rest = sorted(pool)
            elif anchor_concept in pool and g["anchor"] in pool[anchor_concept]:
                anchor = g["anchor"]
                rest = [c for c in sorted(pool) if c != anchor_concept]
            else:
                anchor_concept = rng.choice(sorted(pool))
                anchor = rng.choice(pool[anchor_concept])
                rest = [c for c in sorted(pool) if c != anchor_concept]
            cards = [rng.choice(pool[c]) for c in rng.sample(rest, n)]
            level.append({"group": g["id"], "anchor": anchor, "cards": cards})
        return level
    return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--examples", type=int, default=0)
    ap.add_argument("--seed", type=int, default=1)
    args = ap.parse_args()
    cats, concept, blocked = load()
    rows = count(cats, concept, blocked)

    totals = {}
    for n in CARD_COUNTS:
        totals[f"valid_setups_n{n}"] = sum(r[f"valid_n{n}"] for r in rows)
        for k in GROUP_COUNTS:
            totals[f"valid_setups_k{k}_n{n}"] = sum(r[f"valid_n{n}"] for r in rows if r["groups"] == k)
    (DATA / "level_counts.json").write_text(json.dumps({"rows": rows, "totals": totals}, indent=1))
    with open(DATA / "level_counts.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)

    print(f"{'type':12s} {'cats':>4s} {'k':>2s} {'combos':>7s} {'blocked':>7s} {'valid n=3':>9s} "
          f"{'valid n=5':>9s} {'log10 deals n=3':>15s}")
    for r in rows:
        print(f"{r['type']:12s} {r['categories']:4d} {r['groups']:2d} {r['combinations']:7d} "
              f"{r['blocked_confusable']:7d} {r['valid_n3']:9d} {r['valid_n5']:9d} {str(r['log10_deals_n3']):>15s}")
    print(json.dumps(totals, indent=1))

    rng = random.Random(args.seed)
    feasible = [(r["type"], r["groups"]) for r in rows if r["valid_n3"]]
    for _ in range(args.examples):
        typ, k = rng.choice(feasible)
        n = 3
        for bigger in (5, 4):  # deal more cards when the level allows it
            if rng.random() < 0.5 and example_level(cats, concept, blocked, random.Random(0), typ, k, bigger):
                n = bigger
                break
        level = example_level(cats, concept, blocked, rng, typ, k, n)
        print(f"\n[{typ}, {k} groups, {n} cards each]")
        for g in level:
            print(f"  {g['group']:16s} anchor={g['anchor']!r:28s} cards={g['cards']}")


if __name__ == "__main__":
    main()
