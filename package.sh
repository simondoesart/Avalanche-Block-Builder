#!/bin/bash
# Builds downloads/GridBlocks-AE.zip — the After Effects panel for Mac + Windows
set -e
cd "$(dirname "$0")"
bash build.sh >/dev/null
OUT=dist/GridBlocks-AE; rm -rf dist; mkdir -p "$OUT/GridBlocks" "$OUT/Fonts" downloads
cp -R CSXS index.html safe.html host.jsx media .debug "$OUT/GridBlocks/"
mkdir -p "$OUT/GridBlocks/fonts"; cp fonts/*.woff fonts/*.woff2 "$OUT/GridBlocks/fonts/" 2>/dev/null || true
cp dist-src/README.txt dist-src/"Install on Mac.command" dist-src/"Install on Windows.bat" "$OUT/"
cp dist-src/sample-workflow.json "$OUT/Sample workflow.json"
chmod -R u+rwX,go+rX dist; chmod 755 "$OUT/Install on Mac.command"
# public download (website): no desktop font files — the brand fonts are licensed for internal use
echo "Put the Aeonik / Aeonik Fono .otf files from the Ava Labs brand drive in this folder, then run the installer again (or install them yourself)." > "$OUT/Fonts/Add brand fonts here.txt"
rm -f downloads/GridBlocks-AE.zip
(cd dist && zip -qr -X ../downloads/GridBlocks-AE.zip GridBlocks-AE)
echo "built downloads/GridBlocks-AE.zip ($(du -h downloads/GridBlocks-AE.zip | cut -f1))"
# internal copy with the brand fonts (stays out of git and the website)
rm -f "$OUT/Fonts/Add brand fonts here.txt"; cp fonts/desktop/*.otf fonts/desktop/*.ttf "$OUT/Fonts/" 2>/dev/null || true
rm -f "GridBlocks-AE (internal, with fonts).zip"
(cd dist && zip -qr -X "../GridBlocks-AE (internal, with fonts).zip" GridBlocks-AE)
echo "built GridBlocks-AE (internal, with fonts).zip"
