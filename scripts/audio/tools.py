"""Download, convert, and measure sound files with ffmpeg.

The steps follow labrynth2 spec §9.5 (conversion and cuts) and §9.6 (loudness),
with the changes of Pile Pals ticket 05. prep.py calls these functions.
"""

import io
import json
import re
import subprocess
import urllib.request
import wave
import zipfile
from pathlib import Path

# Freesound and Kenney refuse the default urllib User-Agent.
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.0 Safari/605.1.15"
)

# Every shipped file: WAV, 16-bit, 44.1 kHz, mono (labrynth2 §9.5).
OUTPUT_FORMAT = ["-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le"]

# Remove only the silence below -50 dBFS at the start, so that the sound starts at once.
# Peak detection keeps the first sample of the attack.
TRIM_START = "silenceremove=start_periods=1:start_threshold=-50dB:detection=peak"

FADE_IN = 0.05
FADE_OUT = 0.2


def _get(url, headers=None):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **(headers or {})})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def _fetch_kenney_pack(pack, folder):
    """Downloads a Kenney pack zip with no login and unzips it into the folder."""
    page = f"https://kenney.nl/assets/{pack}"
    _get(page)
    link_id = f"assets/{pack}".encode().hex()
    link = json.loads(
        _get(
            f"https://kenney.nl/download-link/{link_id}",
            {"Referer": page, "X-Requested-With": "XMLHttpRequest"},
        )
    )
    with zipfile.ZipFile(io.BytesIO(_get(link["url"]))) as pack_zip:
        pack_zip.extractall(folder)


def fetch(source, cache):
    """Returns the local path of a source. Downloads it into the cache when it is missing.

    A source is a URL (for example a Freesound -hq.mp3 preview) or
    "kenney:<pack>/<path in the zip>" (for example "kenney:casino-audio/Audio/card-place-1.ogg").
    """
    if source.startswith("kenney:"):
        pack, _, inner = source.removeprefix("kenney:").partition("/")
        folder = cache / "kenney" / pack
        if not (folder / inner).exists():
            _fetch_kenney_pack(pack, folder)
        return folder / inner
    path = cache / "url" / source.split("://", 1)[1]
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(_get(source))
    return path


def _ffmpeg(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def seconds(path):
    with wave.open(str(path)) as file:
        return file.getnframes() / file.getframerate()


def convert(source, out, cut):
    """Writes the processed WAV file.

    A file that is not cut gets no fade, because a fade removes the attack.
    A cut clip gets a fade-in of 0.05 s and a fade-out of 0.2 s (or cut["fadeOut"]).
    A cut that starts at 0 keeps the attack of the recording, so it gets no fade-in.
    """
    if cut is None:
        _ffmpeg("-i", str(source), "-af", TRIM_START, *OUTPUT_FORMAT, str(out))
        return
    start, duration = cut["start"], cut["duration"]
    # atrim, not -ss: -ss after -i together with afade made silent clips in labrynth2.
    trim = f"atrim=start={start}:duration={duration},asetpts=PTS-STARTPTS,{TRIM_START}"
    raw = out.with_suffix(".raw.wav")
    _ffmpeg("-i", str(source), "-af", trim, *OUTPUT_FORMAT, str(raw))
    fade_out = cut.get("fadeOut", FADE_OUT)
    fades = [f"afade=t=out:st={seconds(raw) - fade_out:.3f}:d={fade_out}"]
    if start > 0:
        fades.insert(0, f"afade=t=in:st=0:d={FADE_IN}")
    _ffmpeg("-i", str(raw), "-af", ",".join(fades), *OUTPUT_FORMAT, str(out))
    raw.unlink()


def _ebur128(path, filters):
    result = subprocess.run(
        ["ffmpeg", "-nostats", "-i", str(path), "-af", filters, "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stderr


def loudness(path):
    """Returns (I in LUFS, TP in dBTP) from the ebur128 summary (labrynth2 §9.6, step 1)."""
    log = _ebur128(path, "ebur128=peak=true")
    summary = log[log.rindex("Summary:") :]
    lufs = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summary).group(1))
    true_peak = float(re.search(r"True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS", summary).group(1))
    return lufs, true_peak


def max_momentary(path, gain_db):
    """Returns the maximum momentary loudness M after the gain, with the file padded to 0.4 s."""
    log = _ebur128(path, f"volume={gain_db}dB,apad=whole_dur=0.4,ebur128=peak=true")
    return max(float(value) for value in re.findall(r"\bM:\s*(-?[\d.]+)", log))
