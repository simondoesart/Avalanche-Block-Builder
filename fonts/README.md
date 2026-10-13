# Brand fonts — Aeonik + Aeonik Fono

## Website / browser preview (this folder)
All 21 styles are wired up via @font-face in `src/1_head.html`:
- **Aeonik** — Air, Thin, Light, Regular, Medium, Bold, Black, each with an Italic
- **Aeonik Fono** — Air, Thin, Light, Regular, Medium, Bold, Black (+ `Aeonik-Fono-Roman-VF`, variable, not used yet)

Most files are the official CoType web fonts (.woff2/.woff). **Aeonik Regular, Medium, Bold and Medium Italic** were missing from the web set on hand, so they're temporary `.woff` copies converted from the desktop fonts. Replace them with the official files from the shared drive (`Fonts/AEONIK/Aeonik Full Family Web`) when that folder is available offline — same names, the site picks them up automatically.

## After Effects (`fonts/desktop/`, not on the website, not in git)
The desktop OTFs (Aeonik 14 styles, Aeonik Fono 7 styles + variable TTF). Run `install.command` to copy them into `~/Library/Fonts` (or install with Font Book), then restart After Effects. `fonts/desktop/` is committed (private repo) so a fresh clone can install them; it is left out of the website via `.vercelignore` because the site only needs the web files.
