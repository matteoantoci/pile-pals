#!/usr/bin/env bash
# Fetch the inputs for build_content.py into $SRC (default /tmp/kids-solitaire-src).
# Pinned to the commits used for content-model.md so the counts reproduce.
#  - Fluent Emoji: metadata.json + default 3D PNG of every emoji (about 60 MB).
#  - Noto Emoji: only the file list of 3D/png/512 (no image download).
#  - Unicode emoji-test.txt 18.0: names and Emoji versions for Noto-only files.
set -euo pipefail

SRC="${SRC:-/tmp/kids-solitaire-src}"
FLUENT_REV=1ffb34c752ecf5d402f04cfb4b392c77f57c54bc   # 2026-08-24
NOTO_REV=99701e07d3d1fe1bdbcdb14964547f0fd592966f     # 2026-10-26
mkdir -p "$SRC"
cd "$SRC"

if [ ! -d fluentui-emoji/.git ]; then
  git init -q fluentui-emoji
  git -C fluentui-emoji remote add origin https://github.com/microsoft/fluentui-emoji.git
fi
git -C fluentui-emoji config core.sparseCheckout true
git -C fluentui-emoji sparse-checkout set --no-cone \
  '/assets/*/metadata.json' '/assets/*/3D/*.png' '/assets/*/Default/3D/*.png'
git -C fluentui-emoji fetch -q --depth 1 --filter=blob:none origin "$FLUENT_REV"
git -C fluentui-emoji checkout -q "$FLUENT_REV"
git -C fluentui-emoji ls-tree -r --name-only "$FLUENT_REV" > fluent_all_paths.txt

if [ ! -d noto-emoji/.git ]; then
  git init -q noto-emoji
  git -C noto-emoji remote add origin https://github.com/googlefonts/noto-emoji.git
fi
git -C noto-emoji fetch -q --depth 1 --filter=blob:none origin "$NOTO_REV"
git -C noto-emoji ls-tree --name-only "$NOTO_REV:3D/png/512" > noto_3d_512.txt

curl -fsSL -o emoji-test.txt https://www.unicode.org/Public/18.0.0/emoji/emoji-test.txt

echo "Fluent assets: $(ls fluentui-emoji/assets | wc -l | tr -d ' ') folders"
echo "Noto 3D 512 files: $(wc -l < noto_3d_512.txt | tr -d ' ')"
echo "Sources ready in $SRC"
