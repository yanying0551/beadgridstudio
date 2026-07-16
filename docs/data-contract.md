# Bead Grid Studio — Data Contract

- **Status:** CURRENT_MVP — NETWORK DATA CONTRACT NOT REQUIRED
- **Scope:** Browser-local project state and exported/imported project files
- **Backend/analytics:** None
- **Owner review:** Required before adding any network data collection
- **Last updated:** 2026-07-16

## 1. Scope decision

The current MVP has no account system, application backend, database, cloud save, analytics, advertising, payment flow, or server-side project processing. Therefore:

- No network API request/response data contract is required for current product operation.
- No analytics event contract is active.
- The browser-local persistence and portable JSON formats are documented below as the only product-data contract.
- Static hosting/CDN and Google Fonts still receive ordinary request metadata; that infrastructure processing is disclosed in Privacy but does not receive project content from the application.

This explicit non-requirement satisfies the current MVP data-contract gate. Any networked feature reopens the gate before implementation or release.

## 2. Local persistence contract

### Storage location

- Browser API: `localStorage`
- Key: `bead-grid-studio-project-v1`
- Cardinality: one current project per browser origin/profile
- Write behavior: deferred after project changes, with flush on page hide
- Retention: until overwritten or the user/browser deletes site data
- Server synchronization: none

### Stored payload

```ts
type Cell = string | null;
type Grid = Cell[][];

interface ProjectData {
  version: 1;
  name: string;
  size: 16 | 24 | 32;
  cells: Grid;
  updatedAt: string;
}
```

JSON example:

```json
{
  "version": 1,
  "name": "My bead pattern",
  "size": 24,
  "cells": [[null, "#ff5252"]],
  "updatedAt": "2026-07-16T12:00:00.000Z"
}
```

The example abbreviates the grid. A valid payload contains exactly `size` rows and exactly `size` cells per row.

### Field rules

| Field | Type | Required | Validation/meaning |
|---|---|---:|---|
| `version` | integer literal | Yes | Must equal `1` |
| `name` | string | Yes | Trimmed on serialization; empty becomes `Untitled pattern`; UI input currently limits entry to 60 characters |
| `size` | integer | Yes | Must be `16`, `24`, or `32` |
| `cells` | square array | Yes | Exactly `size × size` |
| cell | string or null | Yes | `null` means empty; color must match six-digit `#RRGGBB`, case-insensitive on import |
| `updatedAt` | string | Yes | Must parse as a date; serialization uses ISO 8601 UTC |

### Failure behavior

- Missing key: start with a new project.
- Storage access failure: continue with an in-memory editor and show `Local storage is unavailable.`
- Invalid stored payload: ignore it and show `Saved project was invalid and was ignored.`
- Save failure: continue editing and show `Could not save locally`.
- Local autosave is a convenience, not a backup service.

## 3. JSON import/export contract

### Export

- MIME type: `application/json`
- Format: pretty-printed JSON representation of `ProjectData`
- Processing: generated locally in the browser
- Network transfer by application: none
- File naming: derived by the client from the project name with JSON extension

### Import

A project is accepted only when all field and grid validation rules pass. Parsing is all-or-nothing:

- Invalid JSON is rejected.
- Unsupported `version` is rejected.
- Invalid date, board size, dimensions, or cell colors are rejected.
- Imported content is treated as data and never executed as HTML or JavaScript.
- The current valid project is not replaced until parsing succeeds.
- A successful import becomes the current project and is scheduled for local autosave.

### Versioning policy

- Current format version: `1`.
- Readers reject unknown versions rather than guessing.
- A future version must define migration/backward-compatibility behavior and add regression tests before release.
- Existing v1 exports should remain importable unless a documented breaking migration is approved.

## 4. In-memory operational state

The following editor state is transient and not part of the portable project contract:

- Active tool: paint or erase.
- Selected palette/custom color.
- Horizontal and vertical mirror toggles.
- Grid-line visibility.
- Undo/redo history, capped at 100 retained undo states.
- Active/focused cell.
- Open help/export dialog.
- Save-status UI state.
- PNG background selection.

A reload may reset these values without corrupting the saved project.

## 5. PNG export contract

- Generation: browser-local canvas rendering.
- Cell render size: 64×64 output pixels per board cell.
- Dimensions:
  - 16×16 board → 1024×1024 PNG.
  - 24×24 board → 1536×1536 PNG.
  - 32×32 board → 2048×2048 PNG.
- Beads render as centered circles with radius 43% of the cell size.
- Background: transparent or white.
- Network transfer by application: none.
- PNG is an output artifact, not an importable project backup.

Grid-line inclusion in the exported PNG is not part of the current renderer contract; product copy must not promise physical-size calibration, exact brand colors, or print pagination.

## 6. Data classification

| Data | Classification | Location | Networked by application |
|---|---|---|---:|
| Project name | User content | Browser/local JSON | No |
| Cell colors/pattern | User content | Browser/local JSON/PNG | No |
| Update timestamp | Project metadata | Browser/local JSON | No |
| Undo history | Ephemeral operational data | Memory | No |
| Tool/palette/toggle state | Ephemeral operational data | Memory | No |
| IP, user agent, request time | Infrastructure request metadata | Hosting/CDN/font providers | Yes, outside project payload |
| Analytics events | Not collected | N/A | No |
| Account/payment data | Not collected | N/A | No |

The application does not intentionally collect sensitive personal data. Users can nevertheless place personal or copyrighted information in project names/patterns; that content remains their responsibility and local to their chosen browser/files.

## 7. Deletion and portability

- `Clear board` empties cells and then saves the empty project under the same key; project metadata remains.
- Deleting site data removes the locally stored project.
- Export JSON provides project portability and backup.
- Export PNG provides a visual artifact but cannot restore editable state.
- There is no server-side deletion request because no project record is stored by an application server.

## 8. Security and privacy requirements

- Validate every imported JSON field before state replacement.
- Never evaluate or inject imported content as executable markup/script.
- Never add project content to URLs, logs, telemetry, or network requests without a new approved contract.
- Keep errors user-readable without exposing local file paths or browser internals.
- Re-review Privacy and Terms before changing storage, collection, or recipients.
- Third-party fonts should not receive project payloads; removing the request remains an optional privacy improvement.

## 9. Gate re-open triggers

A new owner-approved network data contract is mandatory before adding any of the following:

- Analytics, session replay, advertising, or conversion pixels.
- Accounts, authentication, profiles, or email capture.
- Cloud save, sync, sharing, collaboration, or public galleries.
- Server-side image conversion, AI generation, uploads, or moderation.
- Payments, subscriptions, entitlements, or purchase history.
- Feedback forms, support tickets, newsletters, or waitlists.
- Error/crash reporting that can include URLs, device identifiers, or user content.

The new contract must define fields, purpose, lawful/privacy basis as applicable, retention, recipients, user controls, failure behavior, consent requirements, and deletion/export mechanisms.

## 10. Verification evidence

- Project schema and parser: `src/grid.ts`
- Persistence/failure handling: `src/runtime.ts`, `src/main.ts`
- Contract tests: `src/grid.test.ts`, `src/runtime.test.ts`
- Privacy disclosure: `privacy/index.html`
- Product limitations: `terms/index.html`
- Browser smoke evidence: `docs/project-control.md`, `qa-evidence/`

## 11. Decision record

**Current decision:** An application network/analytics data contract is explicitly not required for the shipped MVP because it has no backend or analytics. The v1 local project format above is the authoritative product-data contract.

Any trigger in Section 9 changes this status to **BLOCKED — DATA CONTRACT REQUIRED** until reviewed and approved.
