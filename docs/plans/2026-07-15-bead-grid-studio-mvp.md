# Bead Grid Studio MVP Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a tested, accessible, browser-only bead-pattern grid editor with local persistence and export.

**Architecture:** Use a React/TypeScript frontend with a pure reducer-based editor core, Canvas or an optimized DOM renderer behind a small adapter, and localStorage persistence. Keep marketing and legal routes statically renderable for Cloudflare-first deployment.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Vitest, Testing Library, Playwright, Cloudflare Pages/OpenNext as compatibility permits.

---

## Planned task sequence
1. Confirm PRD assumptions and visual direction.
2. Initialize app, formatter, linting, unit and E2E test harness.
3. Define grid document types and invariants with failing tests first.
4. Implement paint/erase/fill reducer with unit tests.
5. Implement undo/redo history with unit tests.
6. Implement local persistence and migration boundary with tests.
7. Build responsive editor shell from approved visual source.
8. Connect pointer and keyboard interactions with integration tests.
9. Implement deterministic PNG and print export with tests.
10. Build landing, guide, privacy, terms, metadata, sitemap, robots, canonical and schema.
11. Add privacy-conscious pageview and core event hooks after analytics IDs are supplied.
12. Run lint/typecheck/unit/E2E/build; fix P0/P1 issues.
13. Commit, push and deploy the same commit only after owner confirmation.
14. Smoke-test production URL and record mobile/console/network/SEO evidence.

## Current blocker
Exact file-level TDD steps depend on the approved framework scaffold and visual source. Do not invent high-fidelity UI before owner approval.
