# Bead Grid Studio — Route Contract

- **Status:** NEEDS_REVIEW
- **Version:** v0.1 (documents shipped routes)
- **Public origin:** https://bead-grid-studio.pages.dev
- **Owner approval:** `[待确认]`
- **Last updated:** 2026-07-16

## Global contract

- English is the current document language.
- Public HTML routes use trailing-slash canonical URLs.
- Core editing is client-side and requires JavaScript.
- The site has no account, application backend, analytics, advertising, or cloud project storage.
- All public absolute URLs must use the current production origin until an approved custom domain is connected.
- Every navigable page must provide a path back to the Studio and must remain usable at 390 CSS pixels wide.
- A missing route is handled by the static hosting platform; a custom 404 page is not currently shipped.

## Route matrix

| Route | Type | Indexable | Primary purpose | Primary intent |
|---|---|---:|---|---|
| `/` | HTML application + landing content | Yes | Create and export a fuse-bead pattern | fuse bead pattern maker; pixel art grid editor |
| `/privacy/` | HTML legal/information page | Yes | Explain local storage and network processing | Bead Grid Studio privacy; where patterns are saved |
| `/terms/` | HTML legal/information page | Yes | State use conditions and limitations | Bead Grid Studio terms |
| `/robots.txt` | Crawler directive | N/A | Permit crawling and locate sitemap | crawler infrastructure |
| `/sitemap.xml` | XML sitemap | N/A | Enumerate canonical public HTML routes | crawler infrastructure |
| `/og-image.png` | Social preview image | N/A | Render home-page link previews | social sharing asset |
| `/favicon.svg` | Site icon | N/A | Browser identity | browser asset |

## `/` — Studio

### Audience and outcome
Fuse-bead crafters and small-grid pixel artists `[target priority 待确认]`. A successful visit produces a pattern, material count, portable JSON, or PNG guide without sign-up.

### Search contract
- **Title:** `Bead Grid Studio — Free Fuse Bead Pattern Maker`
- **Meta description:** `Design fuse bead patterns and pixel art in your browser. Paint, mirror, count colors, save projects, and export high-resolution PNGs for free.`
- **H1:** `Make bead patterns, one pixel at a time.`
- **Canonical:** `https://bead-grid-studio.pages.dev/`
- **Open Graph:** website type, canonical home URL, product title/description, absolute `/og-image.png`.
- **Structured data:** `WebApplication`; design category; browser/JavaScript requirement; zero-price USD offer; browser-based editor description.
- **Robots:** crawlable and included in the sitemap.

### Required content and controls
- Brand/home link and local-save status.
- Editable project name.
- Paint, erase, undo, redo, JSON import/export, and PNG export.
- Color palette and custom color.
- 16×16, 24×24, and 32×32 board controls.
- Horizontal mirror, vertical mirror, and grid-line controls.
- Clear-board action.
- Grid, total bead count, colors-used count, and per-color summary.
- Product explanation covering speed, planning, and local preservation.
- FAQ covering price/account requirement, local storage, PNG use, and grid sizes.
- Privacy and Terms links.
- Keyboard-help and PNG-options dialogs.

### Primary CTA
`Export PNG` after editing. The initial action is direct interaction with the board; no separate “Get started” gate is required.

### State and data dependencies
- Initial state: 24×24 empty board, default project name, black selected, paint active, grid lines on.
- Durable state: one versioned project in browser `localStorage`.
- Portable state: locally imported/exported JSON.
- External dependencies: static hosting/CDN and Google Fonts; editor content is not sent with those requests.
- No account, cookie-based session, server API, or database.

### Empty, failure, and destructive behavior
- Empty usage summary: prompt the user to start painting.
- Undo/redo: disabled when no matching history state exists.
- Clear non-empty board: confirm; keep operation undoable.
- Resize: preserve cells in the overlapping top-left area, crop cells outside smaller dimensions, and keep the operation undoable; no resize confirmation is currently shown.
- Invalid/unsupported JSON: reject with a user-visible error and retain the current valid project.
- Local persistence failure: display a status/error without preventing continued editing.
- PNG generation/download failure is not currently surfaced in the UI `[resilience gap 待确认]`.
- JavaScript disabled: no enhanced editor fallback is currently provided `[future handling 待确认]`.

### Internal links
- Brand → `/`
- Footer → `/privacy/`, `/terms/`
- No breadcrumb is required on the single-level home route.

### Acceptance criteria
- A user can complete paint → undo/redo → save/reload → PNG export.
- Mouse, pen, touch, and keyboard core paths work.
- Dialogs can be opened, closed, and operated with keyboard controls.
- No horizontal page overflow at 390×844.
- No uncaught console error during the production smoke flow.
- Absolute SEO URLs match the production origin and `/og-image.png` exists.

## `/privacy/` — Privacy Policy

### Audience and outcome
Users deciding whether the browser-only tool and its local persistence meet their privacy expectations.

### Search contract
- **Title:** `Privacy Policy — Bead Grid Studio`
- **Meta description:** `How Bead Grid Studio handles local project data and imported or exported files.`
- **H1:** `Your pattern stays in your browser.`
- **Canonical:** `https://bead-grid-studio.pages.dev/privacy/`
- **Structured data/Open Graph:** not currently provided.
- **Robots:** crawlable and included in the sitemap.

### Required content
- Effective date.
- No accounts or application backend.
- Project content is not sent to a Bead Grid Studio server.
- `localStorage` autosave scope and deletion behavior.
- Local JSON import and JSON/PNG export.
- Hosting/CDN request metadata and Google Fonts request disclosure.
- No current advertising or analytics.
- User choices: clear cells, delete site data, export backup, block font requests.
- Commitment to update the notice before representing new network features.

### CTA and links
- Primary action: return to `Studio` (`/`).
- Related legal action: `Terms` (`/terms/`).

### State and failure behavior
- Static page; no user-specific state or application data access.
- Must remain readable if application JavaScript fails or is disabled.
- If local/cloud/analytics behavior changes, deployment is blocked until this route and consent requirements are reviewed.

### Acceptance criteria
- Claims match actual runtime network and storage behavior.
- No statement implies that ordinary request metadata never leaves the device.
- Links to Studio and Terms work.
- Page is readable at 390×844 with no horizontal overflow.
- Effective date and operator/legal-contact sufficiency receive owner/legal review `[待确认]`.

## `/terms/` — Terms of Use

### Audience and outcome
Users who need the conditions, ownership allocation, backup warning, and craft/color limitations before relying on the tool.

### Search contract
- **Title:** `Terms of Use — Bead Grid Studio`
- **Meta description:** `Terms for using the free Bead Grid Studio browser-based pattern editor.`
- **H1:** `Use the studio thoughtfully.`
- **Canonical:** `https://bead-grid-studio.pages.dev/terms/`
- **Structured data/Open Graph:** not currently provided.
- **Robots:** crawlable and included in the sitemap.

### Required content
- Effective date and acceptance-by-use statement.
- Tool availability/change notice.
- User retains whatever rights they hold; user is responsible for imported/created/exported content.
- Local autosave is not a guaranteed backup.
- Screen, print, brand, and physical color/result differences.
- “As is/as available” and liability language to the extent allowed by law.
- Prohibited disruptive, malicious, security-bypassing, or unlawful use.

### CTA and links
- Primary action: return to `Studio` (`/`).
- Related legal action: `Privacy` (`/privacy/`).

### State and failure behavior
- Static page; no user-specific state or application data access.
- Must remain readable if application JavaScript fails or is disabled.
- Material product/business-model changes require terms review before release.

### Acceptance criteria
- Links to Studio and Privacy work.
- Page is readable at 390×844 with no horizontal overflow.
- Claims do not promise exact physical color/material outcomes.
- Operator identity, governing law, contact channel, age requirements, and jurisdiction-specific enforceability are `[待确认]`; this contract is not legal approval.

## `/robots.txt`

### Required response
- Plain text and HTTP 200.
- Allows crawler access to `/`.
- Contains exactly one current sitemap URL: `https://bead-grid-studio.pages.dev/sitemap.xml`.
- Must not reference the unconnected `beadgrid.studio` origin.

## `/sitemap.xml`

### Required response
- Valid XML and HTTP 200.
- Contains canonical URLs for `/`, `/privacy/`, and `/terms/`.
- Does not list assets, duplicate slash variants, development URLs, or an unconnected custom domain.
- URL changes require matching canonical and regression-test updates.

## `/og-image.png`

### Required response
- HTTP 200 with an image content type.
- 1200×630 production social-preview artwork.
- URL exactly matches the home page `og:image` value.
- Artwork and message remain subject to visual-source owner approval `[待确认]`.

## `/favicon.svg`

### Required response
- HTTP 200 with an SVG-compatible content type.
- Referenced from all three HTML routes.
- Must not be essential to understanding or operating the site.

## Cross-route regression gate

Before release:

1. Run `npm test` and `npm run build`.
2. Verify built `/`, `/privacy/`, `/terms/`, `/robots.txt`, `/sitemap.xml`, `/og-image.png`, and `/favicon.svg` exist.
3. Verify production responses and canonical URLs.
4. Run desktop and 390×844 browser smoke checks.
5. Re-review Privacy/Terms before adding analytics, accounts, cloud saves, payments, advertising, uploads, or other server-side processing.

## Approval

This contract records the live route behavior. Owner approval is still required for target audience, SEO copy freeze, visual source, legal sufficiency, long-term domain, and any future data contract.
