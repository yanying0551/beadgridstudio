# Bead Grid Studio — Visual Direction

- **Status:** NEEDS_REVIEW
- **Scope:** Existing production UI and social-preview system
- **Evidence:** production homepage, `src/style.css`, mobile QA screenshots, `public/og-image.png`
- **Owner approval:** `[待确认]`
- **Last updated:** 2026-07-16

## 1. Direction statement

Bead Grid Studio uses a **product-first maker-tool aesthetic**: a restrained monochrome workspace, precise grid geometry, rounded utility controls, and concentrated bead colors. The direction should feel practical, calm, trustworthy, and craft-aware without becoming childish or decorative.

The current interface combines:

- **Utility:** dense toolbar, palette, board controls, counters, and direct editing.
- **Editorial confidence:** oversized marketing headline, numbered benefits, generous whitespace.
- **Craft cues:** circular color swatches, pegboard grid, multicolor mark, and “idea to pegboard” language.
- **Privacy cues:** persistent `Saved locally` status and no account gate.

The editor remains the first and dominant experience. Marketing content explains the product after the user has already been given a usable canvas.

## 2. Brand personality

| Attribute | Expression |
|---|---|
| Practical | The live editor appears before marketing copy. |
| Precise | Grid geometry, symmetry controls, counts, and compact labels. |
| Friendly | Rounded cards and controls, colorful swatches, plain language. |
| Mature | Neutral surfaces and black typography avoid a toy-like craft aesthetic. |
| Independent | Browser-local workflow, JSON portability, no sign-up. |
| Patient | Spacious composition and the craft-table tone reward deliberate creation. |

Avoid visual language that feels like:

- A generic AI SaaS dashboard.
- A children-only toy unless the target age is explicitly approved.
- A brand-specific bead catalog or implied manufacturer affiliation.
- A high-gloss illustration site that hides the functional editor.

## 3. Visual tokens

### Core colors

| Role | Current token | Use |
|---|---|---|
| Primary ink | `#111111` | Main text, active controls, footer, logo base |
| Page background | `#f5f5f3` | Warm neutral workspace/page surface |
| Panel | `#ffffff` | Toolbars, cards, canvas, dialogs |
| Border | `#d8d8d4` | Dividers, card outlines, inactive controls |
| Muted text | `#666666` | Secondary copy and status text |
| Small utility label | `#777777` | Uppercase metadata labels |
| Destructive accent | `#ff5252` | Clear action and logo bead |
| Supporting accents | `#ffd43b`, `#3ecf8e`, `#7c6df2` | Brand mark and controlled editorial emphasis |

The broad working palette belongs to the pattern editor, not to page chrome. UI surfaces should remain neutral so user-created colors stay dominant.

### Contrast evidence

Calculated against white:

- `#111111`: **18.88:1** — strong.
- `#666666`: **5.74:1** — passes normal-text contrast.
- `#777777`: **4.48:1** — narrowly below 4.5:1 and used at very small sizes; needs correction.
- `#ff5252`: **3.19:1** — insufficient for small destructive-action text on white.
- `#aaaaaa`: **2.32:1** — acceptable only for truly disabled/non-essential states, not instructions or active controls.

**P1 accessibility recommendation:** darken small `#777777` labels and destructive red text while preserving the current visual direction. This is an implementation correction, not a redesign.

### Typography

- Current family: `Inter, system-ui, sans-serif`.
- Display: heavy sans serif with compact line height and controlled yellow/blue accent treatment.
- UI: medium/bold sans serif, compact labels, uppercase tracking for section metadata.
- Body: regular sans serif with readable measure and generous line height.

Typography should remain single-family and functional. Do not introduce decorative craft fonts.

**Privacy note:** production currently requests Inter from Google Fonts. System fallback already exists. Removing the third-party font request would strengthen the privacy proposition with limited visual change and is `[待确认]`.

### Geometry and spacing

- Medium rounded panels: approximately 14px radius.
- Pill controls for modes, actions, and segmented choices.
- Circular palette swatches, reflecting physical beads.
- Thin neutral borders and minimal shadows.
- Compact editor spacing; generous editorial-section spacing.
- Wide application stage transitioning to a narrower reading column.

## 4. Component language

### Brand mark
A dark rounded square containing four colored circular beads. It communicates the product category at small sizes without a literal illustration.

### Buttons
- Black filled pills: selected mode and primary action.
- White outlined pills: secondary actions.
- Destructive action: outlined and red-labeled, with confirmation behavior.
- Icon buttons: help, undo, redo; each requires an accessible name and visible focus.

### Palette
- Standard colors use circular swatches.
- Selected color uses a non-color-only ring/outline and exposes its name.
- Custom color is visually distinct but must remain understandable and keyboard operable.
- Accessible names are mandatory because hue alone cannot identify a swatch.

### Board and canvas
- White square canvas with fine neutral grid lines.
- Centered in a pale stage with restrained elevation.
- Pattern colors provide the visual energy.
- Empty state is intentionally quiet; instructional copy and palette carry initial orientation.

### Forms, toggles, and segmented controls
- Compact, familiar controls with black active states.
- State must be conveyed by more than subtle gray changes.
- Touch targets remain at least the current mobile-oriented size.

### Marketing sections
- Oversized H1 with limited editorial accent.
- Three numbered benefit columns.
- Native disclosure-style FAQ rows.
- Dark compact footer as the closing anchor.

## 5. Information hierarchy

1. Brand and local-save state.
2. Usable editor and project name.
3. Paint/erase mode and export action.
4. Palette, board settings, and canvas.
5. Counts and current usage.
6. Product promise and benefits.
7. FAQ, privacy, terms, and footer.

Do not place a sign-up, splash screen, or generic `Get started` CTA before the editor. The direct canvas interaction is the primary activation path; `Export PNG` is the primary completion CTA.

## 6. Responsive behavior

Current approved implementation behavior:

- At ≤850px, editor columns stack and toolbar wraps.
- Palette density reduces for narrower layouts.
- At ≤540px, side padding tightens, action groups stretch, and controls keep touch-oriented height.
- Marketing benefit columns stack.
- Footer becomes vertical.
- Verified 390×844 routes have no horizontal overflow, overlap, or clipping.

Preserve the mobile evidence baseline in `qa-evidence/mobile/` when changing layout tokens.

## 7. Accessibility and usability guardrails

- Keep visible `:focus-visible` treatment for buttons, inputs, summaries, and links.
- Preserve keyboard grid navigation, roving tabindex, and cell state labels.
- Do not use hue as the sole selected-state or control-state signal.
- Maintain minimum touch target sizing on mobile.
- Keep dialogs operable and dismissible by keyboard.
- Keep destructive actions confirmed and undoable where implemented.
- Correct small-label and destructive-text contrast before claiming WCAG 2.2 AA.
- Confirm the selected-state ring works on both light and dark swatches.
- Avoid making fine grid lines essential to understanding cell state.

## 8. Visual risks

| Priority | Risk | Disposition |
|---|---|---|
| P1 | `#777` small labels narrowly miss normal-text contrast | Darken in a focused accessibility change |
| P1 | `#ff5252` small text on white has 3.19:1 contrast | Use a darker destructive text token |
| P1 | No approved visual source/owner sign-off | Owner review required |
| P2 | Google Fonts weakens the strongest interpretation of browser privacy | Decide whether to self-host/remove request |
| P2 | Large editor stage pushes explanatory copy below the first viewport | Accepted product-first trade-off; monitor feedback |
| P2 | Empty canvas makes the first state visually quiet | Keep honest empty state; consider examples only after scope approval |
| P2 | Yellow/blue headline offset may appear like rendering misalignment | Retain only if owner approves signature treatment |

## 9. Social-preview direction

The 1200×630 Open Graph image should:

- Match the neutral, grid-led production UI.
- Show the product name and fuse-bead/pixel-grid category clearly.
- Avoid unapproved testimonials, usage metrics, manufacturer marks, or “official” language.
- Remain legible at small social-card sizes.
- Use the same current production origin in metadata.

The shipped asset is technically valid but remains part of visual-source approval.

## 10. Approval checklist

- [ ] Owner approves practical/mature maker-tool positioning.
- [ ] Owner approves the current mark and accent colors.
- [ ] Owner approves the editorial headline treatment.
- [ ] Owner approves Inter or chooses system/self-hosted typography.
- [ ] Owner approves the production UI and Open Graph artwork as visual source.
- [ ] Accessibility contrast corrections are accepted.
- [ ] Target audience/age does not require a materially different visual tone.
- [ ] No manufacturer affiliation is implied.

Until approved, this document is the evidence-based visual rationale for the live implementation, not retroactive owner sign-off.
