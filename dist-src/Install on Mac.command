#!/bin/bash
# Grid Blocks — installs the After Effects panel (macOS, After Effects 2022 / v22 and newer)
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/GridBlocks"
echo "Installing Grid Blocks…"
mkdir -p "$DEST"
rsync -a --delete "$SRC/GridBlocks/" "$DEST/"
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null
# brand fonts → your user font folder (skips ones you already have)
n=0
for f in "$SRC"/Fonts/*.otf "$SRC"/Fonts/*.ttf; do
  [ -e "$f" ] || continue
  mkdir -p "$HOME/Library/Fonts"; if [ ! -e "$HOME/Library/Fonts/$(basename "$f")" ]; then cp "$f" "$HOME/Library/Fonts/" && n=$((n+1)); fi
done
[ $n -gt 0 ] && echo "Installed $n font file(s) into ~/Library/Fonts"
# unsigned panels need debug mode on (CEP 9–13 covers After Effects 2019–2026)
for v in 9 10 11 12 13; do defaults write com.adobe.CSXS.$v PlayerDebugMode 1; done
# clear the panel cache so After Effects loads this version
rm -rf "$HOME/Library/Caches/CSXS/cep_cache" 2>/dev/null
echo ""
echo "Installed to: $DEST"
echo "Restart After Effects, then open Window › Extensions › Grid Blocks"
