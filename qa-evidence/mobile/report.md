# Mobile QA Evidence — 390×844

Date: 2026-07-16

## Scope

- Editor: `/`
- Privacy: `/privacy/`
- Terms: `/terms/`

## Method

Chrome DevTools Protocol device emulation was used with:

- viewport: 390×844
- device scale factor: 1
- mobile mode: enabled
- touch emulation: enabled, 5 touch points

For every route, DOM metrics were collected after navigation and rendering. Screenshots were captured from the same emulated page session.

## Results

| Route | innerWidth | clientWidth | scrollWidth | Overflowing elements | Visual review |
|---|---:|---:|---:|---:|---|
| `/` | 390 | 390 | 390 | 0 | PASS |
| `/privacy/` | 390 | 390 | 390 | 0 | PASS |
| `/terms/` | 390 | 390 | 390 | 0 | PASS |

The editor controls, canvas, statistics, and vertically stacked sidebar fit the mobile viewport without horizontal clipping or overlap. Legal-page headings, callouts, and body text wrap within the viewport. Content continuing below the fold is normal vertical flow.

Browser console review reported zero messages and zero JavaScript errors.

## Evidence

- `home-390x844.png`
- `privacy-390x844.png`
- `terms-390x844.png`

## Tooling note

An initial command-line screenshot attempt used the browser's outer window width and produced misleading right-edge crops because the inner layout viewport retained a larger minimum width. Those captures were replaced. The final evidence above uses explicit `Emulation.setDeviceMetricsOverride`; DOM width measurements confirm the intended 390px layout viewport.
