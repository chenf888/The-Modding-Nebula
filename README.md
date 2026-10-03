# The Modding Nebula (Template)

A re-skeletoned template based on [The Modding Tree](https://github.com/Acamaeda/The-Modding-Tree) (TMT 2.7).

## What's new

### 1. Hybrid layout (replaces the fixed split-screen)
- **Top HUD bar** — points + points/sec moved into a compact top bar, together with the version,
  options wheel, info, Discord and all `row: "side"` nodes.
- **Collapsible sidebar** — a `⌂` home entry plus one icon per tree layer, with the same
  locked/notify/glow states as tree nodes. Toggle with the `☰` button (top-left) or the new
  **Sidebar** option in the options tab; persisted in the save. Sidebar tooltips pop out to the
  **right** of the node (black translucent, arrow pointing left) via `position: fixed`, so the
  narrow sidebar never clips them; HUD side-layer buttons flip their tooltips below instead.
- **Full-width main area** — shows either the tree overview page (`⌂`) or one layer's page.
  The old two-column split screen is gone; there is no more left/right divide.

### 2. A new tree implementation
- The tree is now a **pannable / zoomable page** instead of a static screen-fitting column:
  - Mouse wheel = zoom around the cursor, drag empty space = pan, pinch on touch devices.
  - `+` / `−` / `⤢` buttons in the bottom-right corner; `⤢` re-fits the whole tree.
  - The tree auto-fits every time you return to the overview page.
- **Branch lines are SVG** rendered inside the transformed plane (they scale and pan with the
  tree automatically), instead of being redrawn on a fullscreen canvas. Node positions, colors and
  branch width/color syntax (`branches: [["target", colorId, width]]`) are unchanged.
- Tree nodes are still ordinary `tree-node` buttons, so `nodeStyle`, images, marks, tooltips and
  all component styles keep working unchanged.
- Branches of `upgrade-tree` / `buyable-tree` / `clickable-tree` components (used *inside* layer
  pages) still use the fullscreen canvas fallback, exactly like before.

### 3. Tab model
- `player.tab === "none"` now means "show the tree overview page"; clicking a tree node or a
  sidebar icon opens that layer fullscreen; the `←` button (or `⌂`) goes back to the tree.
- `showTab`, `showNavTab`, `goBack`, hotkeys, left-tab layers and `row: "side"` layers behave as
  in vanilla. `tmp.other.splitScreen` is still computed for compatibility but is no longer used by
  the layout. The old `forceOneTab` option was replaced by the `Sidebar` toggle.

## Files touched (for modders diffing against vanilla TMT 2.7)

| File | Change |
| --- | --- |
| `index.html` | New hybrid layout skeleton (HUD / sidebar / main) |
| `css/system-style.css` | Appended the layout styles; all new elements use the standard theme variables |
| `js/technical/treeView.js` | **New** — pan/zoom state, fit logic and the `tree-view` component |
| `js/technical/canvas.js` | Layer-tree branches now feed `treeLines` (SVG) instead of the canvas |
| `js/technical/systemComponents.js` | `sidebar-node` component, one-line `overlay-head`, options-tab Sidebar toggle |
| `js/components.js` | Registers `sidebar-node`, exposes `treeLines` to Vue |
| `js/utils/options.js` | `options.sidebar` + `toggleSidebar()` |
| `js/mod.js` | Template name/version — change these to make the mod yours |

Everything else (components, displays, layer support, save system, theming) is vanilla TMT.

## Getting started
1. Edit `js/mod.js` (`name`, `author`, `pointsName`, `modFiles`, ...).
2. Define your layers in the files listed in `modFiles` — exactly like vanilla TMT
   (see `js/layers.js` / `js/tree.js`, or point `modFiles` at `js/Demo/...` for a richer example).
3. Theme it your way: `js/utils/themes.js` colors + the usual CSS files. The new layout only uses
   `--background`, `--color`, `--points` and the `--hqProperty*` variables, so your existing TMT
   themes keep working.

## Notes
- `layoutInfo.showTree` / `treeLayout` still exist; the tree overview page is the home page, so
  `showTree: false` has no effect in this template.
- `resizeCanvas()` is kept as the engine-wide "tree layout changed" hook; it now refreshes the SVG
  lines (and, when a layer page is open, the canvas component branches).
