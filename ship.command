#!/bin/bash
# Ship: rebuild, package the After Effects download, commit, push → Vercel deploys from GitHub (main)
cd "$(dirname "$0")"
bash package.sh || exit 1
git add -A
git commit -m "${1:-Ship $(date '+%Y-%m-%d %H:%M')}" >/dev/null 2>&1 || echo "(nothing new to commit)"
git push origin main && echo "" && echo "Pushed — Vercel is deploying: https://vercel.com/simonjones-9812s-projects/avalanche-block-builder"
