# Grid Blocks — After Effects panel (v1.1)

## Try it in a browser
Open `index.html` in Chrome. Work through the six steps, then **Export .jsx** and run it in
After Effects via **File › Scripts › Run Script File…**

## Install as an AE panel (macOS, After Effects 2022 or newer)
1. Double-click `install.command` (if macOS blocks it: right-click › Open).
2. Restart After Effects › **Window › Extensions › Grid Blocks**.

The panel follows the active comp, autosaves your work, and keeps a layouts library in
`~/Library/Application Support/GridBlocks/`.

## How v3 works
The **timeline** under the canvas is the main screen. The **rail** on the left picks a step; the **properties panel** on the right shows that step — or, when you click something on the timeline, just that thing's settings.

1. **Setup** — comp, grid, look, column rules
2. **Blocks** — pick a block size and **Generate** a walking line from a seed (↻ New seed for another). It stays live until you drag a block on the canvas; then the line becomes normal, editable blocks with the same timing.
3. **Motion** — camera, how blocks appear, what happens after the build, how they leave, order, grid size over time
4. **Content** — overlays in tabs: Text HUD · Between blocks · Numbers · Echo · Your text
5. **Transitions** — in & out. **Walk** transitions sit on the scene's grid and sweep the way the line walks, in your block colours.
6. **Lab** — experiments
7. **Output** — build into After Effects / export .jsx

### Timeline
- **Scene** row: the red Build bar (drag its ends) with the easing drawn on it — drag the white points / coral handles, click the line to add a point, ⌥-click a point to remove it, double-click for the big editor.
- **Camera** row: speed, and the let-go handle. **Transitions**: drag the clips. **Content** rows: one per overlay.
- **Blocks**: one row per block. Drag a bar to retime that block (⇧-click to select several), drag its right end to change when it leaves, right-click for more. ⌥←/⌥→ nudge by a frame, Delete removes, ⇧Delete removes it and everything after.
- Ruler: drag to scrub. ⌘-scroll to zoom, scroll to pan, ⇧F to fit. Esc goes back to the layout view.

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

### v3.0
- Timeline-first redesign: rail of steps, contextual properties panel, full-height resizable timeline.
- Generate the line from a seed, then edit any block; per-block timing offsets (anim.dt / anim.dx) built into AE.
- Inline scene-easing editing on the timeline; transition clips you can drag; content overlay rows and tabs.
- Walk transitions aligned to the scene grid, using the block colours.
- v2.3.3 is kept at `v2/index.html` (and git tag v2.3.3).

### v3.1
- Walk-off now lives inside the scene: the Scene bar is Build · Hold · Walk · Walks off, and the scene easing shapes all of it. Turning Walk off on lengthens the scene so the build keeps its pace.
- Timeline blocks: drag the bar to move the whole block (in and out together), its left end for when it comes in, its right end for when it leaves. The playhead follows so you see the change; a dashed outline shows where it was. The view no longer re-fits while you edit (⇧F fits).
- Select several blocks: drag a box in the block rows, ⇧-click for a range, ⌘-click to add/remove.
- Easing: double-click (or click the line) on the Scene row to add a point; hold ⇧ while dragging a handle to keep its angle (also in the big editor).
- Motion: Block reveal / After the build / Block exit are one "Blocks in & out" panel (In · Then · Out). Click the Blocks row on the timeline to open it.

### v3.2 — Scene as a time-remap layer
- The blocks now run on their own steady clock in three phases: **On** (the build) · **Hold** · **Off** (walk-off / exits). They show as the "Blocks · on hold off" row; drag the phase handles to change each.
- The **Scene** row is a layer on top, like time remapping a precomp: its length is the scene length (empty = the blocks play at their own speed) and its curve maps scene time onto the block timeline — flat = hold, steep = fast. Everything is re-timed through it: reveals, exits, camera, grid changes, content start/end, Lab. Transitions stay on real time.
- Per-block timing offsets are on the blocks' own clock.
- Known gap: sound/marker sync snaps on the blocks' clock, so with a non-linear scene curve the snapped reveals won't sit exactly on the beats.

### v3.3
- The Blocks row (On · Hold · Off), camera, content and block rows are drawn on the blocks' own clock, so changing the scene length or curve never changes their widths or proportions. The Scene row and Transitions sit on scene time above them.
- The playhead shows both: scene time at the top, and a dashed line where that lands on the blocks' clock underneath.

### v3.4
- Timeline toolbar: zoom out / zoom slider / zoom in / fit (⌘-scroll still zooms), and **Length** — the comp length in seconds, with the frame count next to it.

### v3.5
- Scene row is taller; the remap curve can't go backwards or overshoot (points stay between their neighbours, handles can't push past the next point).
- Markers on the curve show when **On is done** and when **Off starts** in scene time.
- Right-click the Scene row: Linear · Ease in-out · **Ease each phase** (a point at each phase boundary, easing through each).

### v3.6 — Camera moves with the blocks
- Camera "With the blocks" (default): steady on the blocks' clock while the line builds or walks, still while it holds, with a short ease at each start/stop (Smooth starts, frames). All speed changes across the scene now come from the Scene curve — the curve *is* the camera's speed control.
- The Camera row labels what it's doing: waits for the line · moves with the build · holds · moves with the walk.

### v3.7 (UX workshop mode)
- Only the **Setup** step is shown while we go through the steps one by one (`VISIBLE_STEPS` in src/3_app.js). Add `?steps=all` to the URL, or set localStorage `gridblocks.steps` = `all`, to see every step.
- Blocks step: the canvas always shows every generated block (no camera), wherever the playhead is — except while playing. Stamping shows where the block will land.
- Generate always picks a new seed.

### v3.8
- The grid is effectively infinite: no more Off-screen area setting. Blocks can sit anywhere; the canvas draws grid wherever you look (pan/zoom out to see more). "Show whole area" (⇧F on the canvas) frames 2× the frame, grown to fit every block.
- The AE build only lays down grid as wide as the frame plus the blocks (or the camera's travel), not the infinite range.

### v3.9
- Workshop mode: **Setup** and **Blocks** are visible.
- In the Blocks step, generated blocks draw solid (they're the line you're editing); walk-off blocks stay ghosted.

### v3.10
- Walk with tall blocks (3×2, 3×3, 2×2…): each next block either sits beside the last or steps a whole block height up/down, so it always touches at a side or a corner (no more half-block offsets). Stair runs and jumps step by the block height too; 1-row blocks still wander up to the Wander setting.

### v3.11
- Tall blocks that don't have room to step a whole block up/down inside the frame (e.g. 3×5 in 7 rows) now run partly off the top/bottom — cropped by the frame, with at least half the frame's rows covered — so the line still climbs and falls instead of staying flat.
- All walk moves (steps, stairs, jumps, pairs, ending on a chosen row) stay on whole-block steps for tall blocks; checked 210 generated lines across sizes with no overlapping blocks.

### v3.12
- Pairs (two blocks in one column) are only kept when the extra block touches the block before or after it in the line, at a side or a corner — no more floating blocks with a gap above/below.

### v3.13
- Pair gap now defaults to the block's own height (3×2 pairs leave a 2-row gap, 3×1 a 1-row gap). "Pair gap" is an advanced setting (All controls) — leave it empty for auto, or type a number of rows. Older layouts with the old default of 1 switch to auto.

### v3.14
- **Last block settles** (Blocks › How many, camera styles): the camera carries the line on until the last block of the build sits at the centre (or left/right of centre), instead of stopping the moment it reaches the reveal line. The last block now appears on the beat, inside the frame, rather than popping in late at the right edge. "At the reveal line" gives the old behaviour.

### v3.15
- Ending "On a chosen row": when blocks are dropped (removed on the timeline, or cut with the yellow end handle), the whole line slides up or down so its new last block still lands on that row. Blocks pushed past the top/bottom are cropped by the frame. Making the line editable keeps it where it's drawn.

### v3.16
- **Pick start spot** (Blocks › Generate): click a square and the line's first block goes there — on or off frame. It's marked START on the canvas, kept through Generate / New seed, and **Auto** goes back to starting at the frame edge on a random row.

### v3.17
- Select (V): click a block — generated or not — to select it; a plain click on an empty square just deselects (no stray one-square "block"). Selecting no longer flips you out of a scrubbed preview.
- Draw, Unmerge and Stamp now work on a generated line (it becomes editable first).
- Colour, simplified: one line colour in the Blocks step (second colour / mix / palette are under All). Select one or more blocks and pick a colour on the right — works for generated blocks too, with "Back to the line colour". The Paint tool is gone.

### v3.18
- Ending on a chosen row + dropping blocks (yellow end handle or Delete): the line now keeps its start and **re-walks the last 30%** of the build so the new last block lands on the end row (columns stay put; the walk-off follows the new end). Advanced (All): "When blocks are dropped" — Re-walk the end / Slide the whole line — and the Re-walk %. If 30% can't reach the row, it re-walks as much as it needs.

### v3.19 — Colour modes
- Blocks › Colour: **One** · **Up / down** (level, stepping-up and stepping-down colours) · **Cycle** · **Random** — Cycle and Random come in **Duo / Tri / Quad**. Applies to the whole generated line live (pairs take their column's colour); colours picked for single blocks always win. Random reshuffles with New seed.

### v3.20 — Content v2: looks, graphs, pixel icons, combos
- **What appears** redesigned: six looks (Dashboard, Terminal, Charts, Iconic, Network, Minimal), 🎲 Randomize everything, and a Text / Graphs / Combos mix per block corner.
- Twirl-downs per category (Text readouts, Graphs, Icons, Combos, Patterns), each with All and 🎲.
- **Graphs:** line, step, area, bars, volume, candles, meter, heat grid, network, waveform, order book. They draw on, grow and pop in with type-on; graphs scroll while holding.
- **Pixel icons:** 28 original hard-edge icons on a 12 px grid. They snap to crisp sizes and build pixel by pixel. The line set is still available.
- **Combos:** stat (icon + big counting number), status badge, icon row (active icon blinks), label + graph, viewfinder frame.
- **Patterns:** dots, crosses, hatching, scanlines. They wipe in.
- **Extras & effects:** outlines, plus the Lab effects (flicker, pulse, trails, finality bar, ticker, snow).
- **After Effects:** each graphic is one shape layer. Builds use group opacity, Trim Paths and scale expressions; live graphs use a createPath expression (AE 2018+).
- Tooltips: one styled tooltip everywhere (no more doubled native tooltips).

### v3.21 — Block text, between-blocks timing, layer colours
- **Content → selecting a block:** the side panel shows block colour, a text field, **Use the global text style** (on by default; untick for text settings on that block only) and the text colour. Works on generated blocks too: typing makes the line editable (⌘Z undoes).
- **Between blocks** has its own timing: start after its nearest block, spread, animate on / hold / off, leave with its block. On the timeline, drag the amber knobs to move the start and change the hold.
- Each timeline layer has its own colour: Text HUD red, Between blocks amber, Numbers blue, Echo teal.

### v3.22 — Motion step back
- Motion is visible again (Setup → Blocks → Motion → Content).
- Removed what the timeline now covers or that no longer applies: Glide-behind camera + its feel/follow settings, "hold still until centre", the camera speed graph (the Camera row on the timeline shows speed), "let go before the end" (follow only), the Order section + order tool (the generated line sets the order), and the preview-length readout.
- Column-rule fade-at-end moved into Setup → Column rules. Old layouts using Glide behind open as "With the blocks".

### v3.23 — Simple scene easing
- The Scene curve now has a **Simple** mode (on by default). Drag the red square (On done) and the blue square (Off starts) left/right on the Scene row to set where the build finishes and where the blocks start leaving.
- Four ease amounts in Scene settings: Start, Into hold, Out of hold, End. "On done at" / "Off starts at" can also be typed (empty = natural). "Natural positions" resets them.
- **Custom curve** keeps the old free-form handles. Editing the curve by hand switches to Custom.

### v3.24 — In · Hold · Out
- Motion → Blocks in & out is now **In · Hold · Out**. Hold is a toggle: on = the line holds (length per Out style), off = straight from In to Out. "Then" became **Out** (Stay up / Walk off / Each leaves / Behind camera / Clear out + how they leave).
- Scene row (Simple easing): vertical lines for **Hold starts** and **Out starts** (drag them), segment labels In / Hold / Out, and white **ease handles** on the curve — drag along the curve, longer = gentler: In ease in / ease out, Out ease in / ease out.
- No hold: either one **Out point** (In ends, Out starts, its own ease each side) or **Smooth, no point** (start and end eases only).

### v3.25 — Content holds until Out · removable middle point
- Text HUD and Between blocks: **Holds — For a set time / Until Out**. Until Out keeps content on through In and Hold and takes it off as the blocks' Out starts. On the timeline, drag the hold knob onto the dashed blue Out line to snap to Until Out; drag it back left for a set hold.
- Scene easing with no hold: ⌥-click the middle (Out point) line to remove it (smooth start-to-end); double-click the Scene row to add it back.

### v3.26 — Hold eases on both sides
- Simple scene easing is the default again. With a hold: drag the **Hold starts** / **Hold ends** lines, and each has an ease handle on **both sides** (before / after) plus start and end eases. Same four hold eases as numbers in Scene settings.
- No hold: no middle point — one smooth move with just start and end ease.
- Clear out now defaults to a 24-frame hold.

### v3.27 — Hold points with free handles
- Scene easing **Hold points** (default): the curve's points are locked to start, Hold starts, Hold ends and end; drag the vertical lines to move the hold points, and drag each bezier handle freely (angle + length, ⇧ keeps the angle) — like a custom curve, but the points stay on the phases. Handles are stored relative to their segment, so they keep their shape when phases change length. "Reset handles" goes back to plain eases.
- **Free curve** is the old add-points-anywhere editor.

### v3.28 — Straight hold, 4 handles, undo fix
- Hold points: four handles — out of the start, into Hold starts, out of Hold ends, into the end. The hold itself is a straight line. Default arrival into the hold is soft but not stopped, so the last block of the build no longer lags.
- ⌘Z / ⇧⌘Z: now works after clicking a number field or dropdown (they used to swallow it); clicking the canvas or timeline also hands keyboard shortcuts back to the app.
