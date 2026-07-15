# Bead Grid Studio — Project Control

> Single source of truth for scope, gates, status, evidence, and handoffs.

## Status
- Overall: IN PROGRESS
- Current gate: Discovery → PRD / Route Contract
- Production launch: BLOCKED
- Last updated: 2026-07-15

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
