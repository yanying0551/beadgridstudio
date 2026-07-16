# Bead Grid Studio — MVP Product Requirements Document

- **Status:** NEEDS_REVIEW
- **Version:** v0.1 (documents the product currently shipped)
- **Owner approval:** `[待确认]`
- **Production:** https://bead-grid-studio.pages.dev/
- **Last updated:** 2026-07-16

## 1. Product summary

Bead Grid Studio is an English-first, browser-based editor for creating fuse-bead patterns and small pixel-art designs. It lets a user paint a fixed-size grid, plan colors and symmetry, save a portable project file, and export a high-resolution PNG without creating an account.

## 2. Target user hypothesis `[待确认]`

### Primary user
A fuse-bead crafter who wants to sketch or refine a pattern before placing physical beads.

### Secondary user
A pixel-art hobbyist who needs a lightweight fixed-grid editor with color counts and PNG export.

### Jobs to be done
- Turn a visual idea into a clear pegboard-sized pattern.
- Estimate total beads and per-color requirements before crafting.
- Try horizontal or vertical symmetry without redrawing cells.
- Keep or move a project without an account.
- Export a guide suitable for printing or use in another design tool.

## 3. Problem

General graphics editors do not naturally model pegboards, bead counts, mirrored placement, or craft-oriented exports. Dedicated tools may require an account, send project data to a server, or add complexity beyond the core planning task.

## 4. MVP goals

1. Let a first-time visitor begin drawing immediately.
2. Support the complete local workflow: create → edit → count → preserve → export.
3. Keep project content local to the browser during editing, import, and export.
4. Work with mouse, pen, touch, and keyboard on current desktop and mobile browsers.
5. Make data-loss limitations and network/privacy behavior understandable.

## 5. Non-goals

The current MVP does **not** include:

- Accounts, authentication, cloud storage, or synchronization.
- Public sharing, galleries, collaboration, comments, or social features.
- AI/image-to-pattern conversion.
- Payments, subscriptions, advertising, or analytics.
- Brand-specific bead catalogs, inventory, color matching, or purchase links.
- Arbitrary canvas dimensions, layers, selections, transforms, or vector editing.
- A guarantee that screen/print colors match physical bead brands.
- A server-side backup or recovery service.

## 6. Core user stories and acceptance criteria

### US-1 — Start a pattern
As a visitor, I can open the home route and use a ready 24×24 board without signing in.

**Acceptance criteria**
- The editor is usable after JavaScript loads.
- The default project name is editable and limited to 60 characters.
- 16×16, 24×24, and 32×32 boards are available.
- Resizing preserves cells in the overlapping top-left area, crops cells outside smaller dimensions, and is undoable; the current implementation does not show a resize confirmation.

### US-2 — Draw and erase
As a crafter, I can paint or erase cells using mouse, pen, touch, or keyboard.

**Acceptance criteria**
- Click/tap and drag paint continuously without skipped cells along a pointer path.
- Paint and erase have visible selected states.
- Arrow keys move the active grid cell; Enter or Space applies the active tool.
- The grid exposes an accessible grid label and cell position/state information.

### US-3 — Choose and count colors
As a crafter, I can choose a built-in or custom color and see material counts.

**Acceptance criteria**
- The selected color is visible by name or hexadecimal value.
- Total placed beads, colors used, and per-color totals update after edits.
- An empty board gives a clear prompt rather than an empty summary.

### US-4 — Create symmetry
As a crafter, I can mirror edits horizontally, vertically, or both.

**Acceptance criteria**
- Mirror controls affect paint and erase operations in real time.
- Mirrored operations form one undoable history action.

### US-5 — Recover from edits
As a user, I can undo and redo recent changes.

**Acceptance criteria**
- Undo/redo controls reflect availability.
- Keyboard shortcuts support Ctrl/⌘+Z and Ctrl/⌘+Shift+Z or Ctrl/⌘+Y.
- New edits after undo discard the obsolete redo branch.

### US-6 — Preserve a project locally
As a user, I can return to the same browser or exchange a portable JSON project.

**Acceptance criteria**
- The current project autosaves to `localStorage` under `bead-grid-studio-project-v1`.
- Save status communicates pending and completed local persistence.
- JSON export includes the supported format version, name, board size, cells, and update time.
- JSON import validates the file and rejects unsupported or malformed projects without replacing valid current work.
- Copy makes clear that local autosave is not a backup.

### US-7 — Export a crafting guide
As a crafter, I can download a high-resolution PNG.

**Acceptance criteria**
- The user can select transparent or white background.
- The export represents the current board and selected grid-line setting.
- Export is generated locally and does not upload project content.

### US-8 — Clear a board safely
As a user, I can clear all cells without accidentally losing work.

**Acceptance criteria**
- Clearing a non-empty board requires confirmation.
- Clearing is undoable.
- The resulting empty project is autosaved; the privacy notice explains that project metadata remains.

## 7. Functional requirements

| ID | Requirement | Priority | Shipped evidence |
|---|---|---:|---|
| FR-01 | Fixed boards at 16, 24, and 32 cells per side | P0 | `index.html`, `src/main.ts` |
| FR-02 | Paint/erase with interpolated pointer input | P0 | `src/main.ts`, `src/runtime.ts` |
| FR-03 | Built-in palette and custom color | P0 | `index.html`, `src/main.ts` |
| FR-04 | Horizontal/vertical mirroring | P0 | `src/grid.ts`, `src/main.ts` |
| FR-05 | Undo/redo | P0 | `src/runtime.ts`, runtime tests |
| FR-06 | Total and per-color counts | P0 | `src/grid.ts`, `src/main.ts` |
| FR-07 | Deferred local autosave and recovery | P0 | `src/runtime.ts`, runtime tests |
| FR-08 | Validated JSON import/export | P0 | `src/grid.ts`, grid tests |
| FR-09 | Transparent/white PNG export | P0 | `src/grid.ts`, `src/main.ts` |
| FR-10 | Grid-line display toggle | P1 | `index.html`, `src/main.ts` |
| FR-11 | Keyboard controls and shortcut help | P0 | `index.html`, browser QA |
| FR-12 | Privacy and Terms routes | P0 | `/privacy/`, `/terms/` |

## 8. Quality and policy constraints

### Privacy
- Pattern content, imported JSON, and generated exports stay in the browser.
- Ordinary hosting/CDN requests and Google Fonts requests still expose request metadata; public copy must not claim “no data leaves your device.”
- Adding analytics, accounts, cloud features, advertising, or other network processing requires a privacy and consent review before release.

### Accessibility
- All editor actions required for the core flow must be keyboard operable.
- Focus indicators, semantic labels, status announcements, and dialog controls must remain usable.
- Text and controls must remain legible at a 390×844 mobile viewport without horizontal overflow.
- Formal WCAG conformance level is `[待确认]`; the working target should be WCAG 2.2 AA.

### Compatibility and performance
- Baseline: current evergreen desktop and mobile browsers with JavaScript and `localStorage` enabled.
- Node.js 18+ is the development baseline.
- No backend availability may be required for core editing after static assets load.
- Numerical page-load or bundle-size budgets are `[待确认]` because no analytics/RUM baseline exists.

### Security and resilience
- Imported project files must be parsed and validated locally.
- File import must not execute imported content.
- Invalid saved or imported data must fail safely.
- Local storage failure must not make the active editor unusable.

## 9. Launch acceptance

The documented MVP is technically launchable when:

- Automated tests and production build pass.
- `/`, `/privacy/`, `/terms/`, `/robots.txt`, and `/sitemap.xml` return successful production responses.
- Canonical, Open Graph, structured data, robots, and sitemap use the live origin.
- Desktop and 390×844 mobile smoke tests find no blocking overflow, overlap, console errors, or core-flow failures.
- Production paint, undo, local save, import/export, and legal navigation are verified.
- Production dependency audit has no known production vulnerabilities.

Current evidence is recorded in `docs/project-control.md` and `qa-evidence/`.

## 10. Product success measures `[待确认]`

Analytics is intentionally absent, so no behavioral KPI is currently collected. Before adding measurement, the owner must approve the event/data contract and privacy approach. Candidate, non-binding measures:

- Editor start rate: visitors who place at least one bead.
- Completion proxy: sessions that export PNG or JSON.
- Return-use proxy: locally saved project reopened in the same browser.
- Reliability: uncaught error rate and failed import/export rate.

No targets are set until baseline data and consent requirements are reviewed.

## 11. Open owner decisions

1. Is the primary audience specifically fuse-bead crafters, or should pixel art receive equal positioning?
2. Is “Bead” intended exclusively to mean fuse beads rather than jewelry beads?
3. Which countries/languages and age groups are in scope?
4. Should the product avoid third-party fonts to strengthen the privacy proposition?
5. Are grid dimensions tied to specific physical pegboards, and are more sizes required?
6. What does “print-ready” mean: image quality only, or physical-size calibration and pagination?
7. May generic palette colors remain, or is brand-specific color matching required later?
8. Who is the legal/operator contact, and are jurisdiction/contact provisions required in Terms?
9. Is `beadgrid.studio` the approved long-term domain?
10. What WCAG conformance target and performance budgets are approved?

## 12. Approval

This PRD describes the live implementation but does not retroactively approve product positioning, legal terms, visual direction, or measurement. Owner review is required before changing this status to **APPROVED**.
