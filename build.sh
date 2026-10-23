#!/bin/bash
# Assembles src/ into the single-file panel index.html
cd "$(dirname "$0")"
{ cat src/1_head.html
  echo '<script type="text/plain" id="host-src">'; cat src/2_host.jsx; echo '</script>'
  echo '<script>'; cat src/0_mux.js src/3_app.js; echo '</script>'
  echo '</body></html>'; } > index.html
cp src/2_host.jsx host.jsx
echo "built index.html"
