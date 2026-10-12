#!/bin/bash
# Builds the single-file app from src/ into:
#   web/index.html            → the hosted site (Vercel serves /web)
#   panel/index.html + host.jsx → the After Effects CEP panel
#   web/GridBlocks-panel.zip  → panel download linked from the site
set -e
cd "$(dirname "$0")"
build(){ { cat src/1_head.html
  echo '<script type="text/plain" id="host-src">'; cat src/2_host.jsx; echo '</script>'
  echo '<script>'; cat src/3_app.js; echo '</script>'
  echo '</body></html>'; } > "$1"; }
build web/index.html
build panel/index.html
cp src/2_host.jsx panel/host.jsx
rm -f web/GridBlocks-panel.zip
( cd panel && zip -qr ../web/GridBlocks-panel.zip . -x '.DS_Store' && cd .. )
# fonts go to the panel zip too only if you add them to panel/fonts yourself (licensing)
echo "Built web/index.html, panel/, web/GridBlocks-panel.zip"
