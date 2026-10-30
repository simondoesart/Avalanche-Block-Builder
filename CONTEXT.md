# Grid Blocks — project context (handoff, v5.21.2 · 30 Oct 2026)

Grid Blocks builds the Avalanche "grid of blocks" motion look. The same code runs in two places:

1. **Web app** (`index.html`): a single self-contained page. It's deployed on Vercel from GitHub `simondoesart/Avalanche-Block-Builder` (branch `main`). The Vercel project is `avalanche-block-builder`.
2. **After Effects CEP panel**: the same `index.html` runs as a panel, plus `host.jsx` (ExtendScript), which builds the comp.

## Getting set up on a new computer

```bash
git clone https://github.com/simondoesart/Avalanche-Block-Builder.git
```

The zip has the working tree. It leaves out the 1.1 GB `.git` history, so clone the repo to get history and to be able to push.

- **Install the AE panel (macOS):** double-click `install.command`.
  - It rsyncs the panel into `~/Library/Application Support/Adobe/CEP/extensions/GridBlocks`.
  - It installs the brand fonts from `fonts/`.
  - It clears the CEP cache.
  - Unsigned panels need `PlayerDebugMode` turned on: `defaults write com.adobe.CSXS.<ver> PlayerDebugMode 1` (the installer handles this).
  - Restart AE, then open Window › Extensions › Grid Blocks.
- **Ship the web app:** run `ship.command`. It runs `package.sh`, commits, and pushes to GitHub, and Vercel deploys automatically. You need git credentials for GitHub on the new machine.
- **Windows:** use `GridBlocks-AE-Windows (with fonts).zip` (its own installer is inside). The Mac zip works the same way.

## Source layout (edit `src/`, never `index.html` directly)

| file | what |
|---|---|
| `src/1_head.html` | All HTML and CSS: panels, modals (build options `bldModal`, media picker `mPickM`, lock ask `lockAsk`, export `expModal`) and the media library UI. |
| `src/0_mux.js` | `GBMux`: an MP4/MOV muxer for WebCodecs H.264 + AAC. `GBSvgCtx`: a fake canvas that records drawing calls into SVG (used for still SVG export). |
| `src/3_app.js` | The whole app (~8k lines) inside `window.__gbMain`: engine, render, UI, export and payload. |
| `src/2_host.jsx` | The ExtendScript AE builder (ES3, so no modern JS). Main function `GB_build(payload)`. Also media relink, file dialogs and save helpers. |
| `build.sh` | Concatenates everything into `index.html` and `host.jsx`. |
| `package.sh` | Builds the Mac and Windows zips (with fonts) into the project root and `downloads/`. |
| `CSXS/manifest.xml` | CEP manifest. **Bump `Version="x.y.z"` every release.** It includes `--enable-nodejs` (needed to write exported files to disk). |
| `api/assistant.js` | Vercel serverless proxy for the in-app Claude assistant. |
| `media/` | The sample clip and image used as placeholder block media. |
| `fonts/` | The Aeonik / Aeonik Fono web fonts plus desktop fonts. |
| `v2/`, `v3.60/`, `v4.0/`, `v4.12/` | Frozen older versions, kept for reference. |

Workflow each round: edit `src/`, run `bash build.sh`, test, bump the manifest version, run `bash package.sh`, then `git commit`. After that, run `install.command` (AE) and `ship.command` (web).

## Core concepts in `3_app.js`

- **The document is `D`.** It's merged over the defaults `DEF` by `setDoc`/`merge()`. `merge()` keeps unknown keys and per-block maps, so saves round-trip everything.
  - `U` holds UI state; it isn't saved.
  - `getP`/`setP` are the path helpers used by every `data-bind`, `data-seg`, `data-pal` and `data-show` element in the HTML.
- **Two layers.**
  - Layer 1 is `main`; Layer 2 is `l2`. The per-layer keys are `LAYER_KEYS` (block, rand, anim, fill, bmedia, exit, echo, num, blocks, blockColors, grid).
  - The inactive layer's values are stored in `D.L2.store`. `swapLayer()` swaps them, `withLayer(name, fn)` runs code against a given layer, and `curLayer()` tells you which is active.
- **`plan(G)`** is the cached animation plan, keyed by `JSON.stringify(D)` and kept in the `PLANS` map.
  - It contains: `seq` (blocks in order), `T` (reveal times), `cam`, `zs`, `pan` and `zc` keys, per-block `tracks`, `echo`, `gaps`, and `fillBase`/`fillEnd`.
  - `geom()` returns the grid geometry `{W,H,R,C,s,p,gut,x0,y0}`.
- **Animation styles** (`D.anim.mode`): `static`, `reveal`, `camera` (camera follow) and `push` (conveyor).
  - In Static mode, a generated walk is still shown fully built with no camera move (`staticWalk()`). This change was made so still exports show the blocks.
- **Layer 1 walk.**
  - `extensionRaw`, walk presets, and timed walk sections (`D.anim.walkSec`).
  - Room for zoom: `zoomRoomFn`. Nudge re-routing: `routeNudge`.
- **Layer 2 beat blocks.**
  - `beatPlace` with `D.L2.bb`: camera follows the line or layer 1; per-block anchor, scale, adj, per; `MINH` minimum height; bleed and vertical damping.
  - The dim layer (`dimComp`).
- **Locking.** `D.anim.frozen` holds baked block shapes. `lockLayer` and `lockOnSave` lock blocks so later edits don't move earlier ones, and the lock bar shows which blocks are locked.
- **Content.**
  - **Text HUD** (`D.fill`): auto-fill blocks with text, graphs, icons, combos and patterns. Timing lives in `fill.anim`.
  - **Text between blocks** (`D.fill.gap`): fills empty grid areas with the *same generator*, using its own look in `fill.gap.style`.
    - `FILL_STYLE_KEYS` lists the swapped keys. `withGapStyle(fn)` swaps the style in temporarily, and `gapFillArea` runs `fillItems` with `GAPV=true`.
    - The UI is contextual: when the **Between blocks** tab is open (`gapEditing()`), `getP`/`setP` redirect `fill.*` style paths to `fill.gap.style.*`, and the Text HUD style group (`#hudStyleGroup`) is moved into that tab.
    - The amount, shuffle and timing settings are in `fill.gap.*`.
  - Also: block numbers (`D.num`), echoes (`D.echo`) and block text.
- **Media.**
  - The library `D.bmedia.assets` is persisted in IndexedDB (`mStore`/`mLoad`/`mRestore`).
  - Per block: `D.bmedia.per[id] = {asset, more:[…], offs:{…}}`, where `asset` is the top clip and `more` are the clips underneath.
  - The block media card has thumbnails, drag to reorder, replace and remove.
  - In AE, `GB_findMedia`, `GB_checkPaths` and `GB_relinkFolder` relink footage, crawling `D.mediaLib`/`D.mediaDir` and their subfolders. There's an optional manifest of media names.
- **AE build.**
  - `payload()` returns JSON, which goes to `GB_build` in `host.jsx`.
  - Build options per layer (`bldAsk`/`bldMake`/`bldApply`): blocks, text, numbers, gaps, echo, media, dim, and block comp mode **A** (plain block), **B** (media precomp parented to the block) or **C** (block precomp). There's also one media precomp per block, plus shared or individual dimmers.
  - Precomps are named and organised into folders.
- **Export.**
  - `exportVideo`: MP4 (H.264 + song audio) or MOV (PNG frames, with alpha), with a layer picker.
  - `exportStill`: PNG (optionally transparent) or SVG (through `GBSvgCtx`).
  - **"Centre the column rules"** (`ruleCentring`, `EXP.shiftX`) nudges the frame sideways by up to half a rule gap so the margins from each edge to the nearest rule are equal.
  - In AE, exports are written to disk through node `fs` (`expSink`).
- **File naming.** `projName()` / `projFile(kind, ext)` create auto-numbered names (`D.projName`, `D.saveN`). Saves go to the folder chosen in `saveDir()`.

## Testing (headless, node)

- `tests/t/run.js index.html <script.js>` evals the app in a DOM mock (`tests/t/dom.js`) and hands `window.__T` (the exposed internals) to the script.
- The main regression scripts are in `tests/scripts/`:
  - `qa.js`: 127 scenarios.
  - `qa2.js`: 39 checks.
  - `aemock.js`: runs `host.jsx` against a proxy AE object model and checks for expression errors.
  - `rc.js`: rule-centring margins.
  - `gl6.js` / `aeg.js`: text between blocks.
- Paths in the scripts point at the old sandbox (`/sessions/vibrant-tender-fermat/...`), so fix them for the new machine.
- The mock has no real canvas, so check text placement in SVG and the overall look in a real browser.

Run one with: `node tests/t/run.js index.html $PWD/tests/scripts/qa.js`

## Recent history (latest first)

- **5.21.2:** Text between blocks always has its own look. The "Own look" checkbox, the old module list and the gap colour picker were removed.
- **5.21.1:** Content controls follow the active tab and the active layer; there's no separate edit mode.
- **5.21:** Text between blocks got the full Text HUD controls. Fixed: each layer now draws its own between-blocks text (layer 2 had been drawing layer 1's).
- **5.20.1:** Static mode shows the generated walk fully built (canvas and stills). The block-size picker grew to 12×6; the W/H number fields go up to 60.
- **5.20:** Still export option "Centre the column rules", with a margin/spacing readout.
- **5.19.x:** PNG/SVG still export. SVG text is positioned from canvas metrics; no clip groups.
- **5.18 and earlier:**
  - media library v2 (thumbnails, per-block clip stack, offsets, relink, manifest);
  - AE build options (A/B/C comp modes, dimmers, folders);
  - locking on save;
  - MP4/MOV export;
  - walk presets and sections;
  - layer 2 beat blocks, zoom and dim.

## Known caveats / ideas not done yet

- **Static mode in the AE build** still builds only the hand-placed blocks, not the generated walk.
- **Possible next step from the column-spacing request:** an exact pixel margin or column-width control. Today the rule spacing comes from Rows / Gutter / "rule every N columns", and stills can centre the rules.
- **Old projects:** text between blocks takes a copy of that layer's Text HUD look the first time it's drawn, so it will look different from how it was saved.
- **Gap density:** each gap area gets the full HUD generator, so lower Amount if it's too busy.
