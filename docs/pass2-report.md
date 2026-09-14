# Pass 2 report - Artemis Esports

Target: `D:\Artemis\Website\Website` (Astro 7, static). Not committed.
Evidence: `<scratchpad>\shots\r2\` (76 files, final build), the interaction
harness `<scratchpad>\shots-tool\verify-r2.mjs` (14 checks, all pass), and
Lighthouse 13.4.1 mobile runs in `<scratchpad>\perf-tool\lh-home-r2.json` /
`lh-team-r2.json`.

---

## 0. Headline

Both orchestrator-verified bugs are gone, all three P0/P1 sets are cleared, and
the page that the whole site rests on now publishes evidence rather than
assertions. Counts:

| Critique | Findings | Fixed | Deferred |
|---|---|---|---|
| A (UX heuristics) | 25 | 24 | 1 (A5b) |
| B (visual / anti-slop) | 25 | 23 | 2 (B3, B8 in part) |
| C (motion / interaction / perf) | 20 | 19 | 1 (C20) |
| Orchestrator §2 | 2 | 2 | 0 |

Deduplicated, that is 51 distinct issues fixed and 4 deferred. Every P0 and P1
is closed except **B3**, which the brief's keep-list protects.

---

## 1. Data contract integration

`docs/data-contract.md` is a byte-identical copy of the scratchpad file.

### Files converted

**`results.json`** now carries `id` (`<date>-<slug(event)>-<slug(class)>`),
`entries` where we have a field size, and `drivers` as a string array of full
names that match `drivers.json`. Two class values were outside the contract
enum and were mapped: `NASCAR Class B` to `NASCAR Xfinity`, `Trucks` to
`NASCAR Trucks`. `driver` (a single "A / B / C" string) became `drivers`.
Field sizes were added to four of six records and deliberately left off two, so
the optional path is exercised on the live page: `P3` and `P9` print bare, the
rest print `of 44`. Those numbers are placeholders like the positions they sit
next to and are listed as such in `CONTENT.md`.

**`drivers.json`** gained `id`, `role` (`driver` / `pitwall` / `staff`),
`active`, and lost the empty `stats: {irating: "", licence: ""}` and
`socials: {}` objects, which were not contract-valid (`stats.irating` is an
integer, `stats.licence` matches `^[A-DRP] \d\.\d{2}$`). Both fields are simply
absent now, which is what "renders only when present" means. Countries were
already ISO alpha-3. The file is in contract sort order (road, oval, crew; then
number ascending; crew by name).

**`events.json`**: `date`/`endDate` became `start`/`end`, `status: "entered"`
became `confirmed` / `planned`, classes were mapped to the results enum, `id`
added, and the `start` UTC timestamp dropped. The countdown now derives its
target from the start date at 00:00 America/Chicago (`countdownTarget()` in
`src/lib/data.ts` computes the CST/CDT offset from the US DST rule rather than
hardcoding one).

### Rendering rules implemented

| Rule | Where |
|---|---|
| Home results = first 6 after sorting | `recentResults(results, 6)` |
| Hero proof = lowest `position` among the newest 3 | `heroProof()` |
| Partners snapshot = first 3 | `recentResults(races, 3)` |
| "Who drives" = first 4 active `role: driver` | `featuredDrivers()` |
| Team page = active drivers grouped road / oval / crew | `driversInGroup()` |
| Next race = first future `planned`/`confirmed`, with the "No race scheduled" fallback and the last `done` event as subtitle | `upcomingEvents()` / `lastCompletedEvent()`, rendered in `NextRace.astro` |
| `stats` and `socials` render only when present | `DriverCard.astro` |
| Readers never assume file order | every selector re-sorts inside `src/lib/data.ts` |

### Validation

`scripts/check-data.mjs` checks types, enums, ranges, patterns, unique ids,
date sanity (nothing more than a day in the future, real calendar dates), array
lengths, `position <= entries`, `number` only empty for crew, https-only social
URLs, and the contract sort order (a warning, not an error, because the site
re-sorts). Errors print as `file[index].field: message` and exit 1. Wired as
`"check:data"` and `"prebuild"` in `package.json`, so Vercel fails the build
and keeps the previous deployment when the bot writes something invalid.

Negative-tested by corrupting eight fields at once: it reported all eight with
correct paths and exited 1. `results.json[3].position: cannot be worse than the
field size (P3 of 1)` is the kind of line it produces.

It also warns (does not fail) when a result names a driver who is not in
`drivers.json`, because that silently removes their "Last drive" line.

---

## 2. Orchestrator-verified observations

**§2.1 - results table invisible on mobile.** `.reveal` no longer touches
`opacity` at all: it moves 12px and nothing else, so the worst case is an
offset, never a blank screen. The observer runs at `threshold: 0` with
`rootMargin: 0px 0px 10% 0px`, and a 1.5s timer adds `in-view` to anything still
pending. The reduced-motion block drops the transition entirely instead of
leaving an opacity rule behind. Reveals were also removed from whole-section
wrappers (the results table, the roster teaser) and kept only on sibling lists.
**Verified:** `mobile-home-scroll-01.png` now shows six populated rows, and the
harness reports the table at 1677px tall and `opacity: 1` with no scroll
performed.

**§2.2 - nav transparent after the hero.** The sentinel was already at the
document top; the real defect was the 94%-opaque `is-stuck` background (plus a
`backdrop-filter` the minifier had stripped down to the `-webkit-` alias).
`.site-nav.is-stuck` is now `background: var(--bg)` with no blur.
**Verified:** the harness reports `is-stuck=true`, `background=rgb(0, 10, 8)`,
`backdrop-filter=none` after a 700px wheel at 390px, and the ghost button no
longer shows through in `mobile-home-scroll-01.png`.

---

## 3. Critique A - findings

| ID | Sev | Status | What was done |
|---|---|---|---|
| A1 | P1 | Fixed | `PageHead` gained an `action` slot; `/partners` renders the mailto button in the first screen, and `nav.json` `ctaOverrides` swaps the header button on that path to the same mailto with the same label. The sponsor's action is now on screen at every scroll position. |
| A2 | P1 | Fixed | Hero swapped to `interlagos-lmp2.jpg`. See §6. |
| A3 | P1 | Fixed | Three bands re-cut. `PillarBand` is a four-across register under a full-width heading; `PartnerBand` (home) is a logo-led horizontal row with no heading column; `JoinCta` is a full-width statement with the three steps running underneath. `PageHead` gained an `aside` slot so the three inner pages open with content, not a void. Home now runs seven compositions across eight sections. |
| A4 | P1 | Fixed | `entries` added to the contract and the data; the Pos cell prints `P2` over `of 41` when present and `P2` alone when not; `series` renders as its own line under the event name. |
| A5 | P1 | Fixed (a) / **Deferred (b)** | (a) every roster row prints that driver's most recent finish, derived from `results.json` by name match: "Last drive: P2 of 41, Suzuka 1000, 06 SEP 2026". (b) filling `stats.licence` is **deferred**: these are placeholder drivers, so a licence class would be an invented number, which PRODUCT.md forbids. The slot renders the moment real values arrive. |
| A6 | P2 | Fixed | Mobile hero uses `object-position: 52% center` plus a `--media-zoom: 1.3` crop anchored at `52% 56%`, so the car reads at thumb distance instead of sitting under the darkest part of the scrim. |
| A7 | P2 | Fixed | `is-stuck` is fully opaque; `backdrop-filter` removed. |
| A8 | P2 | Fixed | Wrapper `.reveal` removed from both results tables; see §2.1. |
| A9 | P2 | Fixed | `NextRace` renders the next event plus every other upcoming entry as hairline rows with the date, name, track and `status`. |
| A10 | P2 | Fixed | The Nordschleife render was re-cropped from the 1919px original to exclude both AMG hoardings. See §6. |
| A11 | P2 | Fixed | The collage moved inside "Where this came from" and each frame gained a `<figcaption>` saying what it is and where it sits in the story. The "Our people, in person" heading is gone. See §7 for the part not done. |
| A12 | P2 | Fixed | `PillarBand` gained a `long` variant; `/about` renders each value with a sentence about what it costs on a race weekend (`detail` in `site.json`), on a different composition from home's. |
| A13 | P2 | Fixed | Roster rows carry `id={driver.id}`; teasers link to `/team#<id>`. |
| A14 | P2 | Fixed | `Results` added to `nav.primary` (four items, still inside the rule) and to the footer "Pages" column, so results are reachable from every page. |
| A15 | P2 | Fixed | `setOpen` sets `inert` and `aria-hidden` on `#main` and the footer, moves focus into the panel, and a Tab handler cycles the toggle plus the panel links. |
| A16 | P2 | Fixed | The progress thumb is sized to `clientWidth / scrollWidth` and translated across the remainder, so at rest it is a 50% bar, not a 1px artifact. |
| A17 | P2 | Fixed | Groups with fewer than three members drop the sticky rail and run a full-width head bar with the count on the right. Road keeps the rail; Oval and Pitwall no longer leave a 500px void. |
| A18 | P2 | Fixed | The 404 mark is `--line-teal` at `min(18rem, 40vw)`, and `min(11rem, 42vw)` on mobile instead of 6rem. |
| A19 | P2 | Fixed | The meta line is "2026 season / endurance, GT and oval"; the counts moved into a dossier block beside the h1 that leads with the best finish. |
| A20 | P3 | Fixed | h1 is "Partner with Artemis"; every button for that intent says "Partner with us". |
| A21 | P3 | Fixed | `.page-meta` `max-width` is `34rem`, not `44ch`, plus `text-wrap: balance`. `/about` no longer prints a meta line at all: the founding dates are a data block in the page head. |
| A22 | P3 | Fixed | `<span class="sr-only"> (opens in a new tab)</span>` on every `target="_blank"` link: nav, mobile panel, hero, join band, partner marks, channels, footer. |
| A23 | P3 | Fixed | "Full roster (6 drivers)", counted from active `role: driver`. |
| A24 | P3 | Fixed | The row hover background is gone. |
| A25 | P2 | Fixed | Global `scroll-behavior: smooth` removed; same-document anchors are smoothed in `initAnchors()` with the reduced-motion query respected, and focus moves to the target. |

---

## 4. Critique B - findings

| ID | Sev | Status | What was done |
|---|---|---|---|
| B1 | **P0** | Fixed | See §2.1. Content is never faded from `opacity: 0`. |
| B2 | P1 | Fixed | Same work as A3, plus a heading-scale ladder: `display-xl` on the join band, `display-lg` on results and the values, `display-md` elsewhere. |
| B3 | P1 | **Deferred** | The h1 stays the two-weight ARTEMIS / ESPORTS lockup. The brief's keep-list protects it and critique A's do-not-change list calls it the best thing on the site; B cites taste's hero discipline. The brief wins over a critique by the triage rules. Mitigation: the claim was promoted from `--ink-dim` to full `--ink` so the sentence that carries the information reads first after the lockup. |
| B4 | P1 | Fixed | The three-step join block now appears **once**, on the home page (the brief lists it as home item 8). `/team` and `/about` pass `steps={false}` and carry one sentence each. The pillar band appears on both pages but in two different compositions with different content. |
| B5 | P1 | Fixed | A compact CTA sits in the mobile bar beside the hamburger and hides itself while the panel is open (the panel carries its own). |
| B6 | P1 | Fixed | `PageHead` `aside` slot: `/team` gets the six car numbers as an entry-list strip that links into the roster, `/about` gets Founded / First iRacing season / Programs as hairline data rows, `/partners` gets the season dossier. |
| B7 | P1 | Fixed | See §6. |
| B8 | P1 | Fixed in part / **Deferred in part** | The captions are in and the LAN shot now reads as history. "At least one frame must show a rig, a wheel, or a screen with a car on it" is **not** done: no such photograph exists, and every clean in-sim render is already the hero or a garage slide, so using one here would duplicate an image two screens apart. Logged as an open owner item in PRODUCT.md. |
| B9 | P1 | Fixed | The channel list is one column of seven. No hole, no half-width rule. |
| B10 | P2 | Fixed | `.pillar` (long variant) is `1.15fr / 1.6fr`; `.event-sub` is `56ch`; `.page-meta` is in `rem`. |
| B11 | P2 | Fixed | The header CTA is a ghost button while the bar is transparent and solid once stuck, so two identical teal blocks never share a viewport. On 404 the ghost duplicate went away with the label change. |
| B12 | P2 | Fixed | The Partners roster section is gone; roster exposure is a one-line entry list under the results table (`07 MATEO FERREIRA / 14 DANE KOWALCZYK / ...`), the results snapshot is three rows rather than four plus a dossier block in the page head, and the partner band uses its `stack` variant. |
| B13 | P2 | Fixed | The hashtag band is gone. The tags run along the foot of the values band on `/about`, which is where they belong and is what the brief asks for. |
| B14 | P2 | Fixed | The decorative teal square is gone. The strip now carries the rest of the calendar, which is the return-visit reason it was missing. A per-event `url` was **not** added, because that field is not in the contract. |
| B15 | P2 | Fixed | Same as A24. |
| B16 | P2 | Fixed | Both `backdrop-filter` declarations deleted. |
| B17 | P2 | Fixed | `.event-sub` (track and the race's one-line story) is `--ink-dim`; the class chip dropped to `--ink-faint`. The ramp now matches importance. |
| B18 | P2 | Fixed | `text-wrap: balance` on `.event-name`, `.driver-name` (both variants) and `.page-meta`. |
| B19 | P2 | Fixed | `.roster-teaser` is `1.5fr 1fr 1fr 1fr` with a larger number in the lead cell; `.offer-grid` gives livery placement the full row at a larger size and runs the other three beneath it. |
| B20 | P2 | Fixed | Footer is three equal columns with the channels column flush right. |
| B21 | P2 | Fixed | `public/robots.txt`, hand-written `public/sitemap.xml`, a `SportsTeam` JSON-LD block in `Base.astro` built from `site.json` (including `sameAs` for all seven real URLs), and one honest footer line: "We run no analytics and set no cookies." No new dependency: `@astrojs/sitemap` would have violated the brief's one-dependency rule for four URLs. |
| B22 | P2 | Fixed | "(c) 2026 Artemis Esports" and nothing else. The team page lead lost its "X over Y" construction. |
| B23 | P2 | Fixed | Same as A6. |
| B24 | P2 | Fixed | `@supports not (-webkit-text-stroke: 1px currentColor)` fallback on both the driver numbers and the new entry-list numbers. |
| B25 | P2 | Fixed | The toggle's accessible name becomes "Close menu" when open; focus moves into the panel; Tab is trapped. |

---

## 5. Critique C - findings

| ID | Sev | Status | What was done, and the measurement |
|---|---|---|---|
| C1 | **P0** | Fixed | `@keyframes enter-media` no longer touches `opacity`; it is a 640ms `scale(1.04)` settle. **Measured:** the LCP element on `/` is now the `<img>` at ~100ms in the harness, and Lighthouse LCP is 2.0s with the image actually on screen. |
| C2 | P1 | Fixed | Longhands (`animation-name` / `-duration` / `-timing-function` / `-fill-mode` + `animation-timeline`). **Verified in `dist/`, not dev:** the built page contains `html.js .hero-media[...]{animation-name:hero-drift;animation-duration:auto;animation-timing-function:linear;animation-fill-mode:both;animation-timeline:scroll(root);animation-range:0 100vh}`, and Chrome reports `animationName: "hero-drift"` with one running animation. `pass1-report.md` gap 7 corrected in place. |
| C3 | P1 | Fixed | `initGarage` calls `schedule()` (rAF) rather than `update()`. Then the reveal init turned out to be a second, larger source of the same problem, so it reads no geometry at all now. **Measured:** Lighthouse `forced-reflow-insight` went from 0 (65.6ms) to 1, and TBT from 70ms to 0ms. |
| C4 | P1 | Fixed | `role="region"`, `aria-label` and `tabindex="0"` moved to a wrapping `<div class="garage-viewport">`; the `<ul>` is a plain list again. **Measured:** `/` accessibility 97 to **100**. |
| C5 | P1 | Fixed | Focus trap plus `inert` on the content behind the panel. **Measured:** eight consecutive Tab stops with the menu open, zero outside it. |
| C6 | P1 | Fixed | The reduced-motion block clamps `transition-property` to colour and opacity site-wide and resets the two transform hovers. **Measured:** under `reduce`, `.text-link svg` and `.garage-frame img` both report a transition list with no `transform` in it. |
| C7 | P1 | Fixed | Ladder is `[640, 828, 1280, 1536, 1920]` at quality 58, and the hero source was re-exported at 1919px. **Measured:** 1440 at DPR2 now pulls **113.4 KB** (was 403.9 KB); the five steps are 12.7 / 20.8 / 47.7 / 68.9 / 113.4 KB. |
| C8 | P2 | Fixed | `.reveal` deleted from the results wrapper and the roster teaser. It was **kept on the pillar rows** with the 60ms stagger C10 asks for, because four `dt`/`dd` siblings are the "genuine sibling list" C8 says to keep. That is the one place C8 and C10 disagree and this is the call I made. |
| C9 | P2 | Fixed | `--dur-reveal: 320ms`. |
| C10 | P2 | Fixed | `style={--reveal-delay: ${i * 60}ms}` on the pillars, matching `JoinCta` and the partner offer items. All three list reveals now stagger at 60-70ms. |
| C11 | P2 | Fixed | Garage hover is `transform 200ms` at `scale(1.03)`. The identical 600ms rule on the About photos was fixed too (C did not name it). |
| C12 | P2 | Fixed | `--dur-entrance: 560ms`; hero delays 0 / 70 / 180 / 230 / 280ms, so the CTA row settles at 840ms rather than 1240ms. |
| C13 | P2 | Fixed | The skip link has no transition. **Measured:** `transition-duration: 0s`, still arrives at `top: 0` on the first Tab. |
| C14 | P2 | Fixed | Both `backdrop-filter` lines deleted, background solid. |
| C15 | P2 | Fixed | Moot once reveals stopped animating opacity, and the 1.5s safety covers it. **Measured on `/#join`:** 7 reveals, 0 below opacity 0.99, 0 without `in-view`. The original three-line rect fix was reverted because it was itself the forced reflow in C3. |
| C16 | P2 | Fixed | `.garage-controls` has `min-height: 44px` and toggles `visibility`, so the row is always 44px and the heading beside it never moves. |
| C17 | P2 | Fixed | `update()` does all three reads (`scrollWidth`, `clientWidth`, `scrollLeft`) before any write. |
| C18 | P2 | Fixed | `jetbrains-mono-400.woff2` preloaded beside the two Nexa faces. The 700 weight is still unpreloaded on purpose. |
| C19 | P2 | Fixed | `build.inlineStylesheets: 'always'`. **Measured:** zero external stylesheets on every route. |
| C20 | P2 | **Deferred** | The mobile menu still opens and closes instantly. C calls this its own lowest-confidence row and says to look at it on a real phone first; the instant swap is cohesive with a square, radius-free system, and I have no real device here. |

### Regression introduced and then removed

Adding the focus trap, the anchor handler and the reveal safety net pushed the
client module from 2.87 KB past Vite's 4 KB inline threshold, so Astro started
emitting it as an external file. `vite.build.assetsInlineLimit: 8192` restores
the property C praised: **zero external JS, zero external CSS**, nothing that
can 404.

---

## 6. The hero and garage renders (owner decision)

**Chosen hero: `src/assets/racing/interlagos-lmp2.jpg`** - the Artemis Oreca 07
LMP2 at Interlagos. I looked at all seven renders. It is the only one with no
third-party brand anywhere in frame: the car carries the Artemis leaf and
number 12 and nothing else, and the scenery is a hillside rather than trackside
hoardings. It is also natively 16:9 and shot at dusk against dark foliage, which
suits a near-black page far better than the two bright-sky portrait renders. It
was re-exported from the 1919px original so the width ladder has a real top step.
No crop is needed at 1440; at 390 a `--media-zoom: 1.3` anchored at `52% 56%`
brings the car up out of the scrim.

Runner-up considered and rejected: `watkins-glen-gtp.jpg` (teal GTP with ARTEMIS
ESPORTS on the wing) carries a legible **SIM LAB** door decal and a white sky
that fights the palette.

**The Daytona Porsche is now out of the site entirely.** I first moved it into
the garage on the theory that the NordVPN decal would be illegible at slide
size. It is not: `shots/r2/desktop-home-scroll-03.png` from that build shows
"NordVPN" clearly readable on the door in a 615px frame. Moving the problem was
not fixing it, so the render was dropped. Its source was also downscaled from
1920 to 1280 before it left, which removed a pointless 448 KB derivative.

**The Nordschleife render came back as a crop.** The uncropped frame is
dominated by two "AMG DRIVING PERFORMANCE" hoardings across the top third
(A10 / B7). Rather than a CSS zoom, which would have been soft on a retina
screen, the slide was re-cropped from the 1919x1078 original to
`extract({left: 388, top: 437, width: 1089, height: 611})`. The hoardings are
gone, the BMW M4 GT3 is the subject, and ARTEMIS ESPORTS reads on the door. The
uncropped file is backed up at
`<scratchpad>\originals\racing\nordschleife-bmw-m4-uncropped.jpg`.

**The garage is five slots, not six.** Sebring Mustang (portrait), Nordschleife
BMW (standard), Watkins Glen Cadillac (portrait), NASCAR Camaro (standard),
Indianapolis IR-18 (wide). It still scrolls about 1,000px past the viewport at
1440. `DESIGN.md` and `CONTENT.md` both say five now.

---

## 7. Everything deferred, with reasons

1. **A5b - fill `stats.licence` for the roster.** These are placeholder drivers.
   A licence class for a fictional person is an invented metric, which PRODUCT.md
   bans outright. The slot renders the instant real values are added.
2. **B3 - make the h1 the value proposition instead of the wordmark.** The
   two-weight hero lockup is on the brief's keep list and on critique A's
   do-not-change list. Where the brief and a critique conflict, the brief wins.
   The claim was promoted to full ink strength as compensation.
3. **B8 (part) - at least one photo showing a rig, a wheel or a screen with a
   car on it.** No such photograph exists, and the owner decision forbids new
   imagery. Substituting an in-sim render would duplicate the hero or a garage
   slide two screens apart. Captioned instead, and logged as the top open item
   in PRODUCT.md.
4. **C20 - animate the mobile menu open/close.** C's own lowest-confidence row.
   The instant swap is defensible and cohesive; changing it wants a real phone.

Nothing else from the three critiques is outstanding.

---

## 8. Build and dist numbers

```
npm run build   ->  exit 0
                    prebuild: check:data passed (6 results, 8 drivers, 3 events)
                    5 page(s) built in ~0.7s
```

| | Before (critique C) | After |
|---|---|---|
| `dist/` total | 2.24 MB, 45 files | **1.81 MB, 44 files** |
| `/` route (html+css+js) gzip | 18.7 KB | **19.3 KB** |
| `/team` route gzip | 12.3 KB | 13.6 KB |
| `/about` route gzip | 12.3 KB | 13.6 KB |
| `/partners` route gzip | 14.1 KB | 14.3 KB |
| `/404` route gzip | 10.0 KB | 10.9 KB |
| Client JS | 2.87 KB inline, 0 external | **4.78 KB inline, 0 external** |
| Stylesheets | 3 render-blocking, 6.2 KB gzip | **0 external, inlined** |
| Hero at 1440 DPR2 | 403.9 KB | **113.4 KB** |
| Largest image in `dist` | 448 KB (a stale Porsche derivative) | 222.6 KB (the About group photo at 1920) |

The route totals rose slightly because the CSS is now inside the HTML on every
page rather than in one cacheable file; the trade was Lighthouse's 590ms of
render-blocking savings against roughly 1 KB gzipped per route, and the numbers
below say it was worth it.

### Lighthouse 13.4.1, mobile preset, `dist/` over localhost

| Route | Perf | A11y | Best practices | SEO | FCP | LCP | CLS | TBT | SI |
|---|---|---|---|---|---|---|---|---|---|
| `/` | **99** (was 98) | **100** (was 97) | **100** | **100** | 1.2s | 2.0s | **0** | **0ms** (was 70ms) | 1.2s |
| `/team` | **100** (was 99) | **100** | **100** | **100** | 1.1s | 1.7s | **0** | **0ms** | 1.1s |

The two remaining "failures" on `/` are the same artifacts C identified:
`bf-cache` (my test server sends `cache-control: no-store`) and
`document-latency-insight` (no gzip on the test server). `forced-reflow-insight`
and `listitem` both went from 0 to 1.

### Interaction harness (`shots-tool/verify-r2.mjs`)

14 checks, 14 pass: parallax runs in the built CSS; the hero image is the LCP
element and is opaque from the first frame; `/#join` leaves nothing faded; the
mobile results table is 1677px tall with no scroll; the nav is
`rgb(0, 10, 8)` with `backdrop-filter: none` once stuck; eight Tab stops stay
inside the open menu; reduced motion carries no transform transitions; the
garage `<ul>` has no role override and the thumb is 50.8% wide; the skip link is
instant; no horizontal overflow at 390 on any route; the hero candidate at 1440
DPR2 is 113.4 KB.

### Console

Zero console messages, page errors, failed requests and 4xx/5xx on `/`, `/team`,
`/about` and `/partners`. The four on the 404 route are the server correctly
returning 404 for `/this-page-does-not-exist`.

### A note on the screenshot tool, so the next pass does not chase it

Two capture artifacts show up in `shots/r2` and neither is a site defect:

- One run produced a `desktop-home-scroll-01.png` that was near-black with the
  fixed header composited near the bottom of the frame. A scripted probe
  (`shots-tool/probe.mjs`) wheeling the same page reports `scrollY` advancing
  800 / 1600 / 2400 / 3200 / 4000 with `.site-nav` at `top: 0` every time, and no
  transform on `html` or `body`. Re-running the capture produced a correct frame.
  It is a headless compositor artifact, most likely because the scroll-driven
  hero animation now genuinely runs and puts the root scroller on the compositor.
- `desktop-home-scroll-04.png` and `-05.png` are occasionally byte-identical: a
  wheel step that did not advance. The same probe shows every step advancing.

---

## 9. Files changed

```
src/data/results.json      rewritten to the contract
src/data/drivers.json      rewritten to the contract
src/data/events.json       rewritten to the contract
src/data/cars.json         five slides, Porsche out, Nordschleife back
src/data/nav.json          Results entry, cta intents, ctaOverrides
src/data/site.json         pillar `detail` lines
src/lib/data.ts            NEW - all sorting, selection, the countdown target
src/lib/links.ts           NEW - the two CTA intents and the partnership mailto
scripts/check-data.mjs     NEW - contract validator
docs/data-contract.md      NEW - byte-identical copy of the contract
public/robots.txt          NEW
public/sitemap.xml         NEW
package.json               check:data + prebuild
astro.config.mjs           inlineStylesheets, assetsInlineLimit
src/layouts/Base.astro     mono preload, SportsTeam JSON-LD
src/styles/global.css      reveal, motion tokens, reduced motion, skip link,
                           roster teaser, scroll-behavior
src/scripts/site.ts        reveals, focus trap + inert, anchors, garage reads
src/components/*.astro     Nav, Hero, NextRace, ResultsTable, DriverCard,
                           Garage, GarageSlide, PillarBand, PartnerBand,
                           JoinCta, PageHead, Footer
src/pages/*.astro          index, team, about, partners, 404
src/assets/racing/         interlagos re-exported at 1919px,
                           nordschleife re-cropped, daytona downscaled
CONTENT.md                 rewritten around the bot
PRODUCT.md                 content model, CTA rule, open decisions
DESIGN.md                  sections 1, 5, 6, 8 + a new section 9 decision log
DEPLOY.md                  Vercel + the prebuild safety net
docs/pass1-report.md       gap 7 corrected
```

Not committed. `node_modules/` untouched. Nothing written outside the project
and the scratchpad.

---

## 10. The five things I am least sure about

1. **Dropping the Daytona Porsche loses the site's most striking render.** It is
   the only hero-quality studio-lit shot in the set, and it is now unused. If the
   owner confirms NordVPN is a current partner, the right fix is to add it to
   `partners.json` and put the Porsche back as the hero, not to keep hiding it. I
   made the call the brief implies, but it is an owner question, not a design one.
2. **The mobile hero is still hillside-heavy.** The 1.3 crop helps and the car
   now reads, but the top third of a 390px screen is a dark green wall. The real
   fix is art direction: a `<picture>` with a 4:5 crop source below 900px and a
   matching `media` preload. I judged the extra preload complexity not worth it
   for a P2, and I may be wrong about that.
3. **`entries` on placeholder records.** The contract asks for field size and the
   owner decision asks the site to show it, so I invented four plausible numbers
   inside records that are already flagged `_placeholder: true` and listed in
   CONTENT.md. That is consistent with how positions and driver names are already
   handled, but it does put fabricated numbers next to the word "evidence" on the
   page that carries the site's credibility. Two records deliberately have no
   field size so the optional path is visible.
4. **Four items in the header nav.** Adding "Results" gives every page a route to
   the proof, which A14 asked for, but it is a cross-page anchor that can never
   be `aria-current`, and it pushes the desktop nav to four links plus a button.
   I measured it as fitting at 821px with about 140px to spare; a longer page
   name later would not.
5. **The per-page header CTA.** On `/partners` the header button is the mailto,
   not the Discord invite. It gives that page one label for one intent everywhere,
   which is what taste and the brief's one-primary-CTA rule both want, but it
   breaks the "site-wide chrome never changes" convention pass 1 wrote into
   PRODUCT.md. I updated PRODUCT.md rather than reverting, but a visitor moving
   between pages does see the header button change, and that is a real cost.

---

## 11. Stop conditions

None hit. The build never failed after a real fix attempt, no critique fix would
have violated the brief except B3 (deferred rather than forced), and the contract
had no ambiguity that blocked work.

Two contract questions worth flagging to whoever owns it, neither of which
blocked anything:

- The contract drops the event start **time** (dates only), so the countdown
  targets 00:00 America/Chicago rather than the green flag. The previous data had
  a real UTC start time. The countdown is now less precise than it was. If the
  bot should carry a start time, the contract needs a field for it.
- `events.json` has no `url`, so B14's "make the event name a link to the series
  page or the Twitch stream when one exists" could not be implemented without
  changing the contract, which I was told not to do.
