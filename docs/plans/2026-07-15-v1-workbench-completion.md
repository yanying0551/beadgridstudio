# Bead Grid Studio V1 Workbench Completion Implementation Plan

> **For Hermes:** Use `subagent-driven-development` task-by-task, with a fresh implementer then spec and quality reviews.

**Goal:** Complete the browser-local primary maker journey: configurable palette/grid conversion, usable workbench output, and local PNG/PDF/CSV exports.

**Architecture:** Keep all image decode, canvas rasterization, quantization, and export construction in the browser. Continue using the existing typed `PatternDocument` and Worker boundary as the only generated-pattern interchange. UI state stays in client components; no API routes, telemetry, image uploads, account storage, or third-party palette claims are introduced.

**Tech stack:** Next.js 16, React 19, TypeScript, Vitest + Testing Library, browser Canvas/Worker APIs.

---

### Task 1: Add a generic V1 palette and typed conversion settings

**Objective:** Replace the one-colour placeholder conversion input with an explicit generic palette and user-selectable grid/color/dither settings.

**Files:**
- Create: `src/lib/pattern/default-palette.ts`
- Modify: `src/components/PatternConversionUploader.tsx`
- Modify: `src/workers/pattern-worker.protocol.ts`
- Test: `tests/pattern/default-palette.test.ts`
- Test: `tests/pattern/pattern-conversion-uploader.test.tsx`

**TDD acceptance:** a failing test proves palette ordering/generic labels and asserts settings sent to the worker reflect valid user selections. Then implement the smallest typed palette/settings UI and make the test pass. Run `npm test -- tests/pattern/default-palette.test.ts tests/pattern/pattern-conversion-uploader.test.tsx` and full `npm test`.

### Task 2: Implement deterministic optional Floyd–Steinberg quantization

**Objective:** Honor the existing `floyd-steinberg` contract while preserving deterministic nearest-colour behavior.

**Files:**
- Modify: `src/lib/pattern/quantize.ts`
- Modify: `src/workers/pattern.worker.ts`
- Test: `tests/pattern/quantize.test.ts`
- Test: `tests/pattern/pattern-worker.test.ts`

**TDD acceptance:** failing tests demonstrate stable ordered output from a small RGB fixture, palette-limit enforcement, and a different but valid dithered result. Implement only the deterministic branch and worker selection needed for green. Run targeted tests then full test/lint/build.

### Task 3: Build the maker workbench around PatternDocument output

**Objective:** Render settings, coordinate-aware preview, section overview, materials and export panel in responsive desktop/mobile order.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/PatternPreview.tsx`
- Create: `src/components/PatternMaterials.tsx`
- Create: `src/components/PatternExportPanel.tsx`
- Test: `tests/pattern/pattern-preview.test.tsx`
- Test: `tests/pattern/pattern-materials.test.tsx`
- Test: `tests/pattern/pattern-export-panel.test.tsx`

**TDD acceptance:** failing component tests assert dimension/count text, complete generic-color materials equivalence, and disabled exports without a document. Build accessible responsive markup with visible textual colour/count equivalents and no reliance on colour alone. Run targeted tests then full suite/lint/build.

### Task 4: Add browser-only CSV and PNG export adapters

**Objective:** Produce materials CSV and printable PNG without any network request or server route.

**Files:**
- Create: `src/lib/export/csv.ts`
- Create: `src/lib/export/png.ts`
- Modify: `src/components/PatternExportPanel.tsx`
- Test: `tests/export/csv.test.ts`
- Test: `tests/export/png.test.ts`

**TDD acceptance:** failing tests cover CSV quoting/count reconciliation and PNG canvas draw/download invocation through injected browser adapters. Implement local-only exports and user-visible error/success status. Run full test/lint/build.

### Task 5: Add print/PDF fallback and legal/SEO route shell

**Objective:** Make PDF export use the browser print dialog (no server PDF creation) and implement the required static help/legal routes, metadata, sitemap, robots and canonical base configuration.

**Files:**
- Create: `src/app/how-it-works/page.tsx`, `src/app/print-guide/page.tsx`, `src/app/bead-count-calculator/page.tsx`, `src/app/faq/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/disclaimer/page.tsx`, `src/app/contact/page.tsx`
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/layout.tsx`, `src/components/PatternExportPanel.tsx`
- Test: `tests/routes/static-routes.test.tsx`

**TDD acceptance:** failing tests assert required frozen headings/disclaimer and PDF action calls an injected print adapter. Implement no unsupported factual/brand claims; contact route uses a pre-launch placeholder and must retain release blocker. Run full suite/lint/build.

### Task 6: Independent review and pipeline evidence

**Objective:** Verify the primary journey and update factual pipeline status without marking release/deployment complete.

**Files:**
- Modify: `../project-control.md`, `../kanban-plan.md`, `../stage-status.md`, `../blocked-log.md`
- Create: `../qa/v1-local-qa.md`

**Verification:** independent reviewer runs `npm test`, `npm run lint`, `npm run build`, exercises a local image upload in a browser, verifies no fetch/XHR image upload occurs, checks 320px layout, keyboard flow, and export behavior. P0/P1 issues must return to the relevant task before QA GO.
