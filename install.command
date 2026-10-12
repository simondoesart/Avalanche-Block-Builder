#!/bin/bash
# Grid Blocks — installs the unsigned panel for After Effects (macOS)
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/GridBlocks"
mkdir -p "$DEST"
rsync -a --delete --exclude install.command --exclude README.md --exclude src --exclude build.sh "$SRC/" "$DEST/"
for v in 9 10 11 12 13; do defaults write com.adobe.CSXS.$v PlayerDebugMode 1; done
echo ""
echo "Installed to: $DEST"
echo "Restart After Effects, then open Window > Extensions > Grid Blocks"
