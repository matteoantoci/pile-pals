#!/usr/bin/env python3
"""Writes the iOS startup images of the shell. Research: research/native-feel/shell.md, section 1.

The iPhone 12 screen is 390 x 844 pt at 3x, so the portrait image is 1170 x 2532 px and the landscape
image is 2532 x 1170 px. iOS shows a startup image only as a real file, never as a data URL.
The image is a plain fill of the table colour: it must look like the first frame that the app paints,
and that frame is the table. Ticket 10 can add the game mark when the title scene exists.

python3 scripts/shell/splash.py
"""

import struct
import zlib
from pathlib import Path

# The top colour of the table. Keep the same value in index.html, vite.config.ts, and src/ui/styles.css.
TABLE = (0x08, 0x81, 0x3A)
OUT = Path(__file__).resolve().parents[2] / 'public' / 'splash'


def chunk(kind: bytes, data: bytes) -> bytes:
    """One PNG chunk: length, kind, data, and CRC."""
    body = kind + data
    return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body) & 0xFFFFFFFF)


def write(width: int, height: int, path: Path) -> None:
    """Write a PNG of one colour. Colour type 2 is RGB, bit depth 8, filter 0 on each row."""
    row = b'\x00' + bytes(TABLE) * width
    raw = row * height
    png = (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b'')
    )
    path.write_bytes(png)
    print(f'{path.name}: {width} x {height} px, {len(png)} bytes')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    write(1170, 2532, OUT / 'iphone-12-portrait.png')
    write(2532, 1170, OUT / 'iphone-12-landscape.png')


if __name__ == '__main__':
    main()
