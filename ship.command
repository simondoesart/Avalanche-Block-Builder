#!/bin/bash
# Ship: rebuild, package the After Effects download, commit, push → Vercel deploys from GitHub (main).
# The AE zips are NOT committed — they're uploaded to a GitHub Release (needs the GitHub CLI: brew install gh; gh auth login).
# Usage: ./ship.command "v5.22: message"   (the first word is used as the release tag if it looks like vX.Y)
cd "$(dirname "$0")"
bash package.sh || exit 1
MSG="${1:-Ship $(date '+%Y-%m-%d %H:%M')}"
git add -A
git commit -m "$MSG" >/dev/null 2>&1 || echo "(nothing new to commit)"
git push origin main || exit 1
TAG=$(echo "$MSG" | grep -oE '^v[0-9]+(\.[0-9]+)*' || true)
[ -z "$TAG" ] && TAG="build-$(date '+%Y%m%d-%H%M')"
if command -v gh >/dev/null; then
  gh release create "$TAG" downloads/GridBlocks-AE-Mac.zip downloads/GridBlocks-AE-Windows.zip --title "$TAG" --notes "$MSG" --latest \
    || gh release upload "$TAG" downloads/GridBlocks-AE-Mac.zip downloads/GridBlocks-AE-Windows.zip --clobber
else
  echo "!! gh not installed — upload downloads/*.zip to a GitHub Release by hand"
fi
echo ""; echo "Pushed — Vercel is deploying: https://vercel.com/simonjones-9812s-projects/avalanche-block-builder"
