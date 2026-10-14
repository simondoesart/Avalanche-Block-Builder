# Grid Blocks — After Effects panel (v1.1)

## Try it in a browser
Open `index.html` in Chrome. Work through the six steps, then **Export .jsx** and run it in
After Effects via **File › Scripts › Run Script File…**

## Install as an AE panel (macOS, After Effects 2022 or newer)
1. Double-click `install.command` (if macOS blocks it: right-click › Open).
2. Restart After Effects › **Window › Extensions › Grid Blocks**.

The panel follows the active comp, autosaves your work, and keeps a layouts library in
`~/Library/Application Support/GridBlocks/`.

## The steps
1. **Grid**: comp size, rows, gutter, margin, columns, off-screen area, look
2. **Blocks**: pick a W × H block size, then Select (V), Stamp (S), Draw (B), Unmerge (E) by hand or generate from rules · Clear layout
3. **Content**: text inside blocks
4. **Animate**: Reveal, Camera follow, Conveyor · Keep building (repeat or continue the pattern) · same-column grouping · speed ramp · smooth / step / stop-motion · grid size over time · live preview (P)
5. **Timing** · 6. **Transitions**: full-frame block transitions in and out, as coloured blocks or a white matte precomp
7. **Lab** · 8. **Build**: layers + keyframes in one undo step

## What gets built
| Layer | Notes |
|---|---|
| GB · Background | solid |
| GB · Grid Lines / GB · Tiles | shape layers; in Camera mode they're parented to **GB · Grid Wrap**, which loops with an expression so the grid never runs out |
| Block 01… | shape layers, anchor centred; comment holds order/col/row/size |
| Block 01 · Text | parented to its block |
| GB · Camera | **AE camera rig (default):** a real one-node camera. Grid, tiles, blocks and text are 3D layers; the background stays 2D. Camera X/Y follow the blocks, Z dollies back when the grid gets denser |
| GB · Conveyor | null the blocks ride on in Conveyor mode |
| 2D null rig (optional) | the v0.3 behaviour: a null moves instead of a camera |
| GB · Zoom | only when the grid size changes over time; scales everything around the comp centre. Grid lines become stroked paths whose width is held constant by expression |

Everything is tagged `GridBlocks:` in the layer comment, so rebuilding replaces it cleanly.

## Shortcuts
V S B E O H tools · M merge · Del delete/unmerge · D duplicate · arrows nudge (Shift = block width) ·
G generate · R shuffle · P play · F fit frame · Shift+F show off-screen · Space-drag pan ·
⌘/Ctrl-scroll zoom · [ ] previous/next step · ⌘Z / ⇧⌘Z · ⌘S save layout

## Editing the code
Source is in `src/`. Run `./build.sh` to rebuild `index.html`.

## Tips
Click the ? in the header to show or hide help tips. Drag the white handles on a selected block to resize it.

## New in v0.4
Fonts (full installed list in AE 2024+), leading, tracking, kerning, case · Walk pattern with paired blocks · Ending: count / loop to comp end / end on a chosen square · Steady and Step camera moves with a drag-able easing curve · Paint tool (C), palette editor, colour-mix rules · Loop toggle on the preview

## New in v0.5
Scene pacing curve (replaces the speed ramp; changes only when blocks start, never the speed of their content) · camera never runs ahead of revealed blocks · end-spot framing (put the last block anywhere in frame) · column rules every N columns, on top or under blocks · easing presets now show as selected and update immediately · Reset on every curve and for all animation settings · Shift/⌘ snaps curve handles to 0/45/90°

## New in v0.6
One scene clock: set **Starts** (seconds, negative = already running at frame 0), **Length** (or run until the comp ends) and **Blocks to reveal**. The scene easing curve drives both the reveals and the camera, and everything comes to rest exactly at the end of the scene. Blocks always appear one at a time, in order. The scene start is also on the preview timeline.

## New in v0.7
Number of blocks can **fill the scene length** at a chosen pace (shorter scene = fewer blocks), or be an exact number. The scene easing curve now re-times everything together — block arrivals, how fast each block reveals, the camera and grid changes — and all of it finishes by the end of the scene. The camera glides steadily from block to block and never moves ahead of what has appeared.

## New in v0.8
Scene start and length are in frames, and frame rate now lives on the Animate step. Picking an end spot switches to the Pan tool so you can find the square, then back to Select. The end spot no longer changes how many blocks there are: your blocks are spaced out so the last one lands on it. A badge on the canvas always shows which tool is active.

## New in v0.9
**Echo** is now its own layer behind each block (Layout step): any offset including overlaps, fill, stroke inside/centre/outside, dashes, opacity, lead/trail timing with appear and fade/cut out, and an "eligible for content" flag. **Walk** mixes in stairs, jumps and pairs. **End on a chosen row**: the end column comes from the grid rules, you pick the row, no gaps. **Order** R→L, T→B and Random now work (camera follows the block furthest along). **Manual order** shows the whole grid with the frame and 90% safe area; click blocks (or the dashed continuation) to build the sequence, with grid size controls right there.

## New in v1.0 — block content
Content step › **Auto-fill blocks**: each block gets a HUD layout built from the Avalanche text bits (key/values, status, TO/FROM hashes, block data, log lines, counters, dev text with ellipses, barcodes, phrases, terms, dot patterns, ring icons). Density, mono font, size, colours, and a share of outline-only blocks. **Content animation**: type-on, animated ellipses, count-up numbers, scrambling hashes (settle or keep changing), delay and stagger, all built as Source Text expressions in AE. **Text between blocks** fills empty grid areas. Per block: turn auto-fill off or re-roll. Echoes marked "eligible for content" are filled too.

## New in v1.1
Avalanche logo as a random element (in blocks and gaps), with icon frequency and size controls (the ring is smaller and rarer by default). Content **comes on** (type on / fade / cut) and **goes off** (stays / fade out / type off / cut) with delay, stagger, hold and length. New **Transitions** step: blocks tile the whole frame and clear away (in) or build up (out), with pattern, direction, easing, block size, cover-the-gutters, and output as blocks or a matte precomp.

## New in v1.3
**Smoother camera.** Glide follows a point that trails the newest block and is smoothed with a critically-damped filter, so speed builds and fades without kinks and the camera can never get ahead of a revealed block. After the last reveal it keeps its pace and then eases to a complete stop exactly on the last frame (Settle). **Feel** presets (Tight / Balanced / Floaty / Drift) set follow distance, smoothness and settle together; the speed graph shows the result. **Step & settle** now merges bursts of fast reveals into one move and gives each move most of the gap, so it no longer stutters.
**Motion blur.** Build › Motion blur (on by default, 180° shutter) switches on comp and layer motion blur in AE. The preview shows the same blur (timeline › Motion blur) and plays real frames, like AE.
**Smaller things.** Each step opens on its own tool; "0 = auto" fields show *auto* / *all*; Camera section has collapse + reset.

## New in v1.5
**When blocks appear** (Animate › Block reveal, camera modes): *When the camera arrives* (new default) holds each block back until the camera has carried it into the **reveal zone**, so you always see it pop in on screen instead of off to the side. The zone (dashed green box on the canvas) is set as a % of the frame — Centre, Near centre, Inside, On screen presets — with a separate height when the camera also moves up/down. *Ahead of the camera* keeps the previous behaviour. Delayed reveals still finish by the end of the scene.

## New in v1.6 — a clean After Effects build
Build › **Organise in After Effects** (all on by default):
- **Precomp the grid** (tiles, lines, rules) and **Precomp blocks & content** — each lands as one layer, collapsed + 3D so the main AE camera still drives everything inside. Expressions inside precomps point at the main comp's camera by name (AE updates them if you rename the comp).
- **Precomp each transition** — one layer per transition instead of dozens of tiles; matte transitions were already precomps.
- **Project folder** — precomps and the background solid are filed under *Grid Blocks › comp name*.
- **Hide helper nulls** — wrap/framing nulls are shy and the comps hide shy layers.
- **Trim layers** — blocks, echoes, content and transition precomps start where they first appear.
- **Markers** — *GB · Scene start / Scene end / Transition in / Transition out* on the main comp.

Typical main comp: `GB · Camera`, `GB · Transition Out`, `GB · Transition In`, `GB · Blocks`, `GB · Grid`, `GB · Background`. Content layers are named after their block (*Block 07 · INITIALIZING*), gap content starts with *Gap ·*. Rebuilding (with *Replace the previous build*) removes the old precomps, unused solids and GB markers too. The Build step shows the resulting timeline and Project panel before you build. Grid/block precomps need the AE camera rig; the 2D null rig stays flat.

## New in v1.7 — overlay toolkit
- **Avalanche brand defaults** (2026 kit): `#1F1F1F` background, Avalanche Red `#E6212F` blocks, slate `#A2AFB2` second colour, steel `#3B484B` rules, and the brand palette (reds, slate/steel, darks, light `#EBF0FA`, blues). The retired `#E84142` is gone, including from the UI. **Defaults** button in the top bar resets everything (one undo step).
- **Camera › Let go before the end**: the camera follows for X% of the scene, then coasts to a stop (keeps its speed and lets it bleed away) while new blocks keep arriving and run off frame. Marked on the speed graph.
- **Block exit** (Animate): un-reveal blocks for overlays — *after a hold* (a travelling trail), *behind the camera* (once they pass an exit line) or *all at the end* (staggered, first-in-first-out or reverse). Cut / fade / wipe (onward or back) / scale, own length and easing. Content, numbers and echoes leave with their block; AE layers are trimmed to their exit.
- **Block numbers**: a text layer in each block's top-right corner (01 · 001 · #01 · BLK 001 · block height #4,812,337), start value, size, colour, opacity; per-block on/off in the inspector. Auto-fill content keeps clear of the corner.
- **Content**: 7 new modules (mempool, validators, latency/TPS, RPC calls, progress bars, consensus, hex stream), a 14-icon line-icon set (node, block, chain, check, speed chevrons, peak, lock, network, signal, target, snow, arrow, plus, bars) built as shape layers in AE, dot size + round/square dots, icons/hex/RPC in the gaps.
- **Lab** step (experiments, all off by default, each labelled with its status): signal flicker, landing pulse, momentum trails, finality bar, transaction ticker (expression-driven text layer), snow drift (expression-driven shape layer).
- **Essential / All controls** switch in the step header hides fine-tuning controls so each step is calmer.

## v1.7.1
Starts from a **blank canvas**: `#1F1F1F` background, 7 rows, bleed, Avalanche brand colours, no blocks, rules, transitions or grid zoom. **Defaults** (top bar) and **Clear › Everything** go back to that. The old starter look lives in **Clear › Load the Avalanche HUD example**.

## v1.7.2 — brand fonts
**Aeonik** (Air → Black) and **Aeonik Fono** (Thin → Black) are built into the font pickers, even when AE's installed-font list doesn't include them. Block text defaults to Aeonik Black; HUD content, numbers and the ticker use Aeonik Fono. The Content step shows **✓ / ✗** for each family (AE: installed fonts; browser: installed locally or present in `fonts/`), and a build warns if AE can't find a font it was asked to use. See `fonts/README.md` for file names; `install.command` copies any `.otf/.ttf` in `fonts/` into `~/Library/Fonts`.

## v1.7.3
Aeonik web fonts added in `fonts/` (17 static faces + the variable Fono) and wired into the preview; Aeonik upright Regular/Medium/Bold weren't in the web set (see `fonts/README.md`). Content step reorganised into collapsible sub-sections (What appears · How much · Text · Dot grid · Outlines & extras; Comes on · Goes off · Text effects) with **Shuffle content** at the top; Camera split into How it moves · Let go before the end · Speed graph. Open/closed state is remembered.

## New in v1.8 — timing
- **Timing step** (after Animate) with a **timeline under the canvas**: Sound · Scene (with its easing) · Camera speed · every Block from reveal to exit · Content on/hold/off · Transitions. Drag handles to change the scene start/end, camera let-go, block/content holds, clear-out start and transition in/out; click to scrub.
- **Retime everything**: ×0.5…×2 or "scene length to N s" / "fit to the comp" stretches the whole piece (scene, reveals, camera, exits, content, transitions, Lab) and keeps every relationship.
- **Sync to sound**: load audio or video (plays with the preview; video can sit behind the grid), beats are detected automatically (strictness + min gap), and **Snap block reveals to the cues** puts one block on each beat. In the AE panel, **Use the AE timeline** reads comp + audio-layer markers and (optionally) the beat of the first audio layer (via Convert Audio to Keyframes, removed afterwards).
- **Content animation** is now **Animate on · Hold · Animate off**. Hold can **keep it alive**: numbers tick (block heights climb, % wobble), hashes keep scrambling, letters glitch — at a set rate — in the preview and as AE Source Text expressions.

## v1.8.1 — fonts
Full Aeonik + Aeonik Fono families on the website (21 styles) and the desktop OTFs in `fonts/desktop/` for After Effects (`install.command` installs them). See `fonts/README.md`.

## New in v1.9
- **Camera › Follow the easing** (new default): the camera travels the line at exactly the pace of the Scene easing curve (fast-start curves start fast). Blocks are revealed as the camera brings them to the reveal line. *Glide behind* (the old mode) still trails the blocks and always eases in.
- **Timeline** is easier to read: a legend in the Timing step, plain-English hover readouts for every row, bigger handles, live values while dragging, timecode on the playhead.
- **Assistant** (✦ in the top bar): ask Claude to build a look or troubleshoot. It reads the current setup, changes settings, generates layouts, retimes and plays the preview — every change is one ⌘Z.
  - **Website (Vercel):** add `ANTHROPIC_API_KEY` in Vercel › Settings › Environment Variables; requests go through `api/assistant.js` so the key never reaches the browser. Optional `ASSISTANT_PASSCODE` makes the team enter a passcode once.
  - **AE panel / local file:** open the assistant's ⚙ and paste a personal Anthropic API key (stored only on that machine).

## v1.9.1
- **Walk-off reworked:** after the build holds, the line keeps walking — new blocks keep arriving, the camera picks up again, the oldest blocks fall away leaving a short trail, then the camera lets go and the line runs off screen (Hold, Keeps walking, Trail, Pace, Camera follows %).
- **Column rules** controls in Block exit, with **Stay / Fade off** (starts with the walk-off, adjustable start and length; keyed in AE).
- **Space** = play / pause (hold Space and drag still pans).
- **Timing › Pace & holds:** block rhythm with a live readout of block count and camera speed, a one-click "pair the camera to the blocks", and every hold (build hold, per-block hold, clear-out, content hold) in one place. Retime also scales the walk-off and rule fade.

## v1.9.2
Walk-off is now a true "snake": when the walk starts, the surplus older blocks peel away (oldest first) so only the **Trail** follows the head; from then on a block leaves the moment the block *Trail* places ahead of it lands. The camera travels with the line for **Camera follows for** frames, then coasts to a stop — and the line keeps walking until the head and its whole trail have left the frame.

## v2.0 — Timing owns the timing
- **Animate** is now just where blocks go and how they appear / leave (style, camera movement, reveal, exit style, keep building, order, grid size). A note links to Timing.
- **Timing** holds everything about *when*: Scene (fps, start, length, number of blocks / pace, easing, motion), **After the build** (Stay · Walk off · Each leaves · Behind camera · Clear out, with their holds), Camera timing (let go), Pace readout + camera pairing, Retime, Sync to sound.
- **Timeline Phases row:** Build · Hold · Camera follows · Walks off (or Clear-out), each labelled with its duration. Drag the red handles to set the build, the **white handle to set the hold**, the blue one for how long the camera follows.
- **Last block on time:** with "Follow the easing", every block appears the frame the camera brings it to the reveal line, and build blocks are always in by the end of the scene.

## v2.1 — multi-point scene easing
**⤢ Big editor** on the Scene easing curve (or double-click the small graph): a large graph where you click to add points, drag them, and double-click / Alt-click to remove them. The curve runs smoothly through the points without overshooting; a speed strip underneath shows fast and slow parts, and tick marks show when blocks land. Presets: Ease in-out, Fast start long settle, Burst-hold-burst, Slow build punch, Two-step; "Simple curve" goes back to the two-handle version.

## v2.2 — bezier handles in the big curve editor
Every point has bezier handles (like AE's graph editor). A two-handle curve opens as exactly the same curve; clicking the line adds a point by splitting the curve without changing its shape. Drag points or handles (handles stay linked; Shift = flat). Hold **⌥** for the convert tool: ⌥-click a point toggles corner ↔ smooth, ⌥-drag a point pulls out new handles, ⌥-drag a handle breaks it from its partner. Double-click a point to remove it. ⌘Z inside the editor only undoes curve edits.

## v2.3
- **Column rules parallax** (Grid › Column rules and Block exit › Column rules, camera follow): 100% = locked to the grid, lower drifts slower (further back), higher faster. Built in AE through the rules' wrap expression.
- **↻ Shuffle the walk** (Animate › Keep building, Timing › Pace): a new random continuation of the pattern without touching your layout.
- **Big curve editor floats** at the bottom right instead of covering the screen: the preview stays visible and **Space / ▶ plays** while you shape the curve.
- **Edit blocks from the timeline:** click a block in the Blocks row to select it (the playhead jumps to it), **Delete** removes it (generated blocks are skipped, layout blocks deleted), **⇧Delete** cuts it and everything after it from the build; the **yellow handle** at the last block drags left to drop late blocks — the blocks you keep don’t move in time. "Bring back skipped blocks" restores them.

### v2.3.3
- Block size and Layout merged into one **Blocks** step, with a **Clear layout** button.
- Stamp slides to the nearest spot that fits instead of refusing; tool buttons react on press.
- Panel draws immediately and no longer waits on After Effects before it becomes clickable.
- Grid lines on by default. Startup errors show in a red box; `.debug` enables Chrome debugging on port 8088.
