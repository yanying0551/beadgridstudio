# Bead Grid Studio — Project Control

> Single source of truth for scope, gates, status, evidence, and handoffs.

## Status
- Overall: NEEDS REVIEW
- Current gate: Local MVP implementation / verification
- Production launch: BLOCKED
- Last updated: 2026-07-15

## Latest implementation evidence
- Existing Vite + TypeScript prototype was recovered from untracked files.
- Added domain/runtime tests; grid suite was observed passing 13/13 before runtime implementation.
- `src/runtime.test.ts` was observed RED because `runtime.ts` was absent; `runtime.ts` was then implemented.
- `tsc --noEmit`: PASS after explicitly typing mutable selected-color state.
- `npm audit --omit=dev`: PASS, 0 production vulnerabilities.
- Full post-implementation Vitest run: UNVERIFIED — worker was blocked by concurrent host Vitest processes and later terminated.
- Vite production bundle: UNVERIFIED — TypeScript phase passed, Vite phase did not complete within the verification window.
- Browser/mobile smoke test: NOT RUN.

## Verification blockers / known issues
- P0: A clean full test and production build run is still required before GO.
- P1: `runtime.drawPng` has deterministic tests, but UI export currently uses a separate circle-rendering implementation; unify the paths before claiming export coverage.
- P1: Runtime persistence/history helpers and UI state handling partially duplicate one another; integration review remains required.
- P1: Privacy/terms routes named in the draft contract are not yet implemented.
- P2: Development dependency audit previously reported advisories; production dependency audit is clean.

## Working assumptions `[待确认]`
1. English-first browser tool for creating fuse-bead / pixel-art patterns.
2. MVP works locally without login or a backend.
3. Core flow: choose grid → paint cells → select palette → undo/redo → export PNG/print.
4. Cloudflare Pages is the preferred initial deployment target.

## Hard gates
- [ ] Owner confirms target user and MVP scope
- [ ] PRD approved
- [ ] Route Contract approved
- [ ] SEO copy frozen
- [ ] Visual source approved
- [ ] Data contract approved or explicitly not required
- [ ] Implementation passes tests/build
- [ ] PM/SEO/compliance review
- [ ] Mobile and browser QA
- [ ] Owner review
- [ ] Production deploy (explicit confirmation required)
- [ ] Post-launch data review

## Work queue
| ID | Task | Status | Dependency |
|---|---|---|---|
| BGS-001 | Draft MVP PRD | READY | — |
| BGS-002 | Draft Route Contract | READY | BGS-001 |
| BGS-003 | Draft SEO and page copy | BLOCKED | BGS-001/002 |
| BGS-004 | Establish visual direction | BLOCKED | owner input |
| BGS-005 | Scaffold frontend | BLOCKED | BGS-001/002/004 |
| BGS-006 | Implement editor core using TDD | BLOCKED | BGS-005 |
| BGS-007 | SEO/analytics/legal surfaces | BLOCKED | BGS-003/005 |
| BGS-008 | QA and evidence pack | BLOCKED | BGS-006/007 |
| BGS-009 | Push/deploy/smoke test | BLOCKED | owner confirmation + credentials |

## Risks
- P0: No design source, repository remote, domain, or account readiness evidence.
- P1: “Bead” could refer to jewelry beads rather than fuse beads; product meaning needs confirmation.
- P1: Export/print requirements and commercial palette trademarks are unresolved.
- P2: Accounts, sharing, cloud saves, and AI conversion are intentionally excluded from MVP until requested.

## Evidence ledger
- Session-history search: no prior Bead Grid Studio session found.
- Local inspection: `/root` was not a Git repository; no recoverable project found.
- Skill loaded: `frontend-site-automation` v2.3.0.
