# Pass 6 report - Artemis

> **Superseded in part.** The colour values and every measured contrast and
> Signal-percentage figure in this report describe the original green-black
> palette (`--night: #000a08`). The site has since migrated to the NOCTURNE
> ramp; `DESIGN.md` section 2 and `docs/brand-core.md` section 6 carry the
> current values. The *reasoning* in this report - the Signal budget, its five
> allowed uses, which hairline goes where - still holds. The numbers below
> were measured against the pass-6 ground and the pass-6 layouts, so read
> them as history.
>
> `audit-tool/signal6.mjs` has since been written to the method in section
> 1.3 and checked in, so the figures are reproducible again: run
> `npm run audit:signal --prefix tests`. It carries one condition this
> section does not, `g - b <= 60`, because the NOCTURNE data colours arrived
> after pass 6 and `--gain #5BD98A` satisfies all four rules here. Without
> the ceiling every position-gained marker counts as accent, which the brand
> core explicitly says it is not.
>
> The measurement also found what a worst-case number hides: eleven of
> fourteen routes carry **0.00%** Signal on the 1440 first screen. That is
> recorded, not acted on: the NOCTURNE sheet states the rule as "teal holds
> under 10% of any screen", so the budget is a ceiling and an empty first
> screen is not a defect. See `DESIGN.md` section 2.

Brand-core alignment, then the retention features. Target:
`D:\Artemis\Website\Website` (Astro 7, static, branch `preview`).
**Not committed.** No dependency added or removed. Six pages now, not five.

Inputs read in order: the iRacing-scoped **Artemis Esports - Brand Core** and
**Brand Core v2**; `data-contract.md` v1.2; `design-brief.md` §1-§6;
`pass5-report.md`; `PRODUCT.md`, `DESIGN.md`, `CONTENT.md`, `DEPLOY.md`,
`README.md`; then the whole of `src/`, `public/`, `scripts/check-data.mjs` and
`vercel.json`. Skills: `anthropic-skills:impeccable` (`reference/brand.md`,
`reference/typeset.md`, `reference/colorize.md`), `anthropic-skills:taste`
(`reference/brandkit.md`, and its section-14 pre-flight re-run from the pass-5
record), `anthropic-skills:emil` (core principles, review path).

---

## 0. Headline

**Signal went from "the site's colour" to a five-job budget and now measures
5.7% on the worst screen against a 10% cap. Nexa and JetBrains Mono are out;
Archivo and Inter are in, as two variable families in four `unicode-range`
files, 50,664 B on a first paint against pass 5's 48,036 B - and `/` is still a
Lighthouse 100 with an LCP of 1.7 s, better than pass 5's 1.8 s. The grid moved
onto the brand's 8% left edge. Six retention features shipped, including a new
`/join` page. Zero axe violations, zero CSP violations, 174 keyboard stops with
174 focus rings, and all six empty-data builds pass.**

One real defect was found by testing rather than by reading: Umami Cloud serves
its script from `cloud.umami.is` and posts events to `gateway.umami.is`. The
first CSP had only the first origin, so the tag loaded, the page looked
perfect, and every event was blocked. Both origins are in `connect-src` now.

---

## 1. Phase 1: brand-core alignment

### 1.1 Type

Two variable families replace four static faces.

| | Pass 5 | Pass 6 |
|---|---|---|
| Display | Nexa 700 / 300 | **Archivo**, `wght` 400-800, `wdth` 75-100 |
| Body / UI | Nexa 300 | **Inter**, `wght` 400-700 |
| Data | JetBrains Mono 400 / 700 | **Inter** with `tnum` + `tabular-nums` |
| Files | 4 static | 4 (2 families x core/ext) |
| First paint | 48,036 B | **50,664 B** |
| On disk | 48,036 B | 101,476 B |

Sources: the variable TTFs from the Google Fonts repository
(`Archivo[wdth,wght].ttf`, `Inter[opsz,wght].ttf`), subset with `subset-font`
2.7.0 (the wasm build of `hb-subset`) by `font-tool/subset6.mjs`. Both are SIL
OFL; `public/fonts/OFL.txt` ships with them.

**The `wdth` axis is the display idea.** h1 and h2 are condensed at **80%**;
h3, h4 and every subhead-scale label are normal width. That is what "condensed
for h1/h2 and the wordmark-adjacent labels, normal width for subheads" buys
you when the face carries a real width axis: the hero's two lines separate on
width and weight (Archivo 700 at 80% over Archivo 400 at 100%) rather than on a
colour, which is how "ESPORTS" got off Signal.

**Axis and feature verification** (`audit-tool/fonts6.mjs`, six pages x two
viewports, 12 runs, **0 problems**):

- `document.fonts.status` is `loaded` everywhere.
- **2 of 4 faces load on a page view** - the core pair - and **4 of 4 load**
  the moment a character in the ext range is rendered. Both ext faces fetch at
  exactly 36,820 B and 13,992 B when they do.
- Both axes are live, measured in the DOM rather than asserted: the same string
  at `wdth` 75 and 100 is 646.1 px against 822.3 px; at `wght` 400 and 700 it is
  779.5 px against 822.3 px.
- Tabular figures are tabular: `1111` and `0000` have the same advance.
- The web font is really painting, measured against the same stack with its
  first family removed, on every page.
- The body paints exactly **seven** family/weight/width combinations and no
  fallback face paints any text: `Archivo 400 100%`, `Archivo 600 100%`,
  `Archivo 700 100%`, `Archivo 700 80%`, `Inter 400 100%`, `Inter 600 100%`,
  `Inter 700 100%`.

**The `unicode-range` split is the reason `/` is still a 100.** One file per
family is 94,156 B on every first paint, and that measured 99/100/100/100 with
an LCP of 2.0 s. Preloading only Inter was tried and was worse: FCP 0.8 s to
1.2 s and a 0.002 CLS on three routes, because the h1 then painted in the
fallback and swapped. Splitting each family into `core` (Basic Latin plus the
characters the site's own copy emits) and `ext` (the Latin-1 Supplement, the
Latin Extended-A letters, the combining marks and the bot-only punctuation)
ships 50,664 B and measures 100/100/100/100 with an LCP of 1.7 s.

What decided the split was a scan of the built HTML: the only characters the
site itself renders beyond ASCII are **U+00A0** (the results sheet's driver
separator) and **U+00A9** (the footer copyright). Leaving either in `ext`
pulled a 14 KB face on every page for one glyph. The two ranges are disjoint on
purpose, because where two `@font-face` rules of one family overlap, the last
one defined wins.

Two codepoints in the pass-5 target are missing from the Inter source:
**U+00AD** (soft hyphen, invisible) and **U+2215** (division slash, never
rendered - the site uses `/`, U+002F). Archivo carries both.

Semi-bold (600) is the floor for anything at `--text-xs` or below. Leading went
up a step across the board and tracking came down across the board, because
both new faces are wider-set and larger-x-height than the ones they replaced.

### 1.2 Colour

Every token was renamed and remapped. `--bg`/`--bg-raise`/`--bg-panel` became
`--night`/`--surface-1`/`--surface-2` with `--surface-3` added;
`--ink`/`--ink-dim`/`--ink-faint` became `--mist`/`--mist-dim`/`--muted` with
`--muted-deep` added; `--teal*` became `--signal*` with `--teal-deep` added;
`--line-teal` is gone. The rename was the point: a token called `--teal` invites
a designer to reach for teal.

**Signal now has five allowed jobs** and fifteen resting-state uses were moved
off it: the "Next race" heading, the countdown, the hero name's second line, the
outlined car numbers in three places, the driver focus label, the results
sheet's podium positions, the garage progress indicator, the join steps'
numbers, the 404 code, the 404 mark, the footer mark, the partner-roster
numbers, the class chips, the contact-card border and the hero proof rule.

**Contrast, computed:** `--muted` `#8FA8A1` is **7.9:1** on Night and 6.6:1 on
`--surface-2`, so it is safe at text size and carries every caption, field
label and date. `--muted-deep` `#486B62` is **3.4:1** and therefore never
carries body-size text: it is used for exactly two things, the 404 mark at
288 px and the disabled garage arrows.

### 1.3 The Signal measurement

`audit-tool/signal6.mjs`. A pixel counts as Signal when `g >= 120`,
`g - r >= 60`, `b - r >= 40` and `g - b >= 12` - which catches pure `#0FFFCF`
and every anti-aliased blend of it toward Night, and excludes Mist (`g-r` 20),
`--muted` (25) and `--muted-deep` (35). Photographs are hidden with
`visibility: hidden`, which preserves layout exactly, so the number describes
the **design** rather than the teal liveries in the renders.

| Page | 1440 hero | 1440 full page | 390 hero | 390 full page |
|---|---|---|---|---|
| `/` | **0.96%** | 0.27% | **5.41%** | 1.16% |
| `/team` | 0.00% | 0.24% | 0.00% | 1.01% |
| `/join` | **1.07%** | 0.55% | **4.17%** | 2.07% |
| `/partners` | **0.92%** | 0.39% | **3.59%** | 1.20% |
| `/about` | 0.00% | 0.23% | 0.00% | 1.09% |
| 404 | **0.81%** | 0.53% | **5.34%** | 2.79% |

With the photographs shown ("as seen"), the only page that changes is `/` at
1440, where the LMP2's teal livery takes the hero from 0.96% to **1.25%** and
the full page from 0.27% to 0.32%.

Those captures are at the top of the page, so they do not include the sticky
phone bar. Measured separately on the scrolled mobile captures where the bar is
up: **5.64% to 5.69%**, which is the worst screen on the site.

That number is what it is because of one fix. Before it, the sticky bar and the
compact header CTA were both on screen - two Signal-filled buttons for one
intent - and that measured **8.1%**. The header copy now hides while the bar is
up, which costs no layout at all because the hamburger is already flush right
and the wordmark flush left.

### 1.4 Texture

`src/assets/hunt-texture.jpg` is deleted and no component references it. The
replacement is `--grain`: one `feTurbulence` tile in a `data:` URI,
desaturated, painted by `.grain::before` at **4%** on the join band and the 404.
No request, no raster asset, no layout, dropped in forced colours and in print.

One measured side effect, recorded because it looks like a regression and is
not: axe now reports `color-contrast` as **incomplete** (not a violation) on
those two sections, because it cannot compute a background behind a
`background-image`. The real composite shift is under 3/255 of lightness on a
19:1 pair.

### 1.5 Logo tiers

| Tier | Where | Size rule |
|---|---|---|
| **Wordmark** | header, footer, `og.png` | `--mark-w` with a `max(100px, ...)` floor. 104 / 132 / 168 px |
| **Icon** (notched A) | `favicon.svg`, `favicon.ico`, `favicon.png`, `apple-touch-icon.png`, the 404 mark | any size |
| **Hero mark** (profile) | nothing on the website | 96 px and above only |

The icon is **extracted, not redrawn**. `Mark.astro` pulls the A subpath out of
`WORDMARK_PATH` with a regular expression at build time and throws if it is not
there; `src/assets/brand/artemis-icon-a.svg` is written from the same substring
by the icon generator. Verified visually at 192 px: it renders as the A alone.

The pass-5 `lockup` variant is gone. `og.png` is regenerated: the wordmark in
Mist on flat Night, its left edge at exactly 8% of 1200 px, vertically centred,
with a 6 px Signal rule along the foot. 5,996 B, down from 115,738 B. Grain was
tried on it and rejected: it added 85 KB to a flat ground for a texture nobody
can see at card size.

**The hero mark has no place on this website, and that is the finding rather
than a gap.** The header and footer are the wordmark's job, everything under
96 px is the icon's, and adding the profile somewhere in order to use it would
be decoration. The variant stays in the component because the social and OG
assets are generated from it.

### 1.6 The grid

`--pad-x` is `8vw` at 1024 and above. A centred shell cannot satisfy the brand
grid - at 1920 a `max-width: 1400px; margin-inline: auto` box puts its content
edge at 16.5% - so `.container` and `.nav-inner` are left-aligned boxes
(`margin-inline: 0 auto`, `max-width: calc(var(--shell) + 2 * var(--pad-x))`)
and `--shell` rises to 1600 px.

| Viewport | Left edge | Content width | Right gutter |
|---|---|---|---|
| 1024 | 81.9 px (8%) | 860 px | 81.9 px |
| 1440 | 115.2 px (8%) | 1210 px | 115.2 px |
| 1920 | 153.6 px (8%) | 1600 px | 166.4 px |
| 2560 | 204.8 px (8%) | 1600 px | 755 px |

Symmetric below 1920; above it the right gutter grows while the left edge stays
on the brand grid, which is the trade the brand core asks for.

### 1.7 Voice and copy

- `site.tagline` is **"Every shot on the record."** - footer, every meta
  description, `og:image:alt`, the JSON-LD slogan.
- `site.motto` is **"Take the shot."** and is used **once**: the heading of the
  home join band.
- `site.hashtags` is `[]`; the footer tag line and the About tag row are gone.
- The four "X over Y" pillars are replaced by the **three commitments**, each
  with its test line, under **"What we stand for"** on `/` and `/about`.
- The results module is **"The Scoreboard"**, subtitled "Recent results ...",
  at `#scoreboard`; the nav label is "Scoreboard".
- `site.mission` is the brand core's mission sentence verbatim.
- Removed: "Quiet. Precise. On the hunt.", "Built in silence.", every use of
  silence / precision / noise / called by the hunt, and **every sentence about
  our own restraint** - "We keep the list short", "We would rather do a small
  number of partnerships properly", "The roster stays small on purpose", "We do
  not publish follower counts on a marketing page".
- Measured on all six rendered pages: **0 exclamation marks, 0 emoji, 0 em
  dashes, 0 en dashes, 0 middle dots**.
- Proof points only. `/partners` still shows channels rather than follower
  counts, and now says so without congratulating itself for it.

### 1.8 `docs/brand-core.md`

Written. Sections 1-3 and 5-8 of the iRacing-scoped core verbatim, the growth
triggers, then an appendix carrying v2's naming table and per-title dials
(explicitly not live), then an **"Applied on the website"** table with one row
per rule and the token, component or file that carries it. Sections 4 and 10 of
the source are deliberately not reproduced and the file says why.

---

## 2. Phase 2: the retention features

### 2.1 `/join`

New page. Open seats from a new hand-edited `src/data/seats.json`, the four
expectations from `site.json`, and one CTA into the Discord ticket. Validated
by `check-data.mjs` (id, program, role, 1-6 requirements, status, note).
Two open seats ship as placeholders.

The empty state is real and was tested: with `seats.json` at `[]` the page head
says "No seats open right now" and the section prints an honest sentence with
the Discord still offered. Nothing invents a seat to fill the section.

Nav is now **Scoreboard / Team / Join / Partners** plus the CTA, with `/about`
in the footer only. `nav.json`, `links.ts`, `public/sitemap.xml` and
`vercel.json` (the `/join` redirect removed, `/results` re-pointed at
`/#scoreboard`) all follow.

### 2.2 Audience router

Directly under the next-race strip: three text links with one line each, three
hairline columns, no cards and no icons. "Follow the team" to `/#scoreboard`,
"Race for us" to `/join`, "Partner with us" to `/partners`.

### 2.3 Per-audience CTA labels

`links.ts` holds three intents: `join` ("Join the Discord"), `apply` ("Apply in
the Discord") and `partnership` ("Partner with us"), each with a `short` label
for the phone bar and an `audience` for analytics. Measured per page, the CTA
label sets are: home/team/about 2 labels for one intent (the full one and the
compact "Discord"), `/join` 3, `/partners` 2.

### 2.4 Sticky phone bar

`StickyCta.astro`, `<= 820px` only. 55 px plus a hairline = 56 px, plus
`env(safe-area-inset-bottom)`. `position: fixed` from the first frame, so it
can never move the document: **CLS 0 on every Lighthouse run**. Transform-only
motion (`translateY(100%)` to `0`) with `visibility` toggled on the same clock
so it leaves the tab order when it leaves the screen; `transition: none` under
reduced motion. Two IntersectionObservers, no scroll listener. Hidden while the
menu is open, and once the footer is in view.

### 2.5 Analytics

Umami Cloud, env-gated on `PUBLIC_UMAMI_WEBSITE_ID`. Verified by building with
and without it:

- **Without**: no `<script src>` in any page, and the footer says "We run no
  analytics and set no cookies."
- **With**: the tag is present with the right `data-website-id`, the footer says
  "Cookieless analytics, no consent banner.", and the home page carries all five
  placements - `header` x3, `hero`, `join`, `sticky`, `footer` - with
  `data-umami-event-audience` on every one.

**The defect worth naming.** The first CSP allowed `https://cloud.umami.is` in
`script-src` and `connect-src`, which is what the brief specified and what every
quick-start tells you. Under test the tag loaded and **every event was blocked**:
Umami Cloud serves the script from `cloud.umami.is` and posts to
`gateway.umami.is`. Both are in `connect-src` now, and with that the analytics
build reports **0 CSP violations** on all six pages (the only console line left
is a 400 from Umami, because the test website id is fake, which is itself proof
the request reached the gateway). `DEPLOY.md`'s CSP paragraph says so.

### 2.6 `events.startTime`

Validated as an ISO 8601 UTC stamp on the same date as `start` (seconds
required, literal `Z`, no offset form). The strip prints `15:15 UTC` as static
text; the client rewrites it in the visitor's zone with the zone's short name,
and adds the local date when the conversion crosses a day boundary. The
countdown targets the green flag when present, so zero means "Under way";
without a `startTime` it keeps the pass-5 "Race day" / "Under way" behaviour.

With JavaScript disabled the strip reads `25 - 27 SEP 2026` and `15:15 UTC`,
and the countdown stays `hidden` - measured.

One consequence worth writing down: a US Friday-night league at 8pm Eastern is
the *next* UTC date, so such an event either carries no `startTime` or gets one
the validator rejects. That is the contract, not a bug, and `CONTENT.md` says so.

### 2.7 `drivers.iracingId` and `stats.json`

`iracingId` is validated (integer 1-99999999, optional, and two drivers may not
share one). `stats.json` is **soft**-validated: every finding is a warning,
including "this is not JSON", so a failed nightly sync can never fail a build.

Rendering, proved end to end with a fixture shaped like the contract's example
and then removed again (`audit-tool/stats-test6.mjs`):

- Home teaser: the iRating alone (`iRating 5012`).
- Team page: iRating and licence for the driver's own category, then a
  four-column table of the three newest races - `12 SEP 2026 / IMSA Endurance /
  P9 to P4 / 3120` - in Inter tabular figures.
- A fourth `recent` row was **not** rendered (capped at three).
- An entry keyed to an id that is not in `drivers.json` rendered **nothing**.
- A crew member with an entry rendered **nothing** (no racing category).
- A driver with no entry rendered no label at all, not an empty one.

The file is not in the repository, so the shipped build renders none of it. The
site's behaviour with it absent is the default that ships.

The start-to-finish column says "**to**", not an arrow: every arrow on this site
is an inline SVG affordance meaning "go somewhere", and the subset faces carry
no arrow characters.

### 2.8 Media kit

`public/media-kit.pdf` is checked with `existsSync` at build time. Present: a
"Media kit (PDF)" text link under "Where the audience is". Absent: no link.
Noted in `CONTENT.md`.

---

## 3. Verification

Everything below is against the final build. Nothing was measured on the dev
server.

### Build

```
npm run build   ->  exit 0
                    prebuild: check:data passed (6 results, 8 drivers,
                              3 events, 2 seats)
                    6 page(s) built in ~730 ms
                    zero warnings
```

`dist/` = **2,518,986 bytes across 76 files**.

| Route | HTML raw | gzip | brotli |
|---|---|---|---|
| `/` | 118,314 | 23,552 | **18,273** |
| `/team` | 79,415 | 15,692 | 13,279 |
| `/join` | 65,635 | 14,302 | 12,161 |
| `/partners` | 86,558 | 16,659 | 14,159 |
| `/about` | 70,274 | 15,396 | 13,027 |
| 404 | 55,808 | 12,406 | 10,614 |

0 external JavaScript files, 0 external stylesheets, and 0 third-party requests
unless analytics are switched on.

### Lighthouse 13.4.1, brotli + `vercel.json` headers server

Two consecutive runs, identical numbers on both.

| Route | Perf | A11y | BP | SEO | FCP | LCP | CLS | TBT | SI |
|---|---|---|---|---|---|---|---|---|---|
| `/` mobile | **100** | **100** | **100** | **100** | 0.8 s | **1.7 s** | **0** | **0 ms** | 0.8 s |
| `/team` mobile | **100** | **100** | **100** | **100** | 0.7 s | 1.2 s | **0** | **0 ms** | 0.7 s |
| `/join` mobile | **100** | **100** | **100** | **100** | 0.6 s | 1.2 s | **0** | **0 ms** | 0.6 s |
| `/about` mobile | **100** | **100** | **100** | **100** | 0.7 s | 1.2 s | **0** | **0 ms** | 0.7 s |
| `/partners` mobile | **100** | **100** | **100** | **100** | 0.8 s | 1.4 s | **0** | **0 ms** | 0.8 s |
| `/` desktop | **100** | **100** | **100** | **100** | 0.2 s | 0.4 s | **0** | **0 ms** | 0.2 s |

The floor was 99/100/100/100 on `/`, `/team` and `/join`. Against pass 5: `/`
LCP 1.8 s to **1.7 s**, `/team` 1.2 s held, and `/join` is new.

### axe-core 4.13.0

**Zero WCAG 2.0 / 2.1 / 2.2 level A and AA violations**, six pages at 1440 and
390, plus the mobile menu with the panel open. Three rules report *incomplete*
(needs review, not a failure): `color-contrast-enhanced` (the AAA 7:1 bar,
included on purpose), `color-contrast` (axe cannot compute a background behind
the nav scrim, the hero photo or the grain), and `hidden-content` (the elements
that are hidden at the other breakpoint).

### Keyboard

**174 tab stops** across the six pages (36 / 28 / 23 / 39 / 22 / 26).
**0 without a visible `solid 2px rgb(15, 255, 207)` ring, 0 without an
accessible name, 0 outside the viewport when reached.** The skip link is stop 1
and lands on `MAIN#main`. `/#scoreboard` lands 88 px from the top against a
73 px bar, both as a direct load and as an in-page click. The menu trap cycles
ten stops; Escape closes it, returns focus to the toggle, unlocks the body and
clears `inert`.

### CSP, headers, cache and redirects

**0 CSP violations, 0 console errors, 0 failed requests on all six pages at
1440 and 390**, with the real `vercel.json` and brotli negotiated. Every page
reports the policy and the five other security headers, the client module
running, every reveal settled (12/12, 8/8, 9/9, 7/7, 8/8), the countdown
rendered and the marker at `P2`.

| Path | Cache-Control |
|---|---|
| `/_astro/*.webp` | `public, max-age=31536000, immutable` |
| all four `/fonts/*.woff2` | `public, max-age=31536000, immutable` |
| `/og.png`, `/favicon.svg` | `public, max-age=86400` |
| `/` | `public, max-age=0, must-revalidate` |

Redirects, probed live: `/results` 301 to `/#scoreboard`, `/calendar` 301,
`/media` 301, `/legacy` 301, `/team.html` 301, `/404` 301, `/team/` 308 to
`/team`. `/join` is a 200 and no longer a redirect.

### Robustness

- **JS disabled**, six pages: `html` carries no `js` class, every `<h1>` at
  `opacity: 1` and `transform: none`, **0 of 44 reveals offset, faded or
  zero-height**, the countdown correctly `hidden` with the static date and time
  still printed (`25 - 27 SEP 2026` + `15:15 UTC`), the garage controls
  `visibility: hidden`, the menu hidden, the footer year from the build.
- **Reduced motion**: `document.getAnimations()` **0 running, 0 total**, the
  parallax not attached, reveals `transform: none`, the transition property and
  duration lists clamped together, the sticky bar's transition removed.
- **Print**: `body` `rgb(255,255,255)` on `rgb(0,0,0)`, headings and cells
  black, the fixed nav and the sticky bar dropped, the grain dropped.
- **200% text**, all six pages at 390: layout viewport holds **390**, no
  overflow, the hamburger 44x44 and fully on screen at x=316.

### Empty-data builds

Each file copied, replaced with `[]`, built, screenshotted, restored.

| Case | Build | Pages | Validator |
|---|---|---|---|
| `results.json: []` | **exit 0** | 6 | `passed (0, 8, 3, 2)` |
| `events.json: []` | **exit 0** | 6 | `passed (6, 8, 0, 2)` |
| `partners.json: []` | **exit 0** | 6 | `passed (6, 8, 3, 2)` |
| `drivers.json: []` | **exit 0** | 6 | `passed (6, 0, 3, 2)` |
| `seats.json: []` | **exit 0** | 6 | `passed (6, 8, 3, 0)` |
| all five at once | **exit 0** | 6 | `passed (0, 0, 0, 0)` |

Screenshots in `shots/r6-empty/`. **Data files restored byte-identical
(SHA-256), no `.bak` left behind.**

### Screenshots

- `shots/r6/` - 84 files, 1440x900 and 390x844 at DPR2, all six routes, full
  pages and scroll sequences. **Console: 0 messages, 0 page errors, 0 failed
  requests on all five real routes**; the 404's four entries are the deliberate
  HTTP 404 on the document itself.
- `shots/r6-tablet/` - 88 files at 768x1024 and 1024x768. Same console result.
- `shots/r6-signal/` - 48 captures, photographs hidden and shown, behind the
  Signal measurement.
- `shots/r6-stats/` and `shots/r6-empty/` - the two data-state proofs.

Viewed directly: every desktop full and hero on all six routes, the home mobile
scroll sequence, the 1024 tablet hero, the seats-empty `/join`, and the
stats-present `/team`.

### Anti-slop pre-flight, re-run page by page

`audit-tool/preflight6.mjs`, against the built pages in a real browser.

| Check | home | team | join | partners | about | 404 |
|---|---|---|---|---|---|---|
| Em dashes / en dashes / middle dots | 0 | 0 | 0 | 0 | 0 | 0 |
| Exclamation marks | 0 | 0 | 0 | 0 | 0 | 0 |
| Emoji | 0 | 0 | 0 | 0 | 0 | 0 |
| Eyebrows above a heading | **0** | 0 | 0 | 0 | 0 | 0 |
| Headed sections | 8 | 5 | 4 | 6 | 4 | 1 |
| Decorative status dots | 0 | 0 | 0 | 0 | 0 | 0 |
| Wrapped CTA labels | 0 | 0 | 0 | 0 | 0 | 0 |
| Nav rows / bar height | 1 / 72px | 1 / 72px | 1 / 72px | 1 / 72px | 1 / 72px | 1 / 72px |
| Scroll cue / locale strip / version stamp | none | none | none | none | none | none |

Hero stack discipline on `/`: **exactly 4 elements** - `h1.hero-title`,
`p.hero-lead`, `p.hero-proof`, `div.hero-actions`.

Impeccable absolute bans, by grep over `src/`: `background-clip` **none**,
`backdrop-filter` **none**, `border-radius` **one declaration**, `var(--radius)`,
which is 0; side borders greater than 1px **none**; `transition: all` **none**;
`ease-in` or a bouncing cubic-bezier **none**; one `addEventListener('scroll')`,
passive, on the garage track.

Two harness corrections, both commented in place:

1. **`preflight6.mjs` reported the nav as two rows at every width from pass 6
   on, and the nav has never wrapped.** It counted distinct rounded `top`
   values; the four links sit at top 13 and the CTA at top 14, because the
   button carries a 44px `min-height` and the links carry padding. It measures a
   real row break now (an item whose top is at or below another item's bottom),
   which reports 1 row at 1024, 1280, 1440 and 1920.
2. **`kbd.mjs` and `csp-check.mjs` still probed `#results` and the old font
   filenames.** Both updated; `csp-check.mjs` now probes all four faces.

One pass-5 claim that does not survive re-measurement, and is not a defect:
pass 5 recorded "`grep 100vh src/` returns nothing". It returns one line, and
always did - `animation-range: 0 100vh` on the hero parallax, which is a
scroll-timeline range rather than a layout height. `100dvh` is still the only
viewport height used for layout.

---

## 4. Files changed

```
public/fonts/                 four subset faces + OFL.txt added,
                              four pass-5 faces deleted
public/favicon.svg            regenerated from the icon (the notched A)
public/favicon.ico            regenerated, 16/32/48
public/favicon.png            regenerated, 192
public/apple-touch-icon.png   regenerated, 180
public/og.png                 regenerated: wordmark on Night, 8% left edge
public/sitemap.xml            /join added, /about re-ordered
src/assets/hunt-texture.jpg   DELETED
src/assets/brand/artemis-icon-a.svg   NEW, extracted from the wordmark path
src/styles/global.css         rewritten: four @font-face rules with
                              unicode-range, the whole token set renamed and
                              remapped, weight/width/leading/tracking, .grain,
                              the 8% grid, the sticky-bar press family
src/layouts/Base.astro        two preloads, the env-gated Umami tag, the
                              sticky-bar slot, monoBold removed
src/components/Mark.astro     rewritten: wordmark / icon / hero, the icon
                              extracted from the wordmark path
src/components/Nav.astro      wordmark, the 8% box, Signal only on the
                              underline and the focus ring, analytics
                              attributes, the sticky-bar exclusion
src/components/Footer.astro   wordmark, the promise, hashtag row removed, the
                              two analytics footer states
src/components/Hero.astro     CTA from links.ts, #scoreboard, the width-axis
                              second line, Signal only on the marker
src/components/NextRace.astro startTime, the local-time line, the exact
                              countdown flag
src/components/PillarBand.astro  three commitments with test lines, 3-across
src/components/JoinCta.astro  texture out, grain in, motto heading, intents
src/components/DriverCard.astro  stats prop, the teaser iRating, the recent
                              races table
src/components/AudienceRouter.astro  NEW
src/components/StickyCta.astro       NEW
src/components/GarageSlide.astro     slide-car off Signal
src/components/PartnerBand.astro     token rename only
src/components/ResultsTable.astro    podium off Signal, weights
src/components/PageHead.astro        token rename only
src/pages/index.astro         #scoreboard, the router, the new headings, stats
src/pages/join.astro          NEW
src/pages/team.astro          stats wired, copy
src/pages/partners.astro      copy, media-kit slot, analytics, cta prop
src/pages/about.astro         h1, mission, the three commitments, copy
src/pages/404.astro           the icon mark, grain, plain copy, cta="none"
src/data/site.json            tagline, motto, team, mission, commitments,
                              expectations, hashtags emptied
src/data/nav.json             Scoreboard / Team / Join / Partners, about to
                              the footer
src/data/seats.json           NEW
src/data/drivers.json         iracingId on two records
src/data/events.json          startTime on one record
src/lib/links.ts              three intents with audience
src/lib/data.ts               Seat, DriverStats, StatsFile, openSeats,
                              driverStats, eventTarget
src/lib/stats.ts              NEW, the optional glob import
src/lib/analytics.ts          NEW
src/lib/format.ts             raceTimeUtc
src/scripts/site.ts           local time, the exact countdown, the sticky bar
scripts/check-data.mjs        seats, startTime, iracingId, stats soft-check
vercel.json                   /join redirect removed, /results re-pointed,
                              two Umami origins in the CSP
docs/brand-core.md            NEW
docs/pass6-report.md          NEW (this file)
DESIGN.md                     sections 0, 1, 2, 3, 3b, 3c, 6, 7, 9
PRODUCT.md                    naming, CTAs, IA, content model, constraints,
                              three new open decisions
CONTENT.md                    the never-use words, seats, start times, stats,
                              media kit, analytics, nav
README.md                     brand, the six pages, analytics, the branch table
DEPLOY.md                     the CSP paragraph and a new analytics section
```

Scratchpad tooling added: `font-tool/{subset6,sweep6,sweep6b,sweep6c}.mjs`,
`make-icons6.mjs`, `audit-tool/{signal6,fonts6,preflight6,robust6,
stats-test6}.mjs`, `perf-tool/lh6-vercel.mjs`, `empty-test6.mjs`.
Three existing harnesses corrected: `audit-tool/kbd.mjs` (the `#scoreboard`
anchor), `audit-tool/csp-check.mjs` (the font paths and the removed `/join`
redirect), `audit-tool/preflight6.mjs` (the nav-row check).

Nothing committed. `node_modules/` untouched. Nothing written outside the
project and the scratchpad.

---

## 5. Deferred

| Item | Why |
|---|---|
| **The Arc** | The brand core's one recurring graphic device. Explicitly deferred to the designer by the pass brief, and rightly: inventing one here would put a second, wrong version of a brand asset into circulation. |
| **The hero mark on the site** | Not a gap. The wordmark owns the header and footer, the icon owns everything under 96 px, and adding the profile in order to use it would be decoration. Recorded in `DESIGN.md` §3b. |
| **The home `<h1>`** | Still the org's name, under a header wordmark that says the same thing. See "least sure" #1. |
| **`docs/data-contract.md`** | Was at v1 when this pass started. Another agent brought the repo copy to v1.2 during the pass; re-read at the end and it documents `startTime`, `iracingId` and `stats.json` exactly as implemented here, on the new branch names. Nothing needed. |
| **`@fontsource/jetbrains-mono` is still a dependency** | Unused now. `package.json` is explicitly not mine to touch. |
| **`/#results` as a bare fragment** | Cannot be redirected server-side; it now lands at the top of the home page. Acceptable on a branch that has not shipped. |
| **G14 (unused inlined CSS), G21 (`twitter:*` tags), G23 (the disabled garage `prev` button)** | Still deferred, with pass 5's reasoning unchanged. |
| **The owner decisions in `PRODUCT.md`** | Real roster and results, driver headshots, a rig photograph, whether iRating is published about real people at all, a dark GLYTCH mark, a clean Nordschleife render, the NordVPN question, the `/join` placeholders, and switching Umami on. |

---

## 6. The five things I am least sure about

1. **The home `<h1>` still says "ARTEMIS / ESPORTS" under a header wordmark
   that says the same thing.** This is the decision I made most against
   instinct. Pass 2 filed it (B3) and pass 5 deferred it; the honest reading of
   the pass-6 brief is that it should stay, because the brief asks for the
   condensed width on "h1/h2 and the wordmark-adjacent labels", which is
   precisely what that heading is. But the first screen now states the org's
   name twice in two treatments, and the promise - "Every shot on the record."
   - would be a better first sentence than the name. I separated the two lines
   on Archivo's width axis rather than on colour, which is the most that could
   be done without making the call. Somebody should make it.

2. **Splitting the fonts by `unicode-range` is the right engineering and it
   changes what "all faces loaded" means.** The brief asked to verify
   `document.fonts` 4/4 loaded. What ships is 4 faces declared, 2 loaded on a
   page view and 4 loaded when a character in the ext range is rendered - by
   design, and that is exactly how the 44 KB comes back. I verified both halves
   and I think it is unarguably better than one file per family. But it is not
   what was asked for literally, and if a future pass re-reads the requirement
   without the reasoning it will look like a miss.

3. **`--muted-deep` (#486B62, 3.4:1) on the 404 mark at 288 px.** The brand core
   calls that value "large decorative text, disabled states, hairline-ish uses",
   and a 288px glyph is all three. It reads clearly on screen. But 3.4:1 is
   below the 4.5:1 body-text bar and only just over the 3:1 large-text one, and
   the 404 mark is the single biggest thing on that page - if anyone ever
   decides it is content rather than decoration, it is the wrong colour. I left
   it because the alternative (`--muted`) makes the mark louder than the
   headline beside it.

4. **The `/join` header CTA says "Join the Discord" while the page's own
   primary says "Apply in the Discord", and both go to the same URL.** That is
   what the brief specifies and I think the wording is right - telling someone
   who is already on the join page to "join the Discord" is odd - but it is two
   labels for one destination on one page, which is the exact rule pass 5 spent
   a paragraph defending against. I traded one inconsistency (the old "See
   results" / "All results" pair, now fixed) for another.

5. **The four `join.expectations` rows and both seats are plausible rather than
   agreed.** The practice cadence, the monthly endurance commitment, the conduct
   line, the minimum age of 16, and both rating floors are placeholders I wrote,
   and unlike the driver and result placeholders they are not obviously fake to
   a reader. A prospective driver will read "iRating 2000 or above in sports
   car" as a rule. They are flagged in `seats.json`, in `site.json`'s structure,
   in `CONTENT.md` and in `PRODUCT.md`, but they are live copy on a live page
   and that is a different kind of placeholder from a fake driver name.

---

## 7. Stop conditions

**None hit.**

- **The build never failed after a real fix.** Every `npm run build` in this
  pass returned exit 0 first time, including all six empty-data builds, the two
  analytics builds and the two stats builds.
- **One rule pair came close to conflicting and is worth recording.** The
  brand core mandates Inter; impeccable's `reference/brand.md` lists Inter on
  its reflex-reject font list. The brand core wins, the same reference says
  identity-preservation wins where a brand has already committed to a face, and
  `DESIGN.md` section 0 records the conflict and the choice alongside two
  others of the same shape.
- **No file outside my ownership needed a change in the end.**
  `docs/data-contract.md` was the one candidate; another agent brought it to
  v1.2 during the pass and it now matches this implementation. Three small
  staleness items in `DEPLOY.md` are reported rather than edited, because the
  pass brief allows appending to that file's CSP paragraph only.
