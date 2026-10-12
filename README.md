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
2. **Block size**: pick W × H squares; click the canvas to test
3. **Layout**: Select (V), Stamp (S), Draw (B), Unmerge (E) tools, or generate from rules
4. **Content**: text inside blocks
5. **Animate**: Reveal, Camera follow, Conveyor · Keep building (repeat or continue the pattern) · same-column grouping · speed ramp · smooth / step / stop-motion · grid size over time · live preview (P)
6. **Transitions**: full-frame block transitions in and out, as coloured blocks or a white matte precomp
7. **Build**: layers + keyframes in one undo step

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
