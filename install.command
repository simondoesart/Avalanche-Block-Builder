#!/bin/bash
# Grid Blocks — installs the unsigned panel for After Effects (macOS)
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/GridBlocks"
mkdir -p "$DEST"
rsync -a --delete --exclude .git --exclude fonts/desktop --exclude install.command --exclude ship.command --exclude package.sh --exclude README.md --exclude src --exclude build.sh --exclude dist --exclude dist-src --exclude downloads --exclude v2 --exclude v3.60 --exclude api --exclude "*.zip" "$SRC/" "$DEST/"
# brand fonts: copy any .otf/.ttf in fonts/ into the user font folder so After Effects can use them
n=0
for f in "$SRC"/fonts/desktop/*.otf "$SRC"/fonts/desktop/*.ttf "$SRC"/fonts/*.otf "$SRC"/fonts/*.ttf; do
  [ -e "$f" ] || continue
  mkdir -p "$HOME/Library/Fonts"; cp -n "$f" "$HOME/Library/Fonts/" && n=$((n+1))
done
[ $n -gt 0 ] && echo "Installed $n brand font file(s) from fonts/ into ~/Library/Fonts"
# clear the CEP page cache so After Effects loads the new version (stale cache can show a black panel)
rm -rf "$HOME/Library/Caches/CSXS/cep_cache" 2>/dev/null
for v in 9 10 11 12 13; do defaults write com.adobe.CSXS.$v PlayerDebugMode 1; done
echo ""
echo "Installed to: $DEST"
echo "Restart After Effects, then open Window > Extensions > Grid Blocks"
