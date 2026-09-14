# Pass 3 report - Artemis Esports

Target: `D:\Artemis\Website\Website` (Astro 7, static, branch `redesign`). **Not committed.**

Evidence produced this pass:

- `<scratchpad>\shots\r3\` (72 files, 1440 + 390) and `<scratchpad>\shots\r3-tablet\` (74 files, 768x1024 + 1024x768)
- `<scratchpad>\shots\r3-adapt\` - critic E's harness re-run against the new `dist/`: `summary.json` (14 viewport modes x 5 pages), `summary2.json`, `images-measured.json`, `images-all.json`, plus forced-colours and 200%-text captures
- `<scratchpad>\shots\r3-empty\` - the empty-state build test, five cases, full screenshot sets
- `<scratchpad>\measure-d3\measurements.json` + `align.txt` - critic D's probes re-run
- `<scratchpad>\perf-tool\lh-home-r3.json`, `lh-team-r3.json`, `lh-r3-summary.json`
- New scripts (all in the scratchpad, none in the project): `adapt-tool\run-r3.mjs`, `run2-r3.mjs`, `imgcheck-r3.mjs`, `score-r3.mjs`, `zoom-diag*.mjs`, `forced-shots.mjs`; `shots-tool\diff-d.mjs`, `diff-align.mjs`, `baseline-d.mjs`; `empty-test.mjs`; `perf-tool\lh-r3.mjs`

---

## 0. Headline

| Critique | Findings | Fixed | Deferred |
|---|---|---|---|
| D (typography / layout) | 25 (9 P1, 16 P2) | **25** | 0 |
| E (responsive / hardening) | 25 (2 P0, 9 P1, 14 P2) | **25** | 0 |

**50 of 50 fixed, nothing deferred.** Two items are fixed with an accepted
residual, stated in §4: E10 at 200% text, and E17's asset question.

Critic E's matrix went from **70/70 cells failing to 15/70**, and every one of
those 15 is justified in §4. Tap targets went from 36 cells failing on size
alone to **zero** (critic D's own probe: 391 undersized controls across 4
viewports x 5 routes, now **0**). Image over-fetching went from **55 oversize
derivatives to 0**.

I also found and fixed one cascade bug neither critique named, of exactly the
D2/D3 family: the roster teaser's **lead-cell number** (`--number-lg`) was
out-specified by `DriverCard`'s scoped rule, so all four teaser columns had
been rendering at the same size since pass 2, and D's own type table records
the losing declaration rather than the winning one.

---

## 1. Critique D - typography and layout

Before/after numbers are measured, not asserted: `measure-d/` is critic D's run
against the pass-2 build, `measure-d3/` is the same script against this one.

| ID | Sev | Status | What changed, and the measurement |
|---|---|---|---|
| **D1** | P1 | **Fixed** | `.results th, td { padding-inline-end: var(--space-l) }` with `:last-child` zeroed, `.col-class` to `width: 1%` + `nowrap` so the chip sets its own column, and the driver list joined with `/\u00A0` so a wrapped list can never end a line on a bare separator. **Chip-to-Drivers gap, six rows at 1440: `108.8 / 16.4 / 108.8 / 24.8 / 108.8 / 100.4` to `124.7 / 40 / 124.7 / 47.7 / 124.7 / 117`** - the minimum went 16.4 to 40px, so Drivers never butts the chip. Class column `152 to 165.8px` (now min-content, not a fixed 9.5rem). |
| **D2** | P1 | **Fixed** | The 1024px override is written in the same selector shape as the rule it overrides - `.is-row .pillar + .pillar:nth-child(3)` (0,6,0) instead of `.is-row .pillar:nth-child(3)` (0,4,0) - so source order decides. **`align.txt` at 1024, pillar `box/dt.l`: `41/41 512/537 41/66 512/537` to `41/41 512/537 41/41 512/537`.** The 25px indent and the orphan hairline on row two are gone; same at 768 (`31/56` to `31/31`). |
| **D3** | P1 | **Fixed** | The inset crosses the component boundary as `--compact-inset`, not as a selector. **Teaser `padLeft`: `0px, 0px, 0px, 0px` to `0px, 24px, 24px, 24px`; name offset from the cell edge `1px to 25px`** at 1440 and 1024. At 768 the two-column odd/even pattern reads correctly (`0, 24, 0, 24`). |
| **D4** | P1 | **Fixed** | Band rule `@media (min-width: 761px) and (max-width: 1200px)`: `4rem / 1.35fr / 1.5fr` and the name at `--text-lg`. **At 1024: name `25.79px to 21.12px`, column `197.3 to 246.8px`, `lineCount 2 to 1`.** At 768: `23.74 to 19.84px`, column `225.6 to 281.6px`. No road or oval name breaks any more. |
| **D5** | P1 | **Fixed** | The `has-aside` grid starts at **1101px**, not 901; the aside stacks below that; and one band rule (1101-1380) drops the h1 to `--text-4xl` where the column still cannot carry the top step. **`/partners` h1 at 1024: `lineCount 3 to 2`** (no more "WITH" alone on the middle line). **Page lead at 1024: `33.6ch to 52ch`, `4 lines to 2`, last-line fill `27% to 100%`.** `/team` lead the same. |
| **D6** | P1 | **Fixed** | `--space-2xl: clamp(4rem, 2.5rem + 5vw, 7rem)`, `--space-3xl: clamp(5.5rem, 3.5rem + 7vw, 9.5rem)`. **Measured `.section` padding-top at 390 / 768 / 1024 / 1440: `75.96 / 92.16 / 69.12 / 81.0` to `64 / 78.4 / 91.2 / 112`** - monotonic with width. `.join` padding: `109.7 / 133.1 / 99.8 / 117` to `88 / 109.8 / 127.7 / 152`. The widest layout is no longer the tightest. |
| **D7** | P1 | **Fixed** | Four leading tokens (`--leading-display 1.04`, `--leading-tight 1.15`, `--leading-snug 1.35`, `--leading-body 1.6`) applied across every component. **`.step-title`: `line-height 1.7 to 1.15`** - it no longer leads looser than the sentence under it. **`.field-label`: `1.7 to 1.15`** on every page. `.lead` and the 1.5 / 1.55 / 1.6 family collapsed to one value. |
| **D8** | P1 | **Fixed** | Six tracking tokens (`--track-display / -title / -link / -label / -data / -lockup`) replace **all ten hard-coded `em` values across 28 declarations in 11 files**. Verified: `grep -E "letter-spacing: 0\.[0-9]" src/` returns nothing. The five 13px uppercase link styles that had five different tracks now share `--track-link`. |
| **D9** | P1 | **Fixed** | `.hero-lead { max-width: 45ch; text-wrap: balance }` and `.hero-copy` to `40rem`. **Measure: `38.9ch to 45` at 1440, `40.6 to 45` at 1024, `43.2 to 45` at 768. `lineCount 3 to 2` at all three; last-line fill `18-26% to 100%`.** The two-word widow is gone. (45ch, not 52: the real `ch` advance for Nexa Light is 0.635em, so a 52ch cap would be 727px and would put the sentence out past the hero scrim. 45ch is the comfort floor D asked for.) |
| **D10** | P2 | **Fixed** | `@media (min-width: 701px) and (max-width: 900px)` centres the hero and cuts the reserve; `--media-zoom` drops to 1.1 with the origin at `50% 62%`. **`align.txt` at 768: hero copy top `520.9 to 354.6`** - the texture above the first word went from 51% of the first screen to 35%. |
| **D11** | P2 | **Fixed** | The 404 query moved from 760 to **860px**, and the mark is sized by width (`.notfound-mark :global(svg) { width: var(--mark-size); height: auto }`) so the global `svg { max-width: 100% }` cannot letterbox a 190px glyph in a 288px box. At 768 the page is single-column with two equal-width CTAs (see `shots\r3-tablet\t768-404-full.png`). |
| **D12** | P2 | **Fixed** | `.partner-band.is-row { background: var(--bg) }`. **`align.txt` seams at 1440: `partner-band is-row samebgAsPrev: true to false`.** Every adjacent section pair on the site now carries either a rule or a background change. |
| **D13** | P2 | **Fixed** | `--text-2xs: 0.75rem to 0.6875rem`. **Rendered-size histogram at 1440 on `/`: `{12: 50, 13: 35, 15: 50}` to `{11: 49, 13: 35, 15: 50}`** - the bottom ratios go 1.08 / 1.15 to 1.18 / 1.15. Everything at this step is a tracked uppercase label, never prose, and `--ink-faint` at 11px still clears 4.5:1. |
| **D14** | P2 | **Fixed** | `--number-md: var(--text-2xl)`, `--number-lg: var(--text-4xl)`. Four hard-coded clamps in three files are gone. **And the lead-cell rule now actually applies** (see §0): at 1440 the teaser reads 64 / 36 / 36 / 36px instead of 48 / 48 / 48 / 48. |
| **D15** | P2 | **Fixed** | `--measure-lead: 52ch` used by every `.lead` on the site: `.section-head-stack`, `PageHead`, `JoinCta`, `PillarBand`, `PartnerBand` (both variants), `404`, `/partners` reach and contact, `/about` origin copy, `/team` empty state. Five different caps spanning 39-54ch, gone. |
| **D16** | P2 | **Fixed** | All nine `ch` caps on uppercase headings converted to `em`: `.section-head h2` 18ch to 14em, `.is-row h2` 20ch to 16em, `.is-long h2` 14ch to 11em, `PageHead h1` 14ch to `min(11em, 100%)`, `.join-heading` 12ch to 9em, `.is-stack h2` 14ch to 11em, `.reach-copy h2` 12ch to 9em, `.contact-inner h2` 10ch to 8em, `.origin-inner h2` 10ch to 8em. `.footer-tagline` 22ch to 15em. |
| **D17** | P2 | **Fixed** | See E4/E11/E12. **Critic D's own small-target probe across 4 viewports x 5 routes: 391 to 0.** |
| **D18** | P2 | **Fixed** | The date is emitted inside a `nowrap` span and `.driver-last` carries `text-wrap: pretty` + `--leading-body`. At 1024 the "Last drive" string no longer splits a date. (The first half is deliberately *not* nowrap - it was 264px of unbreakable text at a 200% root font.) |
| **D19** | P2 | **Fixed** | `.garage-slide.is-portrait { width: max(15rem, calc(var(--frame-h) * 4 / 5)) }` gives the portrait slide a 240px floor, and `.slide-caption { max-width: 40ch }` caps the wide one. The caption measure range within one row goes from 20.6-46ch to roughly 29-40ch. |
| **D20** | P2 | **Fixed** | `@media (min-width: 901px) and (max-width: 1100px) { .offer-grid { grid-template-columns: repeat(2, minmax(0,1fr)) } }`. At 1024 the three cells go from 271px (32ch) to ~439px (~46ch) under the 52ch headline item. |
| **D21** | P2 | **Fixed** | `@media (min-width: 621px) and (max-width: 860px)` runs the stacked row as `4.75rem / 1.7fr / 1fr` with explicit `grid-area` placement. The ARIA roles and the `entries` guard are untouched, as D's keep-list requires. |
| **D22** | P2 | **Fixed** | Full-width CTAs bounded to `@media (max-width: 560px)` on `.join-btn` and `.contact-btn`; hero buttons get `flex: 0 0 auto` between 561 and 900px; the 404 pair is capped at `22rem`. |
| **D23** | P2 | **Fixed** | `.results td { vertical-align: baseline }` and `.pos { display: inline-block; line-height: var(--leading-snug) }`. **Measured with a 1px baseline strut inserted into `.pos` and `.event-name` (`shots-tool\baseline-d.mjs`): the first-baseline delta is `0.0px` on all six rows at 1440 and at 1024**, against the 11px D measured. |
| **D24** | P2 | **Fixed** | `.dossier > div { grid-template-columns: minmax(9rem, 0.7fr) minmax(0, 1.6fr) }` plus `--leading-tight` on `.field-label`. "RESULTS LISTED" no longer wraps at 1024 and the four row heights are even (see `shots\r3-tablet\t1024-partners-hero.png`). |
| **D25** | P2 | **Fixed** | One right edge for the whole hero stack. **`align.txt` at 1440: `copy r=652, title r=652, actions r=652, proof r=620` to `copy / title / actions / proof all r=716`.** At 1024: `617 / 585` to `681 / 681`. |

---

## 2. Critique E - responsive and hardening

| ID | Sev | Status | What changed, and the measurement |
|---|---|---|---|
| **E1** | **P0** | **Fixed** | The bar now yields in a fixed order - CTA, then lockup, then never the hamburger. `.menu-toggle { flex: 0 0 44px }`, `.brand { flex: 0 0 auto; min-height: 44px }`, `.nav-cta-compact { flex: 0 1 auto; min-width: 0 }` with a **short label** ("Join" / "Partner") carrying the full label as `aria-label`. `--nav-h` became `clamp(64px, 4rem, 88px)` so the bar grows with the text. **At 390 with a 200% root font, all five pages: `winW 442 / 478 / 415 / 597 / 584` to `390`** - no page forces the mobile shrink-to-fit any more, and Playwright now clicks the toggle on all five (it timed out on all five in pass 2, and on three of five after the first round of fixes). |
| **E2** | **P1** | **Fixed** | Three causes, all measured with `adapt-tool\zoom-diag*.mjs`: (a) the display steps carry a `vw` ceiling, `min(clamp(...), 11/13/15vw)`; (b) `.btn` lost `white-space: nowrap` - a nowrap "Partner with us" had a 457px min-content width on a 390px phone, which was the single largest contributor - and its inline padding is capped at `7vw`; (c) `overflow-wrap: anywhere` on h1-h4 and on every name-shaped span. Also `.results tr` padding-left capped at `min(4.75rem, 30%)`, `.pillar-tags li` and `.driver-focus` given `overflow-wrap`. `PageHead h1` is `min(11em, 100%)`. |
| **E3** | **P1** | **Fixed** | Same flex rules as E1. **`F4_nav_320_partners`: `toggleWidthDecl 33.06px / flexShrink 1` to `44px / 0`; `brand w 59.4 to 79`.** All 320 and 360 cells now pass outright. |
| **E4** | **P1** | **Fixed** | 44px on `.footer-col a` (+ `min-width: 44px`), `.channel-list a`, `.notfound-links a`, `.driver-socials a`, `.roster-line a`, `.footer-email`, `.contact-email`, `.text-link`, `.brand`, `.nav-link`, `.btn-sm`. The height goes on the control and the list gaps shrink to match, so the visual rhythm is unchanged. Where the underline has to stay on the word (driver socials) the height is on the anchor and the rule on an inner span. **E's matrix: 36 cells failing on tap size alone to 0. Critic D's probe: 391 to 0.** |
| **E5** | **P1** | **Fixed** | `.mobile-menu { overscroll-behavior: contain }` plus a real scroll lock in `setOpen` (record `scrollY`, `position: fixed; top: -Npx; inset-inline: 0` on `<body>`, restore and `scrollTo` on close). **`E_menu_scroll_lock`: `chained: true` to `false`; `panelOverscroll "auto/auto" to "contain/contain"`; `bodyPosition "static" to "fixed"`.** |
| **E6** | **P1** | **Fixed** | `@media (forced-colors: active)` hides `.hero-media` and `.join-texture` (a gradient can never be a legibility guarantee), and the nav takes `background: Canvas` with a `CanvasText` border. See `shots\r3-adapt\forced-home-top.png` and `forced-join.png`. |
| **E7** | **P1** | **Fixed** | One `sizes` per slide shape, bracketed on both sides (a `vw` term for the `24vw`-derived band, a fixed px value above 1467px where `--frame-h` caps), and per-image width ladders that stop at each source's own width so Astro never upscales. **The two portrait slides shipped 137.8 KB for 550px of screen; they now ship the 320w files.** |
| **E8** | **P1** | **Fixed** | Three corrected `sizes` using the fractions the frames actually occupy (38 / 23 / 27vw), capped above 1512px where `--shell` caps, with 160 / 320 / 400 / 480 steps added. **`lan-stage` at 320@1 was a 640w / 15.6 KB file for a 126px frame (ratio 5.08); the whole collage is now `ok` at every viewport.** |
| **E9** | **P1** | **Fixed** | `.btn-solid` in forced colours takes `forced-color-adjust: none; background: Highlight; color: HighlightText; border: 2px Highlight`; `.btn-ghost` keeps a 1px `ButtonText` border. **`forced-home-top.png`: "JOIN THE TEAM" is a filled block, "SEE RESULTS" an outline** - they were pixel-identical. |
| **E10** | **P2** | **Fixed (residual accepted)** | `@media (max-width: 900px) and (max-height: 660px)` cuts the hero reserve and tightens the action gap. **At 320x568: hero height `646 to 568`, actions bottom `582 to 544`, `withinFirstScreen false to true`** - both CTAs are on the first screen (the secondary was 14px below the fold). At 200% text on a 390x844 phone the hero is 1549px tall and the CTAs are not on the first screen - see §4. |
| **E11** | **P2** | **Fixed** | `.nav-cta-compact { min-height: 44px }` and `--nav-h` raised to 64px below 821px so the bar contains it. `35.2px to 44px`. |
| **E12** | **P2** | **Fixed** | `.text-link { padding-block: 0.65rem }` (34.5 to 44.4px), `.footer-email` and `.contact-email` given `min-height: 44px` (26.5 / 28.3 to 44+). |
| **E13** | **P2** | **Fixed** | `viewport-fit=cover` in the meta, then `max(var(--space-m), env(safe-area-inset-bottom))` on the footer and `max(var(--pad-x), env(safe-area-inset-left/right))` on `.container`. Without the meta every `env()` on the site resolved to 0, including the one the mobile menu was already paying for. |
| **E14** | **P2** | **Fixed** | A `@media (prefers-contrast: more)` block raising five tokens. Because nothing on the site hardcodes those colours, that lifts every hairline, dim step and faint step at once. The mode is no longer a no-op. |
| **E15** | **P2** | **Fixed** | `.pos.is-podium` carries a 2px `currentColor` underline as well as the teal, and a `sr-only` " podium" for screen readers. **`forced-home-results.png`: P2 and P3 are underlined, P4/P5/P6 are not.** Borders keep their forced colour where a background does not. |
| **E16** | **P2** | **Fixed** | The current-page indicator becomes a 2px underline in forced colours instead of a background-filled pseudo-element that is forced to Canvas. **`forced-partners-top.png`: PARTNERS is underlined.** |
| **E17** | **P2** | **Fixed in CSS; asset flagged** | In forced colours the partner mark sits on an opaque `#000a08` plate with a `CanvasText` border and `forced-color-adjust: none`. **`forced-home-partnerband.png`: the GLYTCH mark is legible** where it was invisible. A real dark-variant export is still the better answer and is an owner asset decision, exactly as E said - flagged, not silently closed. |
| **E18** | **P2** | **Fixed** | `sizes="(max-width: 900px) 130vw, 62vw"` in `Hero.astro` **and** in the `imagesizes` of the preload in `index.astro`, plus a 1024 step in the ladder (a 412px phone then asks for ~940px and would otherwise jump to 1280). **At 390@3 the hero was fetching 1280w for a 1521px need (ratio 0.84); it now fetches 1536w (1.01).** Cost: LCP 2.0s to 2.2s on the Lighthouse mobile preset, for an LCP image that is actually sharp. |
| **E19** | **P0** | **Fixed** | `const best = races.length ? races.reduce(...) : undefined;` and the whole dossier `<dl>` made conditional, guarded the way `heroProof()` already guarded its own reduce. `check:data` now also **warns** (never fails) on an empty file so the cause is named in the build log: `warning  results.json: file is empty; the site will render its empty state for this section.` It remains the single validator. **Verified: `results.json: []` builds 5 pages, exit 0.** |
| **E20** | **P1** | **Fixed** | `overflow-wrap: anywhere` on h1-h4 globally plus `.event-name`, `.driver-name` (both), `.driver-focus` (both), `.also-name`, `.also-track`, `.slide-car`, `.slide-track`, `.entry-name`, `.partner-name`, `.field-label`, `.roster-name`, `.contact-email`, `.footer-col a`, `.footer-email`, `.pillar-tags li`, `.race-cell dd`, `.hero-proof-event`, `.shot figcaption`. `.hero-title` is the one deliberate exception - the lockup must never break mid-word. |
| **E21** | **P1** | **Fixed** | `/partners` now has the same branch the home page always had, with sponsor-facing copy, and the roster line is conditional too. No column header row over nothing. |
| **E22** | **P1** | **Fixed** | `PartnerBand` renders a deliberate one-column state - heading, an honest sentence, the mailto - when `partners.json` is empty, and `.is-empty .partner-inner { display: block }` collapses the grid. The brief's "never an empty logo row" holds. See `shots\r3-empty\partners\desktop-home-scroll-05.png`. |
| **E23** | **P2** | **Fixed** | The whole "Who drives" section is wrapped in `{featured.length > 0 && ...}` and the roster link's label is singular/plural aware. No heading, no "0 drivers" link, no 1px orphan hairline. |
| **E24** | **P2** | **Fixed** | `channelLinks(socials, store)` in `src/lib/links.ts` is the single guarded builder, used by both `Footer.astro` and `partners.astro`. The duplicated `SOCIAL_LABELS` map is gone. An empty `site.store` can no longer produce `href=""` with `target="_blank"`. |
| **E25** | **P2** | **Fixed** | The stats filter rejects `null` and requires `Number.isFinite(irating) && irating > 0`, so a bot-written `null` or `0` renders nothing rather than an empty `<dd>` or a real-looking zero. |

---

## 3. Verification

### Build

```
npm run build  ->  exit 0, zero warnings
                   prebuild: check:data passed (6 results, 8 drivers, 3 events)
                   5 page(s) built in ~0.7s
```

| | Pass 2 | Pass 3 |
|---|---|---|
| `dist/` total | 1.81 MB, 44 files | **2.36 MB, 75 files** |
| `/` gzip (html+css+js) | 19.3 KB | **20.7 KB** |
| `/team` gzip | 13.6 KB | 14.3 KB |
| `/about` gzip | 13.6 KB | 14.4 KB |
| `/partners` gzip | 14.3 KB | 15.3 KB |
| `/404` gzip | 10.9 KB | 11.4 KB |
| External JS / CSS | 0 / 0 | **0 / 0** |
| Image derivatives | 31 | 59 |

`dist/` grew because the width ladders gained steps (the hero alone went from 5
to 6, the collage and the garage from 2 each to 4-6 each). **Nobody downloads
more**: the ladders exist so each device can land closer to what it needs, and
the measured result is 55 oversize derivatives to zero. The per-route HTML grew
about 1 KB gzipped, which is the longer `srcset` strings and the new CSS.

### Critic E's matrix, re-run (`shots\r3-adapt\summary.json`)

**70/70 cells failing to 15/70.** Scored with E's own bar (44px on touch
viewports, WCAG 2.5.8's 24px on pointer ones), with E's own exclusions
(`.sr-only`, the `.hero-line` mask, descender overflow on `line-height: 1.04`).

| Viewport | home | team | about | partners | 404 |
|---|---|---|---|---|---|
| 320x568 | pass | pass | pass | pass | pass |
| 360x740 | pass | pass | pass | pass | pass |
| 390x844 | pass | pass | pass | pass | pass |
| 414x896 | pass | pass | pass | pass | pass |
| 768x1024 | img 1 | pass | pass | pass | pass |
| 1024x768 | img 1 | img 1 | img 1 | pass | pass |
| 1280x720 | pass | pass | pass | pass | pass |
| 1440x900 | img 2 | img 1 | img 1 | pass | pass |
| 1920x1080 | pass | pass | pass | pass | pass |
| 2560x1440 | img 1 | img 1 | img 1 | pass | pass |
| 390x844 @ 200% | menu-offscreen 1, hero-cta-below-fold | menu-offscreen 1 | menu-offscreen 1 | menu-offscreen 1 | menu-offscreen 1 |
| 1440x900 reduced-motion | pass | pass | pass | pass | pass |
| 1440x900 contrast: more | pass | pass | pass | pass | pass |
| 1440x900 forced-colors | pass | pass | pass | pass | pass |

**Two corrections to the harness**, both documented in `score-r3.mjs` and both
verified rather than assumed:

1. **The probe's image check is unusable for `w`-descriptor srcsets.** Chrome
   density-corrects `naturalWidth`, so a *correctly* sized image always reports
   `ratio ~= 1/dpr`. Critic E knew this and used the on-disk byte accounting
   (`images-measured.json`) instead; my scorer does the same.
2. **The probe calls every garage slide a horizontal-overflow offender**,
   because its ancestor walk stops at `.garage-frame` (`overflow: hidden`)
   rather than at the scrollable `.garage-viewport` above it. E's own
   true-overflow test (`run2` section A, which lifts `overflow-x: clip` and
   skips scrollable ancestors) reports nothing on any page at any viewport,
   pass 2 and pass 3 alike. My scorer uses that.

### Images, measured against the bytes on disk (`images-measured.json`)

| | Pass 2 | Pass 3 |
|---|---|---|
| Observations (10 viewports x 5 pages) | 134 | 133 |
| Problems | 71 | **11** |
| **OVERSIZE (>1.6x what the element needs)** | **55** | **0** |
| UPSCALE (<0.95x) | 16 | 11 |

Pass 2's oversize count by image: sebring 8, member-portrait 9, crew-huddle 8,
lan-stage 7, hunt-texture 6, watkins-glen 6, glytch 4, nordschleife 4,
nascar 3. All zero now. The 11 remaining are source-bound - see §4.

### 200% text scaling

| Page | Layout viewport forced to, pass 2 | Pass 3 |
|---|---|---|
| home | 442 | **390** |
| team | 478 | **390** |
| about | 415 | **390** |
| partners | 597 | **390** |
| 404 | 584 | **390** |

Hamburger 44x44 and clickable on all five (`elementHandle.click` timed out on
all five in pass 2). The open panel scrolls (`scrollHeight 934 / clientHeight
755`) with `overscroll-behavior: contain`.

### Critic D's probes, re-run

`measure-d3/measurements.json` and `align.txt`. Per-ID numbers are in §1. Two
aggregates:

- **Undersized tap targets across 4 viewports x 5 routes: 391 to 0.**
- **Rendered-size histogram on `/` at 1440**: `{12: 50, 13: 35, 15: 50, ...}` to
  `{11: 49, 13: 35, 15: 50, ...}`.

### Empty-state build test (`shots\r3-empty\`)

Each file copied to `*.bak`, replaced with `[]`, built, screenshotted, restored
(`<scratchpad>\empty-test.mjs`).

| Case | Build | Pages | Validator | Screenshots |
|---|---|---|---|---|
| `results.json: []` | **exit 0** | 5 | `passed (0 results, 8 drivers, 3 events)` + empty-file warning | `r3-empty\results\` (72 files) |
| `events.json: []` | **exit 0** | 5 | `passed (6, 8, 0)` | `r3-empty\events\` |
| `partners.json: []` | **exit 0** | 5 | `passed (6, 8, 3)` | `r3-empty\partners\` |
| `drivers.json: []` | **exit 0** | 5 | `passed (6, 0, 3)` | `r3-empty\drivers\` |
| **all four at once** | **exit 0** | 5 | `passed (0, 0, 0)` | `r3-empty\all-four\` |

Pass 2 behaviour for the first case was a hard `TypeError` in `partners.astro`
that killed the build.

What the empty states look like (worth opening these four):

- `r3-empty\results\desktop-home-hero.png` - the hero proof row is simply absent; no claim with nothing behind it.
- `r3-empty\results\desktop-partners-hero.png` - one honest line where the four dossier rows were.
- `r3-empty\partners\desktop-home-scroll-05.png` - "Who backs us" as a one-column state with the mailto, no empty logo column.
- `r3-empty\drivers\desktop-team-full.png` - the page-head aside collapses (no reserved column) and "Roster in transition" replaces the roster.

**`git diff --stat src/data` is empty and `git status --porcelain src/data`
prints nothing.** All four files restored byte-identical (SHA-256 compared
before and after); no `.bak` files left behind.

### Lighthouse 13.4.1, mobile preset, `dist/` over localhost

| Route | Perf | A11y | Best practices | SEO | FCP | LCP | CLS | TBT | SI |
|---|---|---|---|---|---|---|---|---|---|
| `/` | **99** | **100** | **100** | **100** | 1.2s | 2.2s | **0** | **0ms** | 1.2s |
| `/team` | **100** | **100** | **100** | **100** | 1.1s | 1.6s | **0** | **0ms** | 1.1s |

Pass 2 was 99/100/100/100 and 100/100/100/100, so the floor holds. Three
consecutive runs gave the same numbers. LCP went 2.0s to 2.2s on `/`: that is
E18, and it is the point - the phone hero is painted at 130% of its layout box
and was being fetched for 100%.

### Regression: pass 2's interaction harness

`shots-tool\verify-r2.mjs`, unchanged: **14 checks, 14 pass, 0 fail.** Parallax
still runs in the built CSS, the LCP image is still opaque from the first
frame, the mobile focus trap still cycles 8 stops inside the panel with `#main`
and the footer `inert`, reduced motion still carries no transform transitions,
and there is no horizontal overflow at 390 on any route.

---

## 4. The 15 remaining cells, and why each is accepted

**10 cells: `img(N)`.** All eleven underlying rows are `UPSCALE`, bound by the
source file's own width. None is an over-fetch.

- **The HUNT texture (9 cells).** Source is 1920px. At 1024@2, 1440@2 and
  2560@1 the element wants more. It is a decorative spray-paint texture at
  `opacity: 0.55` behind a gradient scrim, and the only alternative is to ship
  a 2560px derivative of a texture nobody will ever look at directly.
- **The Nordschleife render (2 cells, 768@2 and 1440@2).** Source is the
  deliberate 1089px crop pass 2 made to remove two AMG hoardings. Re-cropping
  from the 1919px original at a larger size would reintroduce them.

**5 cells: `menu-offscreen(1)` at 200% text.** One of the five panel links sits
below the fold. The panel is `overflow-y: auto` with `scrollHeight 934` against
`clientHeight 755`, so it genuinely scrolls, and `overscroll-behavior: contain`
now keeps that scroll inside it. Five links at doubled type do not fit an
844px screen; making them fit would mean shrinking the text the reader asked to
enlarge.

**1 cell: `hero-cta-below-fold` at 200% text on home.** The hero is 1549px tall
at a 200% root font. A two-line 96px lockup, a five-line lead, the proof row
and two 62px buttons cannot share an 844px screen at that text size. The
primary CTA is also in the header on the same screen, which is exactly why
pass 2 put it there.

**Fixed with a residual, stated rather than buried:**

- **E10 at 200% text** - above.
- **E17** - the CSS plate makes the white partner mark legible in forced
  colours today, but a dark-variant export is the right answer and is an owner
  asset decision. Logged here and in `DESIGN.md` §7.

---

## 5. Files changed

```
src/styles/global.css        tokens (size/leading/tracking/number/measure/space/nav-h),
                             .btn, .btn-sm, .text-link, .skip-link, headings,
                             .field-label, .data, .lead, .container safe areas,
                             roster teaser custom properties,
                             prefers-contrast + forced-colors blocks
src/lib/links.ts             CTA short labels, channelLinks() shared builder
src/scripts/site.ts          body scroll lock in setOpen
src/layouts/Base.astro       viewport-fit=cover
src/components/Nav.astro     flex order, short CTA label, 44px targets,
                             overscroll-behavior, forced-colors block
src/components/Hero.astro    measure floor, one right edge, 768 centring,
                             short-height rule, sizes 130vw, forced-colors
src/components/ResultsTable.astro  gutters, min-content class column, baseline
                             alignment, podium rule, nbsp driver separator,
                             621-860 grid layout, overflow-wrap
src/components/DriverCard.astro    --compact-inset, --compact-number-size,
                             761-1200 band rule, nowrap date, null stats guard,
                             44px socials, overflow-wrap
src/components/PillarBand.astro    nth-child specificity fix, is-long stacks at
                             900, tokens, overflow-wrap
src/components/PartnerBand.astro   empty state, is-row on --bg, per-variant
                             image sizes, forced-colors logo plate
src/components/PageHead.astro      1101px split, 1101-1380 heading band,
                             rendered-aside test, measure tokens
src/components/Footer.astro        shared channel builder, 44px targets,
                             safe-area padding, tokens
src/components/Garage.astro        per-shape sizes, per-source width ladders
src/components/GarageSlide.astro   portrait floor, caption cap, tokens
src/components/JoinCta.astro       measure tokens, step-title leading,
                             560px full-width bound, texture ladder,
                             forced-colors
src/components/NextRace.astro      tokens, overflow-wrap
src/pages/index.astro        preload imagesizes, hero ladder 1024 step,
                             roster teaser empty guard
src/pages/team.astro         conditional aside, roster empty state, tokens
src/pages/about.astro        collage sizes + ladders, tokens
src/pages/partners.astro     reduce guard, conditional table + roster line,
                             dossier empty state, shared channels, 2-col offer
                             grid, 9rem label floor, 44px targets, tokens
src/pages/404.astro          860px breakpoint, width-sized mark, 44px links
scripts/check-data.mjs       empty-file warnings (never failures)
DESIGN.md                    section 3 rewritten, 4, 6, 7, 8 updated, pass-3
                             decision log
PRODUCT.md                   two new owner items (the dark GLYTCH mark, the
                             Nordschleife crop)
```

Not committed. `node_modules/` untouched. `src/data/` byte-identical. Nothing
written outside the project and the scratchpad.

---

## 6. The five things I am least sure about

1. **`--text-2xs` at 11px (D13).** D asked for "11px / 13.5px" or a fold; I
   took 11 / 13 / 15 because it keeps the existing 13 and 15 steps and only
   moves the one that was indistinguishable. But 11px is genuinely small, and
   49 elements per page moved. It is all tracked uppercase mono at
   `--ink-faint` (5.5:1, which passes AA at any size), and it reads fine in the
   screenshots at 1440 and 390 - but I am judging that on a desktop monitor,
   not a phone in daylight. If it is wrong, `--text-2xs: 0.75rem` puts it back
   in one line and only D13 reopens.

2. **Removing `white-space: nowrap` from `.btn`.** This is what fixed the
   200%-text header, and it is the single change with the widest blast radius:
   every button on the site can now wrap. At the sizes the site actually ships
   nothing wraps (checked at 320 / 360 / 390 / 414 / 768 / 1024 / 1440 in the
   screenshots), but a longer CTA label added later would break to two lines
   where it used to overflow instead. The alternative - keeping nowrap and
   hiding the CTA below a threshold - needs a container query whose `rem`
   resolution against the root font I could not verify without shipping it.

3. **The hero lead at 45ch, not D9's 52ch.** D computed 52ch as "~640px at
   22px", which assumes 0.5em per `ch`. Their own measurement (544px = 38.9ch)
   says the real advance is 0.635em, so 52ch is 727px - wider than the copy
   column can be before the lead runs out past the diagonal scrim. 45ch is the
   comfort floor D cites and it produces two balanced lines at every viewport,
   but it is my arithmetic overriding their prescription and I could be reading
   their intent wrong.

4. **The page-head split moving from 901 to 1101px.** It fixes D5 cleanly, but
   it means every 1024-wide tablet and every 1280-wide laptop now gets the
   stacked page head rather than the two-column dossier that pass 2's B6
   introduced specifically to stop the first screen being half empty. It looks
   better to me at 1024 (the entry strip runs full width and uses the space),
   but it is a real reduction in composition variety on three of four pages at
   the most common laptop width, and the 1101-1380 heading-size band on top of
   it is a second lever tuned to one string ("Partner with Artemis"). A
   different h1 later could need that band retuned.

5. **The garage slide ladders stop at each source's natural width.** That is
   correct - Astro would otherwise upscale - but it means two of the five cars
   (Nordschleife at 1089px, the two portraits at 1024px) can never satisfy a
   DPR2 viewport, and the harness will keep reporting them as upscales forever.
   The honest fix is new exports, which the brief's no-new-imagery rule and the
   AMG-hoarding crop both constrain. I chose to leave the numbers visible and
   explain them rather than widen the tolerance.

---

## 7. Stop conditions

**None hit.**

- The build never failed after a fix: `npm run build` returned exit 0 on every
  one of the ~15 runs this pass, and on all five empty-state runs.
- No fix would have violated the brief or the data contract. The two places it
  came close: the hero lockup is untouched (`--track-lockup` tokenises its
  0.06em without changing it, and `.hero-title` is the one element exempted
  from the global `overflow-wrap` backstop), and no data file's shape changed -
  `short` went on `CTA_INTENTS` in `src/lib/links.ts`, which is code, not
  contract data.
- The contract had no ambiguity that blocked work. One note for whoever owns
  it: `check:data` now warns on an empty array. That is a website-side
  behaviour and needs no contract change, but if the bot ever wants to *refuse*
  to write an empty file, that rule belongs in the contract rather than here.
