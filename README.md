# Grid Blocks

A grid-and-blocks motion tool for After Effects. Design a grid, lay out blocks (by hand or from rules),
fill them with Avalanche / blockchain HUD content, animate them with a following camera, add full-frame
transitions, then build it all as real AE layers and keyframes.

It runs in two places from one codebase:

- **Web** (`web/`, hosted on Vercel): design and preview in the browser, then **Export .jsx** and run it in
  After Effects via *File › Scripts › Run Script File…*. Work and saved layouts are kept in the browser.
- **After Effects panel** (`panel/`, CEP): the same UI docked in AE, reading your active comp and building directly.

The default look is the Avalanche HUD style in `examples/default-look_1920x1080.jsx` (dark background,
grey column rules every 4 columns, red 3×1 walk blocks, Aeonik Fono content, camera follow with a reverse
grid zoom, wipe transitions in and out).

## Repo layout

| Path | What |
|---|---|
| `src/1_head.html` | Styles and markup |
| `src/2_host.jsx` | ExtendScript that builds layers in After Effects (ES3) |
| `src/3_app.js` | The app: grid, layout, content, animation, preview, build payload |
| `build.sh` | Assembles `src/` into `web/index.html`, `panel/index.html` + `panel/host.jsx`, and `web/GridBlocks-panel.zip` |
| `web/` | What Vercel serves (`index.html`, `fonts/`, panel zip) |
| `panel/` | CEP extension (manifest, installer) |
| `assets/` | Source text bits and the Avalanche logo SVG |
| `examples/` | Example build script (the default look) |

## Develop

```bash
./build.sh          # rebuild after editing src/
open web/index.html # or serve the folder: npx serve web
```

## Deploy to Vercel

The repo is static — no build step on Vercel (`vercel.json` serves `web/`). Run `./build.sh` and commit before pushing.

- **Dashboard:** vercel.com/new → import this GitHub repo → Deploy (settings come from `vercel.json`).
- **CLI:** `npx vercel` (preview) / `npx vercel --prod`.

## Install the After Effects panel (macOS, AE 2022+)

Download **AE panel** from the site (or use `panel/` from this repo), then double-click `install.command`,
restart After Effects and open *Window › Extensions › Grid Blocks*.

## Fonts

See `web/fonts/README.md`. Aeonik Fono is commercial — add the files only if your licence allows it.
