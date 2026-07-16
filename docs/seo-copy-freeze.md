# Bead Grid Studio — SEO & Copy Freeze Package

- **Status:** NEEDS_REVIEW
- **Scope:** Current English production pages
- **Public origin:** https://bead-grid-studio.pages.dev
- **Owner approval:** `[待确认]`
- **Last updated:** 2026-07-16

## 1. Positioning hypothesis `[待确认]`

**What:** A free browser-based fuse-bead pattern and pixel-art grid editor.

**Who:** Primarily fuse-bead crafters; secondarily small-grid pixel artists.

**Why:** Draw quickly, mirror designs, count colors, keep a portable project, and export a crisp guide without an account.

**Primary action:** Start directly on the grid, then `Export PNG`.

**Trust boundary:** Project content remains local during editing/import/export, but ordinary hosting/CDN requests and Google Fonts requests expose network metadata. Copy must not collapse this distinction into an absolute “nothing leaves your device” claim.

## 2. Frozen page matrix

| Route | Primary search intent | Title | Meta description | H1 | Status |
|---|---|---|---|---|---|
| `/` | fuse bead pattern maker; pixel art grid editor | Bead Grid Studio — Free Fuse Bead Pattern Maker | Design fuse bead patterns and pixel art in your browser. Paint, mirror, count colors, save projects, and export high-resolution PNGs for free. | Make bead patterns, one pixel at a time. | NEEDS_REVIEW |
| `/privacy/` | Bead Grid Studio privacy; local pattern storage | Privacy Policy — Bead Grid Studio | How Bead Grid Studio handles local project data and imported or exported files. | Your pattern stays in your browser. | NEEDS_REVIEW |
| `/terms/` | Bead Grid Studio terms | Terms of Use — Bead Grid Studio | Terms for using the free Bead Grid Studio browser-based pattern editor. | Use the studio thoughtfully. | NEEDS_REVIEW |

The strings above match the current production source and are frozen against casual design-stage rewriting. Changes require PRD/Route Contract review and matching SEO regression updates.

## 3. Home copy blocks

### Utility/header
- Brand: `Bead Grid Studio`
- Persistence status: `Saved locally`
- Project field: `Project`
- Core controls: `Paint`, `Erase`, `Import`, `Save JSON`, `Export PNG`

### Hero
- Eyebrow: `FROM IDEA TO PEGBOARD`
- H1: `Make bead patterns, one pixel at a time.`
- Supporting copy: `Bead Grid Studio is a free, private-in-your-browser fuse bead pattern maker. Sketch a design, test symmetry, count every color, and take a crisp guide to your craft table.`

### Benefits
1. `Draw quickly` — `Click or drag across a responsive grid built for mouse, pen, and touch.`
2. `Plan precisely` — `Mirror designs and get an instant count for every bead color.`
3. `Keep your work` — `Autosave locally, exchange JSON files, or export print-ready PNG art.`

### FAQ
- `Is Bead Grid Studio free?` — `Yes. The editor runs entirely in your browser with no account or subscription.`
- `Where is my pattern saved?` — `Your current project autosaves to this browser’s local storage. Export JSON for a portable backup.`
- `Can I use the PNG as a crafting guide?` — `Yes. Export with a white background for printing or transparency for use in other designs.`
- `Which grid size should I choose?` — `16×16 is great for small motifs, 24×24 is a flexible default, and 32×32 allows more detail.`

### Export dialog
- Heading: `PNG settings`
- Transparent: `Artwork only`
- White background: `Best for printing`
- CTA: `Download high-resolution PNG`

## 4. Message hierarchy audit

The current page passes the basic five-second test:

1. The title states “Free Fuse Bead Pattern Maker.”
2. The editor appears before explanatory marketing content, enabling immediate action.
3. The H1 and paragraph explain the craft use case and differentiators.
4. The three benefits map to drawing, planning, and preservation.
5. The main conversion action is specific (`Export PNG`) rather than generic (`Learn more`).

No invented metrics, testimonials, endorsements, “best” claim, artificial urgency, or unsupported outcome guarantee is present.

## 5. Terms requiring owner decision

### `private-in-your-browser`
**Current use:** Home supporting copy.

**Assessment:** Defensible only when read with the Privacy page: project content stays local, while hosting/CDN/font requests still occur. Retain for now, but owner should decide whether the privacy proposition warrants removing Google Fonts.

### `print-ready PNG art`
**Current use:** “Keep your work” benefit.

**Risk:** May imply calibrated physical dimensions, pagination, or guaranteed print/color fidelity, which the product does not provide.

**Recommended frozen replacement:**

`Autosave locally, exchange JSON files, or export a high-resolution PNG crafting guide.`

### `free`
**Current use:** title, meta, hero, FAQ, Terms, structured-data zero-price offer.

**Assessment:** Accurate for the current product. If monetization, paid features, usage limits, or advertising are introduced, all occurrences and structured data require review before release.

### `no account or subscription`
**Assessment:** Accurate now. Must be re-reviewed before adding authentication or payments.

## 6. Keyword and semantic coverage

### Primary
- fuse bead pattern maker
- bead pattern maker

### Secondary
- pixel art grid editor
- fuse bead pattern
- bead color count
- pegboard pattern
- PNG crafting guide

### Natural supporting concepts
- paint and erase
- mirror horizontally/vertically
- 16×16, 24×24, 32×32 grid
- local autosave
- JSON project backup
- transparent or white-background PNG

Do not force exact-match repetition into tool labels or legal copy. The current home title, description, H1, body, feature headings, and FAQ provide adequate topical clarity for the MVP.

## 7. Schema freeze

Home page:

- Type: `WebApplication`
- Name: `Bead Grid Studio`
- URL: production home canonical
- Category: `DesignApplication`
- Operating system: `Any`
- Browser requirement: JavaScript
- Offer: price `0`, currency `USD`
- Description: browser-based fuse-bead pattern and pixel-art grid editor

`FAQPage` schema is not currently shipped. Add it only if the visible FAQ remains synchronized and a current search-policy review confirms it is appropriate; rich-result eligibility must not be promised.

## 8. Compliance and prohibited claims

Do not publish without evidence/review:

- “No data leaves your device.”
- “100% private” or “anonymous.”
- “Exact” physical brand/color matching.
- “Guaranteed” bead counts, print dimensions, or craft results.
- “Official” affiliation with any bead brand.
- “Best,” “#1,” usage totals, ratings, testimonials, or endorsements.
- “Unlimited forever” or permanent-free guarantees.
- Copyright/trademark safety guarantees for user-created or imported work.

## 9. Design/frontend handoff

- Do not hide the editor behind a marketing CTA; direct use is the shortest conversion path.
- Preserve one visible H1 only.
- Preserve benefit and FAQ copy in crawlable HTML.
- Do not replace specific control labels with ambiguous labels such as “Create” or “Download.”
- Keep Privacy and Terms linked site-wide.
- Keep canonical/Open Graph/schema URLs synchronized with the live origin.
- If the recommended `print-ready` correction is accepted, update source and any exact-copy tests together.

## 10. Approval checklist

- [ ] Owner confirms fuse-bead crafters as the primary audience.
- [ ] Owner confirms pixel art as secondary rather than equal positioning.
- [ ] Owner approves “free” and no-account positioning.
- [ ] Owner accepts or replaces `private-in-your-browser`.
- [ ] Owner approves changing `print-ready PNG art` to `high-resolution PNG crafting guide`.
- [ ] Owner approves titles, descriptions, H1, benefit blocks, FAQ, and CTA labels.
- [ ] Owner approves current Pages origin or supplies the connected custom domain.
- [ ] Legal/operator review covers Privacy and Terms.
- [ ] Visual source for social preview and UI is approved.

Until these items are approved, this package is a controlled **NEEDS_REVIEW** draft, not a final business/legal sign-off.
