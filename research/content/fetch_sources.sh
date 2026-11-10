#!/usr/bin/env bash
# Fetch the inputs for build_content.py into $SRC (default ~/.cache/pile-pals-impl/sources).
# The script downloads only the files that are missing, so you can run it again.
#  - Fluent Emoji: only metadata.json of each emoji (names, keywords, groups). No Fluent picture.
#  - Noto Emoji 2D: the 512 px PNGs and the licence files (Apache 2.0), pinned to NOTO_REV.
#  - Noto Animated: the index api.json and the Lottie file of each animated emoji (CC BY 4.0).
#    Google gives no pinned version of these files. The URL is always "latest".
#  - Unicode emoji-test.txt 18.0: names and Emoji versions for the Noto-only items.
set -euo pipefail

SRC="${SRC:-$HOME/.cache/pile-pals-impl/sources}"
FLUENT_REV=1ffb34c752ecf5d402f04cfb4b392c77f57c54bc   # 2026-08-24
NOTO_REV=99701e07d3d1fe1bdbcdb14964547f0fd592966f     # 2026-10-26
NOTO_RAW="https://raw.githubusercontent.com/googlefonts/noto-emoji/$NOTO_REV"
NOTO_API="https://api.github.com/repos/googlefonts/noto-emoji/git/trees"
ANIM_INDEX=https://googlefonts.github.io/noto-emoji-animation/data/api.json
ANIM_URL=https://fonts.gstatic.com/s/e/notoemoji/latest
mkdir -p "$SRC"
cd "$SRC"

# Download each "<url> <file>" line of stdin that is not on disk yet, 16 at a time.
# A file that the server does not have gives a message, not a stop
# (Noto Animated lists "a9_fe0f" and "ae_fe0f", but gstatic has no Lottie file for them).
fetch_missing() {
  while read -r url file; do
    [ -s "$file" ] || printf '%s %s\n' "$url" "$file"
  done | xargs -P 16 -n 2 sh -c \
    'mkdir -p "$(dirname "$1")"; curl -fsL --retry 3 -o "$1" "$0" || { rm -f "$1"; echo "not found: $0" >&2; }'
}

# Fluent Emoji metadata (sparse checkout, no pictures).
if [ ! -d fluentui-emoji/.git ]; then
  git init -q fluentui-emoji
  git -C fluentui-emoji remote add origin https://github.com/microsoft/fluentui-emoji.git
fi
git -C fluentui-emoji config core.sparseCheckout true
git -C fluentui-emoji sparse-checkout set --no-cone '/assets/*/metadata.json'
git -C fluentui-emoji fetch -q --depth 1 --filter=blob:none origin "$FLUENT_REV"
git -C fluentui-emoji checkout -q "$FLUENT_REV"

# Noto Emoji 2D. The GitHub trees API gives the file list of the 2D folder at NOTO_REV.
mkdir -p noto-emoji
echo "$NOTO_REV" > noto-emoji/REVISION
tree_2d=$(curl -fsSL "$NOTO_API/$NOTO_REV" | jq -r '.tree[] | select(.path == "2D") | .sha')
curl -fsSL "$NOTO_API/$tree_2d?recursive=1" |
  jq -r '.tree[] | select(.type == "blob") | "2D/" + .path' |
  grep -E '^2D/png/512/.*\.png$|^2D/svg/LICENSE$' > noto-emoji/want.txt
sed "s|.*|$NOTO_RAW/& noto-emoji/&|" noto-emoji/want.txt | fetch_missing

# Noto Animated: the index and one Lottie file for each animated emoji.
mkdir -p noto-animated/lottie
curl -fsSL -o noto-animated/api.json "$ANIM_INDEX"
jq -r '.icons[].codepoint' noto-animated/api.json |
  sed "s|.*|$ANIM_URL/&/lottie.json noto-animated/lottie/&.json|" | fetch_missing

curl -fsSL -o emoji-test.txt https://www.unicode.org/Public/18.0.0/emoji/emoji-test.txt

echo "Fluent assets: $(ls fluentui-emoji/assets | wc -l | tr -d ' ') folders"
echo "Noto 2D 512 files: $(ls noto-emoji/2D/png/512 | wc -l | tr -d ' ')"
echo "Noto Lottie files: $(ls noto-animated/lottie | wc -l | tr -d ' ')"
echo "Sources ready in $SRC"
