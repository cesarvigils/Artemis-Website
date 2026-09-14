# Pass 4 — Critique G: technical quality (a11y, perf, SEO, robustness)

Reviewer role: technical quality auditor, **read-only**. Nothing in
`D:\Artemis\Website\Website` was edited; the only writes are in the scratchpad.
Target: the **built** `dist/` (Astro 7, `format: 'directory'`, branch `redesign`,
not committed), served over `http://127.0.0.1` by a local static server that
returns `404.html` with a 404 status for unmatched routes — the way Vercel does.

Build before auditing: `npm run build` → exit 0, `check:data` passed
(6 results, 8 drivers, 3 events), **5 pages in 679 ms**, zero warnings.
`dist/` = **2.36 MB across 75 files**, zero non-webp images in `_astro`.

Method: `anthropic-skills:impeccable` `audit` flow (`reference/audit.md`) plus
`reference/optimize.md`. Tools, all installed in `<scratchpad>\audit-tool\`:
**axe-core 4.13.0**, **html-validate 11.15.0**, **playwright-core** driving the
OS Chrome, and **Lighthouse 13.4.1** (already in `<scratchpad>\perf-tool\`).

Evidence produced this pass (all under `<scratchpad>`):

| File | What it is |
|---|---|
| `audit-tool\axe-run.mjs` + `axe-results.json` | axe over 5 pages × 2 viewports + the open mobile menu |
| `audit-tool\axe-detail.mjs` | per-node check messages and measured ratios for every contrast finding |
| `audit-tool\kbd.mjs` + `kbd-results.json` | tab order with CDP-computed accessible names, headings, landmarks, alt, links, `aria-current`, tables |
| `audit-tool\sem2.mjs` | table AX subtree at 1440 / 768 / 390; link-text uniqueness |
| `audit-tool\hv.json` + `.htmlvalidate.json` | html-validate output, `html-validate:recommended` |
| `audit-tool\lh4.mjs` + `lh4-*.json` + `lh4-summary.json` | the 5 Lighthouse runs |
| `audit-tool\robust.mjs` | JS-off, reduced motion, print, 200% text, hero geometry |
| `audit-tool\lcp.mjs` / `lcp2` / `lcp3` / `lcp4` | LCP candidate tracing under four throttling conditions |
| `audit-tool\contrast.mjs` | pixel sampling of the real backdrop behind every "needs review" text |
| `audit-tool\fonts.mjs` | which faces render above the fold per page |
| `shots\r3-audit\` | 27 files: focus rings, skip link, open menu, no-JS, reduced motion, 200% text, print PDFs, `entrance-frozen-t0.png` |

---

## 0. Headline

**The site is in very good technical shape.** axe reports **zero WCAG 2.0/2.1/2.2
A and AA violations on all five pages at both viewports**. Lighthouse is
**99/100/100/100** on `/` and **100/100/100/100** on `/team`, `/about`,
`/partners` and on `/` at the desktop preset. CLS is a measured **0** everywhere,
TBT **0 ms** everywhere. Every pass-3 fix I re-tested still holds: 200% text,
reduced motion, the focus trap, Escape, the scroll lock, the skip link, tap
targets.

Two things are actually wrong, and one of them is the kind of bug that only
shows up when you stop the clock:

1. **G1 (P1).** The hero and the three inner page heads animate **from
   `opacity: 0`** with `animation-fill-mode: both`. Frozen at document-timeline
   `t=0`, the home first screen is a photograph and nothing else — no headline,
   no claim, no proof row, **no CTAs** (`shots\r3-audit\entrance-frozen-t0.png`),
   and the `<h1>` of `/team`, `/about` and `/partners` is invisible. This is the
   exact failure mode `DESIGN.md` §5 claims the site does not have ("Nothing is
   ever animated from `opacity: 0` … a paused tab, a headless renderer or an
   observer that never fires can only cost the reader an offset, not the
   section"). It is true of `.reveal` and of `[data-enter-media]`; it is false of
   `[data-enter]`. It also costs measurable LCP: on `/team` FCP is 1.1 s and LCP
   is 1.7 s, and Lighthouse names `p.lead` — a `[data-enter]` element whose
   entrance is `120 ms + 560 ms = 680 ms` — as the LCP element.
2. **G2 (P1).** Below 860px `.results thead { display: none }` deletes the
   column-header row from the accessibility tree. Measured: at 1440 the first
   `<th>` is `{role: "columnheader", name: "POS"}`; at 390 and at 768 it is
   `{role: "none", ignored: true}` and the whole `thead` rowgroup collapses to
   six ignored nodes. The explicit ARIA roles survive the `display: block`
   stacking — the header row does not, because `display: none` removes it. Only
   two of the five columns recover a label (the `::before` "DRIVERS:" /
   "DATE:").

Everything else is P2 hardening or P3 polish. The `vercel.json` the project does
not yet have is the single highest-value P2: there are **no security headers at
all** today, and no long-lived cache headers on the hashed `_astro` assets.

---

## 1. axe-core 4.13.0 — results per page

Run with `runOnly` over `wcag2a, wcag2aa, wcag2aaa, wcag21a, wcag21aa, wcag22aa,
best-practice, ACT, experimental` and every `cat.*` tag — i.e. **all rules**.
1440×900 (DPR 1) and 390×844 (DPR 3), `networkidle` + 1.2 s, scrolled to top.

| Page | Viewport | Violations (rules / nodes) | Rule ids | "Needs review" (rules / nodes) | Rule ids |
|---|---|---|---|---|---|
| `/` | 1440 | 1 / 51 | `color-contrast-enhanced` | 3 / 35 | `color-contrast-enhanced` 5, `color-contrast` 26, `hidden-content` 4 |
| `/` | 390 | 1 / 39 | `color-contrast-enhanced` | 3 / 43 | `color-contrast-enhanced` 1, `color-contrast` 38, `hidden-content` 4 |
| `/team` | 1440 | 1 / 17 | `color-contrast-enhanced` | 3 / 29 | `color-contrast-enhanced` 5, `color-contrast` 20, `hidden-content` 4 |
| `/team` | 390 | 1 / 17 | `color-contrast-enhanced` | 3 / 8 | `color-contrast-enhanced` 1, `color-contrast` 4, `hidden-content` 3 |
| `/about` | 1440 | 1 / 8 | `color-contrast-enhanced` | 3 / 17 | `color-contrast-enhanced` 5, `color-contrast` 8, `hidden-content` 4 |
| `/about` | 390 | 1 / 8 | `color-contrast-enhanced` | 3 / 8 | `color-contrast-enhanced` 1, `color-contrast` 4, `hidden-content` 3 |
| `/partners` | 1440 | 1 / 29 | `color-contrast-enhanced` | 3 / 14 | `color-contrast-enhanced` 5, `color-contrast` 5, `hidden-content` 4 |
| `/partners` | 390 | 1 / 25 | `color-contrast-enhanced` | 3 / 6 | `color-contrast-enhanced` 1, `color-contrast` 1, `hidden-content` 4 |
| 404 (`/this-page-does-not-exist`) | 1440 | 1 / 5 | `color-contrast-enhanced` | 3 / 14 | `color-contrast-enhanced` 5, `color-contrast` 5, `hidden-content` 4 |
| 404 | 390 | 1 / 5 | `color-contrast-enhanced` | 3 / 5 | `color-contrast-enhanced` 1, `color-contrast` 1, `hidden-content` 3 |
| `/` **menu open** | 390 | **0 / 0** | — | 1 / 1 | `skip-link` 1 |

**At WCAG A and AA — including 2.1 and 2.2 — there are zero violations on every
page at both viewports.** The single rule that fires is `color-contrast-enhanced`
(`wcag2aaa`, SC 1.4.6, the 7:1 bar), which I included on purpose.

### 1.1 The one violating rule, with the measured numbers

Every failing node reports the **same** ratio, **5.49:1**, against an expected
7:1. Two colour pairs only:

| fg | bg | ratio | Where |
|---|---|---|---|
| `#7a8986` (`--ink-faint` over `--bg`) | `#000a08` | **5.49:1** | `.hero-pos-field`, `.hero-proof-meta`, `.pos-field`, `.event-series`, `.chip`, `.date-value`, `th.field-label` |
| `#7c8d89` (`--ink-faint` over `--bg-raise`) | `#03120e` | **5.49:1** | `.race-cell dt`, `.race-status`, `.also-date`, `.also-status`, `.field-label`, footer `h2`, `.footer-copy`, `.footer-note`, `.driver-meta`, `.roster-count`, `.page-meta`, dossier `dt` |

All of it is `--ink-faint` at `--text-2xs` (11px) or `--text-xs` (13px), on
tracked uppercase mono labels and meta lines. **5.49:1 passes AA at any size**
(4.5:1) and DESIGN.md §2 documents the token as "5.5:1". Counts per page track
how much timing-sheet data the page carries: `/` 51 nodes, `/partners` 29,
`/team` 17, `/about` 8, 404 5. **Not a defect — see G15.**

### 1.2 Every "needs review" item, resolved

axe cannot compute a ratio through a gradient, a pseudo-element or an image, so
it defers. I resolved each one by hiding the glyphs and **sampling the real
rendered backdrop pixel-by-pixel** (`audit-tool\contrast.mjs`), then computing
the worst-case ratio over the whole text box:

| Selector | axe's reason | Measured worst case | Verdict |
|---|---|---|---|
| `#join-heading` | "overlapped by another element" (the HUNT texture) | **18.37:1** (darkest backdrop `rgb(0,9,7)`) | pass |
| `.join-lead` | same | **12.67:1** | pass |
| `.join-btn` | same | **14.65:1** (`--teal-ink` on `--teal`) | pass |
| `.nav-link` ×4 | "background could not be determined due to a pseudo element" (the `::before` scrim) | **13.68:1** | pass |
| `.nav-cta` / `.nav-cta-compact` | same | **14.65:1** in the stuck state, **13.68:1**-equivalent ghost state | pass |
| `.slide-car`, `.slide-caption`, `.slide-track` | "partially obscured by another element" (the frame) | **19.32:1** / **13.68:1** | pass |
| `.hero-lead`, `.hero-proof-*` | "contains an image node" / scrim | **17.89:1** / **7.71:1** | pass |
| `.step-index`, `.step-title`, `.step-line` | "element contains an image node" (join texture) | covered by the `#join-heading` sample, same band | pass |
| `.driver-number` ×4 | "1:1 contrast ratio with the background" | `color: transparent` + `-webkit-text-stroke: 1px var(--teal-soft)`; the stroke is **7.8:1**, the element is `aria-hidden="true"` | pass — see G17 |
| `hidden-content` ×3–4 | the mobile menu, the compact CTA and the desktop nav are `display: none` at the other viewport | analysed separately in the menu-open run, which returns **0 violations** | pass |
| `skip-link` (menu open only) | axe cannot verify the target while the panel is open | verified manually: Tab 1 → "SKIP TO CONTENT", Enter → `document.activeElement === MAIN#main` | pass |

**Zero real contrast failures at AA anywhere on the site.**

---

## 2. Keyboard, semantics, HTML validity

### 2.1 Tab order (accessible names, computed through CDP `Accessibility.getPartialAXTree`)

Every stop carries `outline: solid 2px rgb(15,255,207)` at `outline-offset: 3px`,
matches `:focus-visible`, is visible and is inside the viewport when reached.
Screenshots of the ring on the dark surfaces: `shots\r3-audit\focus-home-*.png`,
`skiplink-1440.png`, `menu-focus-390.png`.

**`/` — 32 stops**
`Skip to content` → `Artemis Esports, home` → `Results` → `Team` → `About` →
`Partners` → `Join the team (opens in a new tab)` → `Join the team (opens in a new tab)` →
`See results` → `Next car` → `Artemis liveries, scroll sideways` [region] →
`Full roster (6 drivers)` → `Mateo Ferreira GT3 / Endurance BRA` → `Dane Kowalczyk GTP / Endurance USA` →
`Ines Marchetti GT3 Sprint ITA` → `Rhys Callaghan LMP2 / Endurance GBR` →
`GLYTCH Energy logo GLYTCH Energy, partner since 2023 (opens in a new tab)` →
`What a partner gets` → `Join the team (opens in a new tab)` →
`contact@artemisesports.com` → `Home` → `Results` → `Team` → `About` → `Partners` →
`Discord` → `X` → `Instagram` → `TikTok` → `YouTube` → `Twitch` → `Store` (all "(opens in a new tab)")

**`/team` — 27 stops**
Skip → brand → 4 nav → header CTA → the six driver entry links
(`Mateo Ferreira` … `Shay Okonkwo`) → `Join the team` → footer email → 5 footer pages → 7 channels

**`/about` — 21 stops**
Skip → brand → 4 nav → header CTA → `Join the team` → footer email → 5 footer pages → 7 channels

**`/partners` — 38 stops**
Skip → brand → 4 nav → `Partner with us` (header) → `Partner with us` (page action) →
`All results` → 6 roster-line links (`7 Mateo Ferreira` … `62 Shay Okonkwo`) →
7 reach-channel links → `GLYTCH Energy logo GLYTCH Energy Partner since 2023` →
`contact@artemisesports.com` → `Partner with us` (contact) → footer email → 5 footer pages → 7 channels

**404 — 25 stops**
Skip → brand → 4 nav → header CTA → `Back to the paddock` → `See results` →
`Team` → `About` → `Partners` (the page's own list) → footer email → 5 footer pages → 7 channels

| Check | Result | Evidence |
|---|---|---|
| Every interactive element reachable | **PASS** | Only `[data-garage-prev]` is missing at load, because `update()` sets `prev.disabled = true` at `scrollLeft 0` and a disabled button is correctly not focusable. See G23. |
| Visible focus at every stop | **PASS** | 143 stops across five pages, 143 with `solid 2px rgb(15,255,207)` / offset `3px`. |
| Focus ring legible on dark surfaces | **PASS** | `skiplink-1440.png` (teal plate, inset ring), `menu-focus-390.png` (teal CTA with a 2px ring at 3px offset on `#000a08`). |
| Skip link is the first stop and lands on `main` | **PASS** | Tab 1 → `a.skip-link` at `top:0 left:0`, `transform: matrix(1,0,0,1,0,0)`, ring present. `Enter` → `document.activeElement = MAIN#main`, `location.hash = "#main"`, `scrollY 0`. No transition on it (pass-3 C13 holds). |
| Escape closes the menu | **PASS** | `aria-expanded "false"`, `#mobile-menu.hidden true`, focus back on `.menu-toggle`, `body.position` back to `static`, `#main` no longer `inert`. |
| Focus trap while open | **PASS** | 10 consecutive Tabs cycle `Results → Team → About → Partners → Join the team → menu-toggle → Results …`. The toggle is deliberately inside the cycle (it is the close control); nothing behind the panel is reachable. |
| `/#results` lands below the fixed header | **PASS** | Direct load `/#results`: `#results` top **88px**, nav height **73px** → **15px clear**; `scroll-padding-top` computes to `88px` (`calc(var(--nav-h) + 1rem)`). In-page click: identical 88px, and `#results` takes `tabindex="-1"` + focus, so the reader's next Tab continues from the results module. `shots\r3-audit\anchor-results-1440.png`. |

### 2.2 Headings, landmarks, language, titles

| Page | h1 | Outline | Skipped levels | Landmarks |
|---|---|---|---|---|
| `/` | 1 — "Artemis Esports" (AX name is correctly `ARTEMIS ESPORTS`, with the space) | h1 → 9 × h2 (Next race, Recent results, The garage, Who drives, How we race, Who backs us, On the hunt., Pages, Channels) | **none** | `header`, `nav "Primary"`, `nav "Primary, mobile"`, `main`, 7 × `section[aria-labelledby]`, `div[role=region] "Artemis liveries, scroll sideways"`, `footer`, `nav "Footer"` |
| `/team` | 1 — "The crew" | h1 → h2 Road/Oval/Pitwall each with h3 driver names → h2 Race with us./Pages/Channels | **none** | as above + `section[aria-labelledby=group-road|oval|crew]` |
| `/about` | 1 — "Built in silence." | h1 → 5 × h2 | **none** | as above |
| `/partners` | 1 — "Partner with Artemis" | h1 → h2 What a partner gets (4 × h3) → 6 × h2 | **none** | as above |
| 404 | 1 — "Off track." | h1 → 2 × h2 | **none** | + `nav "Site pages"` |

- `lang="en"` on all five pages. One `<main>`, one `<header>`, one `<footer>` per page. Every `<section>` is named by `aria-labelledby`. No orphan `h3`.
- **`title` patterns**: `Artemis Esports | iRacing endurance, GT and oval team`, `Team | Artemis Esports`, `About | …`, `Partners | …`, `Page not found | …`. Unique, front-loaded, consistent. **Zero `title` attributes anywhere on the site** — nothing relies on a tooltip.
- **`aria-current`**: present on `/team`, `/about`, `/partners` — two nodes each (the desktop `.nav-link` and the mobile panel link), reinforced by an underline so it does not rely on colour alone. **`/` has none at all**, and the footer "Pages" list never carries it on any page. See G13.

### 2.3 Table semantics after the responsive stacking — **this one broke**

`ResultsTable.astro` carries explicit `role="table" / rowgroup / row / cell /
columnheader` precisely so the semantics survive `display: block`. The roles on
the **body** do survive. The **header row does not**.

| Viewport | `table` computed display | `thead` display | AX of the first `<th>` | AX subtree |
|---|---|---|---|---|
| **1440** | `table` | `table-header-group` | `{role: "columnheader", name: "POS"}` | `table` → `caption` → `rowgroup` → `row` → 5 × `columnheader` → `rowgroup` → 6 × `row` → 5 × `cell` |
| **768** | `block` | **`none`** | **`{role: "none", ignored: true}`** | `table` → `caption` → **`none [ignored]` ×6** → `rowgroup` → rows/cells |
| **390** | `block` | **`none`** | **`{role: "none", ignored: true}`** | same as 768 |

Positive: the `<table>` keeps its role and its `sr-only` caption at every width;
rows and cells keep theirs; the podium `sr-only " podium"` is inside the cell
name (`"P2 podium of 41"`); and `::before` pulls the `data-label` into two of the
cell names (`"DRIVERS: Mateo Ferreira / Dane…"`, `"DATE: 06 SEP 2026"`).
Negative: Pos, Event and Class cells have no column name at all below 860px.
**G2.**

### 2.4 Image alt — every alt on the site

| Page | File | `alt` | `loading` | Attrs | Verdict |
|---|---|---|---|---|---|
| `/` | `interlagos-lmp2` (hero) | "The Artemis Oreca 07 LMP2 running through the esses at Interlagos at dusk" | *(none — eager)* | `fetchpriority="high"`, `1920×1080` | good, correctly not lazy |
| `/` | `sebring-mustang-gt3` | "Ford Mustang GT3 in the Artemis livery at Sebring" | lazy | `1024×1280` | good |
| `/` | `nordschleife-bmw-m4` | "BMW M4 GT3 in the Artemis livery at Nordschleife" | lazy | `1089×611` | good |
| `/` | `watkins-glen-gtp` | "Cadillac V-Series.R in the Artemis livery at Watkins Glen" | lazy | `1024×1280` | good |
| `/` | `nascar-xfinity-chevy` | "Chevrolet Camaro in the Artemis livery at **Short track**" | lazy | `1280×720` | reads as an unfilled field — **G18** |
| `/` | `indianapolis-ir18` | "Dallara IR-18 in the Artemis livery at Indianapolis" | lazy | `1280×536` | good |
| `/`, `/partners` | `glytch-white` | "GLYTCH Energy logo" | lazy | `732×221` | good |
| `/`, `/team`, `/about` | `hunt-texture` | `""` (inside `aria-hidden="true"`) | lazy | `1920×1080` | correct — decorative |
| `/about` | `crew-huddle` | "The Artemis Esports crew standing together outside an event in team jerseys" | lazy | `1920×1280` | good |
| `/about` | `lan-stage` | "An Artemis player competing on stage at a LAN event" | lazy | `853×1280` | good |
| `/about` | `member-portrait` | "An Artemis Esports member in the team jersey at an event" | lazy | `1280×960` | good |
| 404 | *(none — the mark is inline SVG)* | — | — | — | good |

Every `<img>` has explicit `width`/`height`. **No `loading="lazy"` on the LCP
candidate**; every below-fold image is lazy. Measured CLS = **0** on all five
Lighthouse runs.

### 2.5 Link-text uniqueness — "Join the team" ×5

Measured with a script that groups every `<a>` by its accessible name and counts
distinct destinations:

| Page | Repeated labels (count) | **Same text, different destination** |
|---|---|---|
| `/` | Results ×3, Team ×3, About ×3, Partners ×3, **Join the team ×5** | **none** |
| `/team` | Results ×3, Team ×3, About ×3, Partners ×3, Join the team ×4 | **none** |
| `/about` | same shape, Join the team ×4 | **none** |
| `/partners` | Partner with us ×5, the 7 channels ×2, `contact@…` ×2 | **none** |
| 404 | Team ×4, About ×4, Partners ×4, Join the team ×3 | **none** |

"Join the team" is **not** disambiguated — and does not need to be. All five
instances (desktop nav CTA, compact header CTA, mobile-panel CTA, hero primary,
join-band button) resolve to the identical `https://discord.gg/ybSQQk9axG`, which
is the same-purpose exception in **WCAG 2.4.4 (A)**; the SC only bites when the
same text leads somewhere else. The check for that condition returns **empty on
every page**. Each one also carries the `sr-only " (opens in a new tab)"` suffix,
so the accessible name is complete. Nothing to change. (WCAG 2.4.9 *Link Purpose
(Link Only)* is AAA and is also satisfied, since the label is self-describing.)

### 2.6 HTML validity — `html-validate:recommended`

| Page | Errors | Warnings | Rules |
|---|---|---|---|
| `/` | 46 | 0 | `no-redundant-role` ×45, `prefer-native-element` ×1 |
| `/team` | **0** | 0 | — |
| `/about` | **0** | 0 | — |
| `/partners` | 27 | 0 | `no-redundant-role` ×27 |
| `404.html` | **0** | 0 | — |

**None of the 73 is an HTML conformance error.** Both rules are lint opinions,
not spec violations:

- `no-redundant-role` fires on every `role="table|rowgroup|row|columnheader|cell"`
  in `ResultsTable.astro`. Those attributes are the *entire* mechanism keeping the
  stacked mobile layout announced as a table (§2.3) and were added deliberately in
  pass 2. Per HTML-AAM an explicit role matching the implicit one is valid. **Keep
  them.** See G16.
- `prefer-native-element` fires once, on `#garage-track` — `role="region"` on the
  scrollable `<div>`. That div exists *because* pass 2 moved the role off the
  `<ul>` (critic C's C4); putting it on a `<section>` would change nothing
  semantically. Ignore.

Config used (`<scratchpad>\audit-tool\.htmlvalidate.json`): `extends:
["html-validate:recommended"]` with `void-style`, `no-trailing-whitespace` and
`attribute-boolean-style` off — three formatting rules that fire on minified
output, not on the source. No Astro attribute (`data-astro-cid-*`) produced a
single error.

---

## 3. SEO / meta

| | `/` | `/team` | `/about` | `/partners` | 404 |
|---|---|---|---|---|---|
| `<title>` | Artemis Esports \| iRacing endurance, GT and oval team (57) | Team \| Artemis Esports (23) | About \| Artemis Esports (24) | Partners \| Artemis Esports (27) | Page not found \| Artemis Esports (33) |
| `description` | 138 chars | 122 | 151 | 154 | 111 |
| unique title + description | ✅ | ✅ | ✅ | ✅ | ✅ |
| `canonical` | `https://artemisesports.com/` | `…/team/` | `…/about/` | `…/partners/` | `…/404/` ⚠ |
| `og:url` | matches canonical | matches | matches | matches | `…/404/` ⚠ |
| `og:title` / `og:description` | = title/description | ✅ | ✅ | ✅ | ✅ |
| `og:site_name` / `og:type` | `Artemis Esports` / `website` | ✅ | ✅ | ✅ | ✅ |
| `og:image` | `https://artemisesports.com/og.png` (absolute ✅) | ✅ | ✅ | ✅ | ✅ |
| `og:image:width/height/type/alt` | **absent** ⚠ | absent | absent | absent | absent |
| `og:locale` | **absent** | absent | absent | absent | absent |
| `twitter:card` / `twitter:site` | `summary_large_image` / `@EsportsArtemis` | ✅ | ✅ | ✅ | ✅ |
| `twitter:title/description/image` | absent — X falls back to the `og:*` equivalents, so this is fine | — | — | — | — |
| `theme-color` | `#000a08` | ✅ | ✅ | ✅ | ✅ |
| `<html lang>` | `en` | ✅ | ✅ | ✅ | ✅ |
| `robots` meta | none | none | none | none | **none** ⚠ |
| JSON-LD | `SportsTeam`, valid | identical block | identical | identical | identical ⚠ |
| In `sitemap.xml` | ✅ | ✅ | ✅ | ✅ | correctly excluded |

**og.png is 1200×630, 113 KB** — the right size for a `summary_large_image` card;
only the declared dimensions are missing (**G5**).

**Favicon set**: `favicon.ico` 32×32 (2.7 KB), `favicon.svg` (512 viewport,
`#000a08` plate + `#0fffcf` mark), `apple-touch-icon.png` 180×180 (5.3 KB).
`favicon.png` 192×192 exists but is referenced only as the JSON-LD `logo`, not by
a `<link>` — harmless, the SVG covers every modern browser. No
`site.webmanifest`; not required for a non-installable site.

**`robots.txt`**: `User-agent: * / Allow: / / Sitemap: https://artemisesports.com/sitemap.xml`.
Correct — and the sitemap URL is absolute. Note **G25**: the same file is served
on every `*.vercel.app` preview deployment.

**`sitemap.xml`**: 4 `<url>` entries, all absolute `https://artemisesports.com/…`,
all matching their page's canonical exactly (trailing slashes included),
`changefreq` + `priority` present, 404 correctly absent. Adding a page still
requires three manual edits (page file, `nav.json`, sitemap) — documented in
DEPLOY.md, acceptable for five pages.

**JSON-LD**: present and already `SportsTeam` — nothing to add from scratch. It
is built from `site.json`, so `sameAs` carries the seven real channels and cannot
drift from the footer. Three improvements in §6.2 (**G19**).

---

## 4. Lighthouse 13.4.1 — five runs against `dist/` on localhost

| Run | Preset | Perf | A11y | BP | SEO | FCP | **LCP** | CLS | **TBT** | SI | Total transfer | LCP element |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | **99** | **100** | **100** | **100** | 1.2 s | 2.2 s | **0** | **0 ms** | 1.2 s | **280 KB** | `p.hero-lead` (text) |
| `/team` | mobile | **100** | **100** | **100** | **100** | 1.1 s | 1.7 s | **0** | **0 ms** | 1.1 s | **159 KB** | `p.lead` (text) |
| `/about` | mobile | **100** | **100** | **100** | **100** | 1.1 s | 1.7 s | **0** | **0 ms** | 1.1 s | **255 KB** | `p.lead` (text) |
| `/partners` | mobile | **100** | **100** | **100** | **100** | 1.1 s | 1.7 s | **0** | **0 ms** | 1.1 s | **153 KB** | `p.lead` (text) |
| `/` | **desktop** | **100** | **100** | **100** | **100** | 0.3 s | 0.5 s | **0** | **0 ms** | 0.3 s | **288 KB** | `section.hero > div.hero-media > img` |

Every category clears the brief's ≥ 95 bar on every route. Pass 3 measured
99/100/100/100 and 100/100/100/100 on `/` and `/team`; the floor holds and the
three previously-unmeasured routes come in at 100 across the board.

**INP**: not produced in a lab run (there is no interaction). **TBT is 0 ms on all
five runs** and total main-thread work is 0.1–0.2 s, so the INP proxy is as good
as it gets. `max-potential-fid` is likewise unreported because no long task exists.

**Bytes by type** (mobile): `/` Document 98 KB + Font 78 KB + Image 101 KB;
`/team` 65 + 78 + 13; `/about` 60 + 78 + 114; `/partners` 72 + 78 + 0.
Fonts are **78 KB on every single route**, which is 49–51% of the transfer on
`/team` and `/partners`. The test server sends no compression; with gzip the
documents are 20.7 / 14.3 / 14.4 / 15.3 / 11.4 KB (brotli: 16.1 / 11.9 / 11.9 /
12.6 / 9.4 KB), which is what Vercel will actually serve.

**Unused CSS** (the inlined `<style>`, one per page):

| Route | Inline CSS raw | Unused | % |
|---|---|---|---|
| `/` mobile | 48.2 KB | 16.1 KB | **33.4%** |
| `/team` | 30.0 KB | 12.9 KB | **43.1%** |
| `/about` | 27.4 KB | 11.4 KB | **41.7%** |
| `/partners` | — | — | below LH's reporting threshold |
| `/` desktop | 48.2 KB | 21.4 KB | **44.3%** |

A large share of that is legitimately-unused-at-load state CSS: `@media
(forced-colors: active)`, `@media (prefers-contrast: more)`, the ≤820px mobile
menu, `.is-stuck`, every `:hover` block. The genuinely-dead part is `global.css`
rules for components a given page does not render. At 11–21 KB raw (≈2–4 KB
gzipped) per route it is not worth a critical-CSS pipeline. **G14, P2, informational.**

**Font loading**: all four faces declare `font-display: swap`. Three of four are
preloaded (`nexa-bold`, `nexa-light`, `jetbrains-mono-400`). Measured
above-the-fold faces per page:

| Page | Nexa 700 | Nexa 300 | Mono 400 | **Mono 700** |
|---|---|---|---|---|
| `/` | 8 | 2 | 2 | **1** (`.hero-pos` "P2") |
| `/team` | 19 | 4 | 6 | **9** |
| `/about` | 7 | 3 | 6 | 0 |
| `/partners` | 6 | 2 | 9 | 0 |
| 404 | 9 | 1 | 1 | **2** |

`jetbrains-mono-700.woff2` (21.4 KB) renders above the fold on three of five
pages and is **not** preloaded — pass 2's C18 note ("its first use `.pos` is below
the fold") is no longer true. **G10.** Sizes on disk: mono 400 20.7 KB + mono 700
21.4 KB = **42.1 KB of the 76.8 KB font budget** for a face that only ever sets
digits, uppercase labels and a handful of punctuation — **G11**.

**Image formats and lazy-loading**: 59 derivatives in `_astro`, **100% webp**, no
original `.jpg` leaked (the pass-3 fix holds). The hero is eager +
`fetchpriority="high"` + preloaded with matching `imagesrcset`/`imagesizes`;
Lighthouse's `lcp-discovery-insight` passes all three checks on desktop
(`fetchpriority=high applied` ✓, `Request is discoverable in initial document` ✓,
`LCP resources should not use loading=lazy` ✓). Everything below the fold is
`loading="lazy" decoding="async"`. Two over-fetches remain, both new
(Lighthouse's bar is tighter than the 1.6× on-disk bar pass 3 used): **G8** and **G9**.

**Cache-friendly hashed assets**: `_astro/*` is content-hashed (safe for
`immutable`); `/fonts/*.woff2`, `/og.png` and the favicons are **not** hashed.
There is no `vercel.json`, so none of it gets a cache policy — **G22**.

**LCP element, traced directly** (`audit-tool\lcp4.mjs`, real Chrome,
PerformanceObserver):

| Condition | Final LCP |
|---|---|
| 1350×940, no throttling | **`<IMG>`** hero, size 536,203, **196 ms** |
| 1350×940, 1.6 Mbps / 150 ms RTT | `<SPAN>` "Esports", size 4,563, **880 ms** — the hero image is never promoted |
| 412×823, 1.6 Mbps / 4× CPU | `<SPAN>` "Esports", size 1,675, **908 ms** |
| 390×844, no throttling | `<SPAN>`, 1,624, **60 ms** |

So the brief's §6 statement "LCP element = hero image" is only true on a fast
connection. On a throttled one the metric settles on the lockup text at <1 s while
the photograph is still arriving — the reported LCP flatters the experience.
Nothing to fix (the image is already preloaded, `fetchpriority="high"`, 31 KB),
but the documentation is wrong: **G20**.

---

## 5. Robustness

| Test | Result |
|---|---|
| **JS disabled**, all five pages | **PASS.** `html` has no `js` class; h1 laid out at full size on every page (`/` 640×157); `main` 5447 / 2902 / 3283 / 3703 / 828 px tall; **0 of 28 `.reveal` elements offset, faded or zero-height**; countdown correctly `hidden` with the static date "25 – 27 SEP 2026" still printed; garage controls `visibility: hidden` (the row keeps its height, so pass-2's C16 latent shift stays fixed); footer year renders the build-time `2026`; hero image `complete`. Full page: `shots\r3-audit\nojs-home-full.png`. |
| **`prefers-reduced-motion: reduce`** | **PASS, no regression.** `document.getAnimations().length === 0`; `.hero-media` `animation-name: none`, `animation-timeline: auto` (the parallax is not attached at all); `.reveal` `transition-duration: 0s`, `transform: none`; the transition property list on `.btn`, `.text-link svg`, `.garage-frame img` and `.nav-link` is clamped to `opacity, color, background-color, border-color, fill, stroke` — **no transform transition survives**; `.skip-link` `0s`; `scroll-behavior: auto`. After a full scroll, **0 reveals left offset**. |
| **Print** | **FAIL — G3.** There is **no `@media print` rule anywhere** in `src/` or in `dist/` (`printRules: []`). Under print emulation `body` computes `color: rgb(235,255,251)` on `background-color: rgb(0,10,8)`, `h1`/`.hero-lead`/`.results td` all `rgb(235,255,251)`, and `.site-nav` stays `position: fixed`. Browsers default to `print-color-adjust: economy`, which drops background colours while keeping text colour — so the printed sheet is near-white text on white paper. PDFs: `shots\r3-audit\print-home.pdf` (backgrounds off) and `print-home-withbg.pdf`. |
| **200% text**, all five pages at 390×844 | **PASS, no regression.** Layout viewport stays **390** on every page (`scrollWidth === innerWidth === 390`, `overflow: false`); the hamburger is **44×44 at x=316**, fully on screen. Matches pass 3 exactly. `shots\r3-audit\zoom200-home.png`. |
| **Entrance frozen at t=0** | **FAIL — G1.** See §0 and G1. `shots\r3-audit\entrance-frozen-t0.png`. |
| **RTL** | not required (per the brief). |

---

## 6. Ranked findings

Severity: **P0** blocking · **P1** major / WCAG AA violation or a real content
loss · **P2** hardening, fix next pass · **P3** polish.

| ID | Sev | Page | Where | Issue | Evidence | Fix |
|---|---|---|---|---|---|---|
| **G1** | **P1** | all 5 | `src/styles/global.css:541-544` + `:559-564` | `[data-enter]` runs `enter-up` with `animation-fill-mode: both`, and the keyframe's `from` is `opacity: 0`. If the animation never advances, the content is invisible **permanently**, not merely offset — which is the opposite of the invariant `DESIGN.md` §5 states. | Document timeline paused at `t=0`: `/` → `p.hero-lead` **0**, `p.hero-proof` **0**, `div.hero-actions` **0** (both CTAs). `/team` → `h1.display-xl` **0**, `p.lead` **0**, `p.page-meta` **0**, `div.page-head-aside` **0**. `/about` → `h1` **0**, `p.lead` **0**, aside **0**. `/partners` → `h1` **0**, `p.lead` **0**, `p.page-meta` **0**, `div.page-action` **0**, aside **0**. Screenshot `entrance-frozen-t0.png`: the home first screen is a car photo and a nav bar. LCP cost, measured: `/team` FCP **1.1 s** → LCP **1.7 s** with LH naming `p.lead` — exactly the `120 ms` delay + `560 ms` duration. | Drop the opacity, exactly as pass 2 did for `enter-media`:<br>`@keyframes enter-up {`<br>`  from { transform: translateY(16px); }`<br>`}`<br>The 16px rise and the stagger are unchanged; every `[data-enter]` element is a paint candidate from frame 1, and `h1` can never ship invisible. If the fade must stay, move these elements to the `[data-enter-mask]` technique the hero lockup already uses (`overflow: hidden` wrapper + `translateY(105%)`), which is transform-only. |
| **G2** | **P1** | `/`, `/partners` | `src/components/ResultsTable.astro:237-239` | `@media (max-width: 860px) { .results thead { display: none } }` removes the column-header row from the accessibility tree, not just from the screen. `display: none` deletes the node; the explicit `role="columnheader"` cannot survive it. | AX of the first `<th>`: **1440** `{role:"columnheader", name:"POS"}` → **768 and 390** `{role:"none", ignored:true}`. Full subtree at 390: `table → caption → none[ignored] ×6 → rowgroup → row → cell…`. Only Drivers and Date recover a name, via the `::before` `data-label`. | Clip the header instead of deleting it, inside the same media query:<br>`.results thead {`<br>`  position: absolute;`<br>`  width: 1px; height: 1px;`<br>`  overflow: hidden;`<br>`  clip-path: inset(50%);`<br>`  white-space: nowrap;`<br>`}`<br>(`.results` is `display: block` here, so the absolutely-positioned `thead` leaves the flow and costs no layout.) Re-check the AX subtree at 390 afterwards: the five `columnheader` nodes must be back. |
| **G3** | **P2** | all 5 | no `@media print` in `src/styles/global.css` | Nothing on the site is styled for paper. Printed output is `#ebfffb` text on white (≈1.05:1), and the fixed header pins to page 1. A sponsor printing `/partners`, or anyone printing the results sheet, gets a blank-looking page. | Print-media computed styles: `body {background-color: rgb(0,10,8); color: rgb(235,255,251)}`, `h1 {color: rgb(235,255,251)}`, `.results td` same, `.site-nav {position: fixed}`. `printRules: []` — zero print rules in any sheet. | Add to `global.css`:<br>`@media print {`<br>` :root { --bg:#fff; --bg-raise:#fff; --bg-panel:#fff; --ink:#000; --ink-dim:#333; --ink-faint:#555; --teal:#046b58; --teal-soft:#046b58; --teal-ink:#fff; --line:#bbb; --line-strong:#888; --line-teal:#888; color-scheme: light; }`<br>` body { background:#fff; color:#000 }`<br>` .site-nav, .skip-link, .garage-controls, .join-texture, .hero-media { display: none !important }`<br>` .hero { min-height: auto }`<br>` .results thead { display: table-header-group }`<br>` a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.75em }`<br>` .section, .section-tall { padding-block: 1rem; break-inside: avoid }`<br>`}` |
| **G4** | **P2** | all 5 | no `vercel.json` in the repo root | The deployment sends **no security headers**: no `X-Content-Type-Options`, no `Referrer-Policy`, no `Permissions-Policy`, no CSP, no `frame-ancestors`. Vercel adds none by default. | `ls` of the project root: no `vercel.json`, no `.vercel/`. `DEPLOY.md` documents the Vercel flow but no header config. | The exact JSON is in **§7.1**. It is safe against the built output: 3 inline `<script>` per page (`application/ld+json`, the 57-byte `js`-class setter, the 4,406-byte module), 1 inline `<style>` (48,241 bytes on `/`), 8–11 inline `style=` attributes per page, zero external origins (the only non-`artemisesports.com` URLs in `dist/` are `href`s to Discord/X/Instagram/TikTok/YouTube/Twitch/raven.gg/glytchenergy.com, which CSP does not gate). |
| **G5** | **P2** | all 5 | `src/layouts/Base.astro:79` | `og:image` has no `width`, `height`, `type` or `alt`. Slack, Discord, LinkedIn and X all render the card faster and more reliably when the dimensions are declared, and several will skip a card whose image they cannot size cheaply. | `og.png` is **1200×630, 113 KB** on disk; the `<head>` declares only `og:image`. | Beside line 79:<br>`<meta property="og:image:width" content="1200" />`<br>`<meta property="og:image:height" content="630" />`<br>`<meta property="og:image:type" content="image/png" />`<br>`<meta property="og:image:alt" content="Artemis Esports — an iRacing endurance, GT and NASCAR oval team" />`<br>`<meta property="og:locale" content="en_GB" />` |
| **G6** | **P2** | 404 | `dist/404.html`, `src/layouts/Base.astro:45` + `:78` | `dist/404.html` is both Vercel's not-found document **and** a real file at `/404`, which Vercel will serve with **HTTP 200**. It carries `canonical`/`og:url` = `https://artemisesports.com/404/` and no `robots` directive, so a crawler that finds `/404` gets an indexable soft-404 that is not in the sitemap. | `grep` of `dist/404.html`: `<link rel="canonical" href="https://artemisesports.com/404/">`, `<meta property="og:url" content="https://artemisesports.com/404/">`; no `<meta name="robots">` exists on any page. | Give `Base.astro` an optional `noindex` prop and set it from `404.astro`:<br>`{noindex && <meta name="robots" content="noindex, follow" />}`<br>and suppress the canonical + `og:url` on that page (a 404 document has no canonical URL). Optionally add `"/404"` to the `vercel.json` redirects so the direct URL 308s to `/`. |
| **G7** | **P2** | all 5 | `astro.config.mjs:7` (`trailingSlash: 'ignore'`) vs `src/data/nav.json` | Canonicals and `sitemap.xml` use the **trailing-slash** form (`/team/`), while every internal link in `nav.json` uses the **bare** form (`/team`). With no `trailingSlash` key in `vercel.json`, Vercel serves both and redirects neither, so both URLs are live and the canonical tag is doing all the de-duplication work on its own. | `dist/team/index.html` → `canonical https://artemisesports.com/team/`; `sitemap.xml` → `<loc>https://artemisesports.com/team/</loc>`; `nav.json` → `{"href": "/team"}`. | Add `"trailingSlash": true` to `vercel.json` (§7.1) so the served URL and the canonical are the same string, or flip Astro to `trailingSlash: 'never'` and let the canonical drop the slash. Either is fine; **pick one**, because they must agree with the sitemap. |
| **G8** | **P2** | `/about` | `src/pages/about.astro:67-68` | The crew-huddle collage shot over-fetches on mobile: an 84 KB file where 38 KB would do. The ladder jumps 640 → 960 with nothing between, and `sizes: 100vw` overstates the frame, which is `100vw − 2 × 21px`. | Lighthouse `image-delivery-insight`, `/about` mobile: **"Est savings of 45 KiB"** — "This image file is larger than it needs to be (960×637) for its displayed dimensions (648×432)", `wastedBytes: 45835` of `totalBytes: 84372`. It is also the single largest asset on the route (83 KB of 255 KB). | Add the missing rung and tell the truth about the frame:<br>`widths={[400, 640, 768, 960, 1280, 1920]}`<br>`sizes="(min-width: 1512px) 545px, (min-width: 901px) 38vw, calc(100vw - 2.5rem)"` |
| **G9** | **P2** | `/` | `src/components/Garage.astro:64` | The Sebring portrait slide pulls the 640w file for a 487px need on the Lighthouse mobile profile; the ladder has no step between 480 and 640. | LH `image-delivery-insight`, `/` mobile: `li.garage-slide > figure > div.garage-frame > img`, "larger than it needs to be (640×800) for its displayed dimensions (487×609)", `wastedBytes: 14661` of `34916`. Total est. savings on `/` is 19 KiB (the other 5 KiB is the hero's compression factor at `quality: 58`). | `widths={[320, 480, 560, 640, 1024]}` on the two portrait slides (`sebringMustangGt3`, `watkinsGlenGtp`). Leave the hero's quality alone — 58 is already aggressive and the 5 KiB is not worth visible artefacts on the LCP image. |
| **G10** | **P2** | `/`, `/team`, 404 | `src/layouts/Base.astro:51-60` | `jetbrains-mono-700.woff2` sets above-the-fold text on three of five pages but is the one face not preloaded. `font-display: swap` then re-lays tabular figures after first paint. | Measured above-the-fold faces: `/` → `JetBrains Mono 700` ×1 (`.hero-pos` "P2", in the hero proof row); `/team` → ×9 (the roster entry numbers); 404 → ×2. The file is fetched on all five routes regardless (21.4 KB). | Add the fourth preload beside the other three, or — better, because it costs nothing on `/about` and `/partners` — make the preload conditional on a `Base.astro` prop and set it on `/`, `/team` and `404`. Pass 2's C18 rationale should be corrected in DESIGN.md at the same time. |
| **G11** | **P2** | all 5 | `public/fonts/jetbrains-mono-{400,700}.woff2` | The two mono faces are **42.1 KB of the 76.8 KB font budget** and are downloaded on every route, for a family that only ever sets digits, `A–Z`, `/`, `.`, `,`, `:` and `#`. They are the `@fontsource` latin subset — still the full Latin block. | LH total-byte-weight, `/team`: `jetbrains-mono-700.woff2` 22 KB + `jetbrains-mono-400.woff2` 21 KB = **43 KB of a 159 KB route**, i.e. 27%. `/partners` is 43 KB of 153 KB. | Subset both faces to the glyphs the site actually uses (`pyftsubset --unicodes="U+0020-0039,U+003A,U+0041-005A,U+0061-007A,U+0023,U+002F,U+002E,U+002C"` or equivalent) and commit the result to `public/fonts/`. Expect ~4–6 KB each, i.e. **~32 KB saved on every page view**. Add a line to DEPLOY.md so nobody regenerates them from `@fontsource` by accident. |
| **G12** | **P2** | — | `DEPLOY.md` §3 | The five legacy URLs (`/legacy`, `/calendar`, `/results`, `/media`, `/join`) have redirects written **only** as an `.htaccess` snippet for the LiteSpeed fallback. Vercel ignores `.htaccess`; on the live host those five URLs 404. `/results` and `/join` are the two most likely to be in someone's history or in an old Discord pin. | `DEPLOY.md` "If you want, add redirects in `.htaccess` (works on LiteSpeed)". No `vercel.json`, so no `redirects` array exists. | Add the `redirects` block in §7.1 to `vercel.json`. It mirrors the `.htaccess` snippet exactly, so the two hosts behave the same. |
| **G13** | **P3** | all 5 | `src/components/Footer.astro:25`, `src/components/Nav.astro:8` | The footer "Pages" list renders `nav.footer` with no `aria-current`, and `/` has no current-page marker anywhere because `nav.primary` has no `/` entry (its first item is `/#results`). A screen-reader user landing on the home page gets no "you are here" from either navigation. | `[aria-current]` node counts: `/` **0**; `/team`, `/about`, `/partners` **2 each** (desktop `.nav-link` + mobile panel link); 404 **0**. The footer never contributes one. | Lift `isCurrent` out of `Nav.astro` into `src/lib/links.ts` and use it in `Footer.astro` too:<br>`<a href={link.href} aria-current={isCurrent(link.href, Astro.url.pathname) ? 'page' : undefined}>`<br>That also gives `/` a marker, because `nav.footer` does contain `{"href": "/", "label": "Home"}`. |
| **G14** | **P2** | all 5 | `astro.config.mjs:14` (`inlineStylesheets: 'always'`) | 33–44% of the CSS inlined into each document is never matched during load, and because it is inlined it is re-downloaded with every page rather than cached once. | LH `unused-css-rules`: `/` **16.1 KB of 48.2 KB (33.4%)**, `/team` **12.9 / 30.0 (43.1%)**, `/about` **11.4 / 27.4 (41.7%)**, `/` desktop **21.4 / 48.2 (44.3%)**. | **Measure before acting.** Much of it is state CSS that must ship (forced-colors, prefers-contrast, the ≤820px menu, `.is-stuck`, every `:hover` block) and is a false positive. The real waste is `global.css` rules for components a page does not render — ~2–4 KB gzipped per route. Given Perf is already 99–100, the honest recommendation is **leave it**, and record the number here so a future pass does not re-litigate it. |
| **G15** | **P3** | all 5 | `src/styles/global.css:53` (`--ink-faint`) | 5.49:1 fails WCAG AAA (SC 1.4.6). 51 nodes on `/`, 29 on `/partners`, 17 on `/team`, 8 on `/about`, 5 on 404. | axe `color-contrast-enhanced`, identical message on every node: "insufficient color contrast of 5.49 … Expected contrast ratio of 7:1". | **No action.** AA is the project's stated bar and 5.49:1 clears it at any size. Recorded so the count is not mistaken for a regression next pass. If AAA ever becomes the bar, `--ink-faint: rgba(235,255,251,0.66)` reaches 7.1:1 on `--bg` — but it flattens the three-step ink ramp that the whole "pit wall" register depends on. |
| **G16** | **P3** | `/`, `/partners` | `src/components/ResultsTable.astro:19-60` | `html-validate` reports 45 + 27 `no-redundant-role` errors. | `hv.json`: `/` 46 errors (45 + 1), `/partners` 27; `/team`, `/about`, `404.html` **0**. | **Keep the roles — they are load-bearing** (§2.3, G2). If the repo ever adopts html-validate in CI, disable the rule for this file rather than removing the attributes: `"no-redundant-role": "off"` scoped to `src/components/ResultsTable.astro`. |
| **G17** | **P3** | `/`, `/team` | `src/components/DriverCard.astro:128-139` | `.driver-number` sets `color: transparent` with `-webkit-text-stroke: 1px var(--teal-soft)`, so every automated contrast tool reads 1:1 and defers. It will keep appearing in every future audit. | axe `color-contrast` incomplete: "Element has a 1:1 contrast ratio with the background", `fg #000a08 / bg #000a08`, at 64px and 36px. The element is `aria-hidden="true"` and the number is also printed in plain text in `.driver-meta` ("BRA / No. 7"). | **Pass — no change needed.** The visible form is a 7.8:1 teal hairline at 36–64px, and the information is duplicated in accessible text. Worth one line in `DESIGN.md` §7 so the next auditor does not re-open it. |
| **G18** | **P3** | `/` | `src/components/Garage.astro:30` + `src/data/cars.json` | `altFor()` builds `"${car} in the Artemis livery at ${track}"`, and one record's `track` is the generic `"Short track"`, producing "Chevrolet Camaro in the Artemis livery at **Short track**" — which reads to a screen-reader user like an unfilled field. | Full alt list in §2.4. The other four slides name real circuits (Sebring, Nordschleife, Watkins Glen, Indianapolis). | Either name the circuit in `cars.json` (Bristol and Martinsville both appear in `results.json`), or special-case a generic track in `altFor()`:<br>`const altFor = (i) => cars[i].track.toLowerCase().includes('track') ? `${cars[i].car} in the Artemis livery on a short oval` : `${cars[i].car} in the Artemis livery at ${cars[i].track}`;` |
| **G19** | **P3** | all 5 | `src/layouts/Base.astro:21-32` | The `SportsTeam` block is correct but is emitted **identically on all five pages including the 404**, has no `@id` (so the five copies are five anonymous nodes rather than one entity), `logo` points at the 192px favicon, and there is no `image`. | JSON-LD extracted from `dist/index.html` in §7.2. `logo: "https://artemisesports.com/favicon.png"` (192×192). | Improved block verbatim in **§7.2**: adds `@id`, `alternateName`, `image` (the 1200×630 card), a proper `ImageObject` logo, `sport` as an array, and `foundingLocation`-free minimalism. Emit it on `/` `/team` `/about` `/partners` and skip it on the 404 (a not-found document should not assert an entity). |
| **G20** | **P3** | `/` | `<scratchpad>\design-brief.md` §6, `DESIGN.md` §8 | Both documents state the LCP element is the hero image. Traced directly, it is only the image on a fast connection; under throttling the hero image is **never** promoted to an LCP candidate and the metric lands on the lockup text. | `lcp4.mjs`: 1350×940 unthrottled → `<IMG>` 536,203 @ **196 ms**; 1350×940 at 1.6 Mbps → `<SPAN>"Esports"` 4,563 @ **880 ms** (no `<IMG>` candidate at all); 412×823 throttled → `<SPAN>` @ **908 ms**. Lighthouse agrees: desktop names the `<img>`, all four mobile runs name a text node. | **No code change.** Correct the two documents: "the LCP element is the hero lockup on a slow connection and the hero image on a fast one; the image is preloaded with `fetchpriority=high` so either way it is not the bottleneck". Fixing **G1** will make the lockup and lead paint even earlier. |
| **G21** | **P3** | all 5 | `src/layouts/Base.astro:80-81` | Only `twitter:card` and `twitter:site` are declared. | X falls back to `og:title` / `og:description` / `og:image`, so the card renders correctly today — verified by inspection of the emitted `<head>`. | Optional. If you want an explicit card, add `twitter:title`, `twitter:description`, `twitter:image` and `twitter:image:alt` mirroring the og values, plus `twitter:creator` if the team wants attribution. Lowest-value item in this table. |
| **G22** | **P2** | all 5 | no `vercel.json` | `_astro/*` is content-hashed and could be cached for a year; instead every asset gets Vercel's default `public, max-age=0, must-revalidate`. Fonts (76.8 KB, unhashed, never changing) are re-validated on every navigation. | `dist/_astro` = 59 files / 1.82 MB, every filename carrying a content hash (`crew-huddle.VqLXtRdT_Z1du1CM.webp`). `dist/fonts/*.woff2` unhashed. No header config anywhere. | The `headers` entries in **§7.1** set `immutable` for `/_astro/*` and `/fonts/*`, a day for the icons and the OG card, and deliberately leave the HTML on Vercel's default so a Discord-bot data push goes live immediately. **If a font file is ever replaced, rename it** — `immutable` on an unhashed path is a one-way door. |
| **G23** | **P3** | `/` | `src/scripts/site.ts:254` | At load `prev.disabled = true`, so the garage exposes **one** button to the keyboard until the strip is scrolled. A keyboard user tabbing through meets "Next car" with no visible partner control. | Tab order on `/`: stop 10 is `Next car [button]`; `Previous car` never appears. The button is correctly `disabled` (so correctly skipped) and correctly re-enabled at `scrollLeft >= 8`. | Working as designed and WCAG-conformant. If you want both controls discoverable, use `aria-disabled="true"` + a no-op click handler instead of the `disabled` property, so the control stays in the tab order and announces its state. Low value: the region itself is focusable and scrollable with the arrow keys. |
| **G24** | **P3** | `/` | `src/components/Garage.astro:53-61` | `html-validate` `prefer-native-element`: `role="region"` on a `<div>`. | 1 error, `/` only, selector `#garage-track`. | Ignore, or change the element to `<section id="garage-track" class="garage-viewport" tabindex="0" aria-label="…">` — semantically identical (a labelled `<section>` **is** `role="region"`), one fewer lint error, and it removes the redundant attribute. Cosmetic. |
| **G25** | **P2** | all 5 | `public/robots.txt` | The same `Allow: /` robots.txt ships on every Vercel **preview** deployment of the `redesign` branch, so preview builds at `*.vercel.app` are crawlable and can be indexed as duplicates of the production site — with an absolute `Sitemap:` line pointing back at the production domain. | `public/robots.txt` is a static file copied verbatim into `dist/`; there is no environment branch and no `X-Robots-Tag`. The repo is a public GitHub repository, so preview URLs are discoverable. | Add to `vercel.json` (§7.1, commented) a preview-only `X-Robots-Tag: noindex`, or set it in Vercel's project settings ("Deployment Protection" → preview deployments). Belt and braces: on the production domain nothing changes. |

**25 findings: 2 P1, 12 P2, 11 P3. No P0.**

---

## 7. The two artefacts, verbatim

### 7.1 Proposed `vercel.json` — **P2 recommendation (G4, G7, G12, G22, G25)**

There is no `vercel.json` today. This one is written against the **built**
`dist/`: the CSP was derived by inspecting every inline script and style the
build actually emits (3 `<script>` per page — `application/ld+json`, the 57-byte
`js`-class setter and the 4,406-byte ES module — 1 `<style>` of up to 48,241
bytes, and 8–11 `style=` attributes per page), and every external URL in `dist/`
(all of them plain `href`s to Discord, X, Instagram, TikTok, YouTube, Twitch,
raven.gg and glytchenergy.com, none of which CSP gates). **It will not break the
site.**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "trailingSlash": true,
  "redirects": [
    { "source": "/join", "destination": "/#join", "permanent": true },
    { "source": "/results", "destination": "/#results", "permanent": true },
    { "source": "/calendar", "destination": "/", "permanent": true },
    { "source": "/media", "destination": "/about", "permanent": true },
    { "source": "/legacy", "destination": "/about", "permanent": true }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Permissions-Policy",
          "value": "accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), xr-spatial-tracking=()"
        },
        { "key": "X-Frame-Options", "value": "DENY" },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; upgrade-insecure-requests"
        }
      ]
    },
    {
      "source": "/_astro/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/fonts/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(favicon.ico|favicon.svg|favicon.png|apple-touch-icon.png|og.png)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=86400" }
      ]
    }
  ]
}
```

Notes the owner should read before merging this:

- **`script-src 'unsafe-inline'` is required and is an honest compromise.** Astro
  inlines the client module and Base.astro inlines the `js`-class setter and the
  JSON-LD; their SHA-256 hashes change whenever `site.ts`, `site.json` or any
  rendered data changes, and a stale hash in a static `vercel.json` would kill
  the page silently on the next Discord-bot data push. With `'unsafe-inline'`,
  the CSP still blocks every **external** script origin, every frame, every form
  post and every non-`self` connection — which is the whole attack surface a
  static site with no user input actually has — but it gives no protection
  against injected inline script. If that becomes unacceptable, the correct fix
  is a build step that writes the three hashes into `vercel.json`, not a
  hand-maintained list.
- **`style-src 'unsafe-inline'` is required** by the 8–11 `style=` attributes per
  page (the `--enter-delay` / `--reveal-delay` stagger values) and the inlined
  `<style>` block.
- **`form-action 'none'`** is correct: the site has no `<form>`. `mailto:` links
  are navigations, not form submissions.
- **`Strict-Transport-Security` without `preload`** on purpose. Vercel already
  serves HSTS on its own domains; adding `preload` is a commitment the domain
  owner has to make deliberately.
- **`immutable` on `/fonts/*` is a one-way door** — those filenames carry no
  content hash. If a face is ever replaced, give the new file a new name.
- **HTML gets no `Cache-Control` override** on purpose: Vercel's default
  (`public, max-age=0, must-revalidate`) is what makes a bot-driven data push
  appear immediately.
- **G25**: preview deployments are not covered here. Set `X-Robots-Tag: noindex`
  for preview environments in the Vercel project settings, which is
  environment-aware in a way `vercel.json` is not.

### 7.2 JSON-LD — **already present; this is the improved version (G19)**

What ships today, on **all five** pages including the 404 (`dist/index.html`):

```json
{
  "@context": "https://schema.org",
  "@type": "SportsTeam",
  "name": "Artemis Esports",
  "sport": "Sim racing",
  "url": "https://artemisesports.com/",
  "logo": "https://artemisesports.com/favicon.png",
  "foundingDate": "2017",
  "email": "contact@artemisesports.com",
  "description": "An iRacing endurance, GT and NASCAR oval team.",
  "sameAs": [
    "https://discord.gg/ybSQQk9axG",
    "https://x.com/EsportsArtemis",
    "https://instagram.com/esportsartemis",
    "https://tiktok.com/@esportsartemis",
    "https://youtube.com/channel/UCE6v3WL651IvusgiD3dJzxg",
    "https://twitch.tv/esportsartemis",
    "https://raven.gg/stores/esports-artemis"
  ]
}
```

That is valid and already covers the `SportsTeam`/`Organization` requirement.
The replacement below adds a stable `@id` (so the five copies are one entity
rather than five anonymous ones), a real `image`, a sized `ImageObject` logo, and
the `esports` discipline alongside the sport. Drop it into
`src/layouts/Base.astro` in place of the current `structuredData` object, and
gate the `<script>` on `!noindex` so the 404 stops asserting it:

```js
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SportsTeam',
  '@id': new URL('/#organization', Astro.site).href,
  name: site.name,
  alternateName: 'Artemis',
  url: Astro.site?.href,
  description: site.shortDescription,
  sport: ['Sim racing', 'Esports'],
  foundingDate: String(site.founded),
  email: site.contactEmail,
  slogan: site.tagline,
  image: new URL('/og.png', Astro.site).href,
  logo: {
    '@type': 'ImageObject',
    url: new URL('/favicon.png', Astro.site).href,
    width: 192,
    height: 192,
  },
  sameAs: [...Object.values(site.socials).filter(Boolean), site.store],
};
```

Which serialises to:

```json
{
  "@context": "https://schema.org",
  "@type": "SportsTeam",
  "@id": "https://artemisesports.com/#organization",
  "name": "Artemis Esports",
  "alternateName": "Artemis",
  "url": "https://artemisesports.com/",
  "description": "An iRacing endurance, GT and NASCAR oval team.",
  "sport": ["Sim racing", "Esports"],
  "foundingDate": "2017",
  "email": "contact@artemisesports.com",
  "slogan": "Quiet. Precise. On the hunt.",
  "image": "https://artemisesports.com/og.png",
  "logo": {
    "@type": "ImageObject",
    "url": "https://artemisesports.com/favicon.png",
    "width": 192,
    "height": 192
  },
  "sameAs": [
    "https://discord.gg/ybSQQk9axG",
    "https://x.com/EsportsArtemis",
    "https://instagram.com/esportsartemis",
    "https://tiktok.com/@esportsartemis",
    "https://youtube.com/channel/UCE6v3WL651IvusgiD3dJzxg",
    "https://twitch.tv/esportsartemis",
    "https://raven.gg/stores/esports-artemis"
  ]
}
```

Deliberately **not** added: `member` / `athlete` entries for the roster (the
driver names are flagged `_placeholder` in `drivers.json` and must not be
published as structured claims), `SportsEvent` markup for `events.json` (Google
shows no rich result for a sim-racing event and the dates move), and
`aggregateRating` (there is nothing to rate).

---

## 8. Audit health score

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | **3/4** | Zero axe AA violations and a flawless keyboard pass; the results table loses its column headers below 860px (G2) and three `<h1>`s ship at `opacity: 0` at frame 0 (G1) |
| 2 | Performance | **4/4** | 99–100 Perf on five runs, CLS 0, TBT 0 ms, 153–288 KB per route; two sub-50 KB image over-fetches remain (G8, G9) |
| 3 | Responsive design | **4/4** | 200% text holds a 390 viewport on all five pages, 44px targets everywhere, no horizontal overflow — every pass-3 fix verified still in place |
| 4 | Theming | **4/4** | One token system, no hard-coded colours (`prefers-contrast: more` works precisely because of that), forced-colors handled as a first-class mode |
| 5 | Anti-patterns | **4/4** | No gradient text, no glass, no hero-metric row, no identical card grids, no eyebrow-per-section, no numbered scaffolding |
| **Total** | | **19/20** | **Excellent — minor polish** |

**Anti-patterns verdict: PASS.** Nothing here reads as AI-generated. The one
thing that would betray a template — a uniform fade-and-rise on every scrolled
section — was removed in pass 2, and what is left (`.reveal` on genuine sibling
lists, 12px, transform only) is a deliberate choice. The irony of G1 is that the
*entrance* animation is the one place where the project's own stated discipline
was not applied.

### What is working that a later pass must not "fix"

- **Explicit ARIA roles on `ResultsTable`** — they are the only reason the
  stacked mobile layout is still a table (G16). `html-validate` will keep calling
  them errors. They are not.
- **`.driver-number` as transparent text with a stroke** — every contrast tool
  will keep reporting 1:1 (G17). It is `aria-hidden`, duplicated in text, and
  7.8:1 as rendered.
- **The reduced-motion `transition-property` clamp** in `global.css:599-607`. It
  is doing exactly what pass 2's C6 asked and is verified clean.
- **No `loading` attribute on the hero image** — that absence is the fix.
- **`visibility: hidden` (not `hidden`) on the garage controls** — it reserves the
  row height and is why JS-off costs no layout shift.
- **The skip link has no transition.** Do not "polish" it.

## 9. Recommended actions, in order

1. **[P1] `/impeccable harden`** — G1 (drop `opacity: 0` from `@keyframes enter-up`) and G2 (clip `.results thead` instead of removing it). Two rules; both are mechanical; both are verifiable with the probes in `<scratchpad>\audit-tool\`.
2. **[P2] `/impeccable harden`** — G3 (print stylesheet), G6 (404 `noindex`), G13 (`aria-current` in the footer).
3. **[P2] `/impeccable optimize`** — G8, G9 (two width-ladder rungs), G10 (mono 700 preload), G11 (subset the mono, ~32 KB per view).
4. **[P2] deployment config** — G4, G7, G12, G22, G25: create `vercel.json` from §7.1. Not a design command; it is one new file in the repo root.
5. **[P3] `/impeccable clarify`** — G18 (the "Short track" alt), and the doc corrections for G20 (`DESIGN.md` §8 and the brief's §6 LCP claim) and G19 (JSON-LD).
6. **[P3] `/impeccable polish`** — G21, G23, G24, and record G14/G15/G16/G17 in `DESIGN.md` §7 so the next audit does not re-open them.

Re-run this audit after the fixes: `node axe-run.mjs`, `node kbd.mjs`,
`node sem2.mjs`, `node robust.mjs`, `node lh4.mjs` (from `perf-tool`), all in
`<scratchpad>\audit-tool\`. G1 is confirmed fixed when `robust.mjs`'s
`frozen-at-t0` line reports `op: "1"` for every `[data-enter]` element on all five
pages; G2 when `sem2.mjs` reports `first th AX: {"role":"columnheader","name":"POS"}`
at 390 as well as at 1440.
