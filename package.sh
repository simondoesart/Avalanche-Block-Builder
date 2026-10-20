#!/bin/bash
# Builds the After Effects panel downloads:
#   downloads/GridBlocks-AE-Mac.zip, downloads/GridBlocks-AE-Windows.zip   (public, website — no desktop font files)
#   GridBlocks-AE-Mac (with fonts).zip, GridBlocks-AE-Windows (with fonts).zip   (internal, git/Vercel-ignored)
set -e
cd "$(dirname "$0")"
bash build.sh >/dev/null
rm -rf dist downloads/GridBlocks-AE.zip "GridBlocks-AE (internal, with fonts).zip"; mkdir -p dist downloads
mkpkg(){ # $1 = Mac|Windows, $2 = fonts|nofonts
  local OUT="dist/$1-$2/GridBlocks-AE-$1"; mkdir -p "$OUT/GridBlocks/fonts" "$OUT/Fonts"
  cp -R CSXS index.html safe.html host.jsx media .debug "$OUT/GridBlocks/"
  cp fonts/*.woff fonts/*.woff2 "$OUT/GridBlocks/fonts/" 2>/dev/null || true
  cp dist-src/README.txt "$OUT/"
  cp dist-src/sample-workflow.json "$OUT/Sample workflow.json"
  cp dist-src/sample-walkon-walkoff.json "$OUT/Sample walk on - walk off.json"
  if [ "$1" = Mac ]; then cp "dist-src/Install on Mac.command" "$OUT/"; chmod 755 "$OUT/Install on Mac.command"; else cp "dist-src/Install on Windows.bat" "$OUT/"; fi
  if [ "$2" = fonts ]; then cp fonts/desktop/*.otf fonts/desktop/*.ttf "$OUT/Fonts/" 2>/dev/null || true
  else echo "Put the Aeonik / Aeonik Fono .otf files from the Ava Labs brand drive in this folder, then run the installer again (or install them yourself)." > "$OUT/Fonts/Add brand fonts here.txt"; fi
  local Z; if [ "$2" = fonts ]; then Z="$PWD/GridBlocks-AE-$1 (with fonts).zip"; else Z="$PWD/downloads/GridBlocks-AE-$1.zip"; fi
  rm -f "$Z"; (cd "dist/$1-$2" && zip -qr -X "$Z" "GridBlocks-AE-$1"); echo "built $(basename "$Z") ($(du -h "$Z" | cut -f1))"
}
for os in Mac Windows; do mkpkg $os nofonts; mkpkg $os fonts; done
