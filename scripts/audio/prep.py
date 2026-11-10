"""Prepares the game sounds. Run from any folder: python3 scripts/audio/prep.py

Needs Python 3.11 or later and ffmpeg 6 or later. No pip package.

Reads src/sound/sounds.json (the slots, their candidates, and the source of each clip). For each clip:
downloads the source into .cache/audio/, converts and cuts it, measures it, and sets the play gain.
Then it writes:
- public/sounds/<id>.wav for each clip that a slot picks. The game ships and precaches these files.
- public/listen/clips/<id>.wav for the other candidates. Only the listening page plays them.
- src/sound/levels.ts, the table of the measured values and the gains.
- the "sound" entries of src/credits.json. The script keeps all other entries.
"""

import json
import math
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import tools
import writers

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "src/sound/sounds.json"
LEVELS = ROOT / "src/sound/levels.ts"
CREDITS = ROOT / "src/credits.json"
PUBLIC = ROOT / "public"
SHIPPED_DIR = "sounds"
LISTEN_DIR = "listen/clips"
CACHE = ROOT / ".cache/audio"
CATALOG = ROOT / "src/model/catalog.json"

# The rising snap is the loudest sound. No other file has a higher momentary loudness.
SNAP_SLOT = "snap"
# Below 0.4 s, ebur128 cannot measure the integrated loudness I.
SHORT_SECONDS = 0.4
# The slot of a pal sound is "pal-<card id>" (src/sound/index.ts, playPal). A pal is a card with an animation.
PAL_PREFIX = "pal-"


def floor_tenth(value):
    """Rounds down to 0.1 dB, so that a gain never goes above its limit."""
    return math.floor(round(value * 10, 6)) / 10


def gain_for(seconds, lufs, true_peak):
    """Returns (gain in dB, rule). labrynth2 §9.6 step 2, and the short-file rule of ticket 05."""
    if seconds < SHORT_SECONDS:
        return floor_tenth(-6 - true_peak), "short"
    gain = floor_tenth(-18 - lufs)
    if true_peak + gain > -1:
        return floor_tenth(-1 - true_peak), "peak"
    return gain, "loudness"


def load_manifest():
    manifest = json.loads(MANIFEST.read_text())
    licences = json.loads(CREDITS.read_text())["licences"]
    slots = [slot for section in manifest["sections"] for slot in section["slots"]]
    ids = [slot["id"] for slot in slots]
    if len(ids) != len(set(ids)):
        sys.exit("sounds.json: two slots have the same id.")
    if SNAP_SLOT not in ids:
        sys.exit(f"sounds.json: the {SNAP_SLOT} slot is missing. The level rule needs it.")
    for slot in slots:
        if slot["pick"] not in slot["candidates"]:
            sys.exit(f"sounds.json: slot {slot['id']} picks a clip that is not a candidate.")
        if slot["status"] not in ("sure", "doubt"):
            sys.exit(f"sounds.json: slot {slot['id']} has a status that is not sure or doubt.")
    pals = {card["id"] for card in json.loads(CATALOG.read_text())["cards"] if card["animation"]}
    for slot_id in ids:
        if slot_id.startswith(PAL_PREFIX) and slot_id.removeprefix(PAL_PREFIX) not in pals:
            sys.exit(f"sounds.json: slot {slot_id} is not a pal of src/model/catalog.json.")
    for clip_id in {c for slot in slots for c in slot["candidates"]}:
        clip = manifest["clips"].get(clip_id)
        if clip is None or clip["licence"] not in licences:
            sys.exit(f"sounds.json: clip {clip_id} is missing or has a licence that credits.json does not know.")
    return manifest, slots


def process(clip_id, clip, folder):
    """Converts one clip and sets its gain. Returns its line of the level table."""
    out = PUBLIC / folder / f"{clip_id}.wav"
    tools.convert(tools.fetch(clip["source"], CACHE), out, clip.get("cut"))
    seconds = tools.seconds(out)
    lufs, true_peak = tools.loudness(out)
    gain, rule = gain_for(seconds, lufs, true_peak)
    return {
        "file": f"{folder}/{clip_id}.wav",
        "seconds": round(seconds, 3),
        "lufs": lufs,
        "truePeak": true_peak,
        "rule": rule,
        "snapLimitDb": 0,
        "gainDb": gain,
        "maxMomentary": tools.max_momentary(out, gain),
    }


def apply_snap_limit(level, reference):
    """Lowers the gain until the maximum momentary loudness M is not above the snap."""
    path = PUBLIC / level["file"]
    for _ in range(5):
        if level["maxMomentary"] <= reference:
            return
        step = math.ceil(round((level["maxMomentary"] - reference) * 10, 6)) / 10
        level["gainDb"] = round(level["gainDb"] - step, 1)
        level["snapLimitDb"] = round(level["snapLimitDb"] + step, 1)
        level["maxMomentary"] = tools.max_momentary(path, level["gainDb"])
    sys.exit(f"{level['file']}: the snap limit did not converge.")


def clear_wav(folder):
    (PUBLIC / folder).mkdir(parents=True, exist_ok=True)
    for old in (PUBLIC / folder).glob("*.wav"):
        old.unlink()


def build_levels(manifest, slots):
    picked = {slot["pick"] for slot in slots}
    clip_ids = list(dict.fromkeys(c for slot in slots for c in slot["candidates"]))
    # Download one at a time: two clips can come from the same Kenney zip.
    for clip_id in clip_ids:
        tools.fetch(manifest["clips"][clip_id]["source"], CACHE)
    clear_wav(SHIPPED_DIR)
    clear_wav(LISTEN_DIR)
    with ThreadPoolExecutor() as pool:
        jobs = {
            c: pool.submit(process, c, manifest["clips"][c], SHIPPED_DIR if c in picked else LISTEN_DIR)
            for c in clip_ids
        }
        levels = {c: job.result() for c, job in jobs.items()}
    # A snap candidate is not limited: it is the reference when the Parent picks it.
    snaps = {c for slot in slots if slot["id"] == SNAP_SLOT for c in slot["candidates"]}
    snap_pick = next(slot["pick"] for slot in slots if slot["id"] == SNAP_SLOT)
    reference = levels[snap_pick]["maxMomentary"]
    for clip_id, level in levels.items():
        if clip_id not in snaps:
            apply_snap_limit(level, reference)
    return levels


def main():
    manifest, slots = load_manifest()
    levels = build_levels(manifest, slots)
    writers.write_levels(LEVELS, levels, slots)
    writers.write_credits(CREDITS, manifest, levels)
    subprocess.run([str(ROOT / "node_modules/.bin/oxfmt"), str(LEVELS), str(CREDITS)], cwd=ROOT, check=True)
    writers.print_report(levels, slots)


if __name__ == "__main__":
    main()
