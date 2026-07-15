# Bead Grid Studio — MVP PRD (Draft)

## Problem
Bead-art makers need a quick way to draft grid patterns, revise colors, and produce a reference they can build or print, without installing specialist software.

## MVP outcome
A visitor can create a new rectangular grid, paint and erase cells with a color palette, undo/redo edits, and export the result as a PNG or print-friendly page.

## In scope
- Grid presets plus custom width/height within safe limits
- Pencil, eraser, fill tool
- Color palette and custom color
- Undo/redo and clear canvas
- Zoom and visible grid coordinates
- Local autosave in browser storage
- PNG export and print view
- Responsive landing/editor/legal pages
- Keyboard and basic accessibility support

## Out of scope (YAGNI)
- Login, cloud sync, collaboration, marketplace, payments
- Photo-to-pattern AI conversion
- Brand-specific bead inventory or guaranteed color matching
- Native mobile applications

## Acceptance criteria
1. A user can create a 10×10–100×100 grid without page reload.
2. Pointer painting does not introduce gaps during drag.
3. Undo and redo preserve deterministic cell state.
4. Refresh restores the latest local project.
5. PNG export reflects grid colors and chosen grid-line setting.
6. Core editor remains usable at 360px viewport width.
7. Internal routes resolve without placeholders or dead `#` links.

## Open owner decisions
- Does “bead” mean fuse/Perler beads, jewelry bead weaving, or both?
- Preferred grid types: square only, or peyote/brick/loom patterns too?
- Must the MVP include image import or bead-count/BOM output?
- Preferred visual style and reference sites?
