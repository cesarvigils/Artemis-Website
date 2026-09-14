# Pass 2 critique A - Artemis Esports (impeccable `critique`, brand register)

Target: `D:\Artemis\Website\Website` (Astro source + `dist/`), all five routes, desktop 1440x900
and mobile 390 (780@2x).
Evidence: `<scratchpad>\shots\r1b\` (69 files, generated 2026-09-14T06:12Z, zero console errors
and zero failed requests on `/`, `/team`, `/about`, `/partners`; the four 404 console errors are
the server correctly returning 404 for `/this-page-does-not-exist`), plus the Astro source.
Context read: `design-brief.md` §1-§6, `retention-research.md` §1/§3, `pass1-report.md`,
`PRODUCT.md`, `DESIGN.md`. Detector (`detect.mjs`) is not installed in this project, so
Assessment B is the browser/screenshot evidence plus targeted pixel sampling (`sharp`), not the
bundled CLI scan. No dev server was started; no project file was modified.

---

## 0. Verdict before the numbers

**Does this look AI-generated? No - and that is the good news.** Every absolute ban is respected:
no tiny tracked eyebrow above sections, no `01 / 02 / 03` scaffolding (the one numbered sequence
is a genuine three-step), no gradient text, no glass, no identical card grid, no hero-metric row,
no side-stripe borders, no rounded-icon-above-heading. The colour discipline is real and measured
(I re-derived `--ink-faint` at **5.52:1** on `--bg` and **5.27:1** on `--bg-raise` from the token
values - the claims in `DESIGN.md` §2 are accurate, which is rare). The type system - two Nexa
weights carrying hierarchy through size/tracking/case, mono confined to actual numbers - is the
strongest thing on the site.

**What it does look like is under-art-directed in its bottom two thirds.** One layout idea -
*heading in a narrow left column, content in a wide right column* - runs **14 times across five
pages**, and on a 1440 screen it leaves 400-600px voids in the left column of most of them. The
first screen of the home page is excellent; sections 6, 7 and 8 are the same module three times
in a row. That is the site's real slop risk, not the token layer.

**The bigger problem is not visual at all.** Three of the five pages are built for audience #1
(sim racers) and are decent at it. The page built for audience #2 (sponsors doing a 60-second
check) fails its own brief: on mobile the sponsor must scroll **10,600 of 11,918 px** to reach the
contact, and the only loud button above the fold sends them to a recruiting Discord. And the
proof the whole site rests on - results - is published without field size, split or series, so
"P2" is an assertion, not evidence.

**No P0.** Nothing blocks a task: every CTA resolves, no page errors, no broken links, no
horizontal overflow at 390, nothing invisible without JS. The list below is five P1s and the rest
P2/P3.

**Cognitive load: low (1 failed item of 8).** Chunking, grouping, hierarchy, single-focus and
minimal-choices all pass; the failure is *working memory* on `/partners`, where the sponsor must
hold "what do I do about this?" across six sections before the answer appears.

**Persona red flags**

- **Jordan (first-timer / prospective driver):** lands on `/team`, sees eight names, two lines of
  bio each, no photo, no iRating, no licence class, no link to anything either driver has done.
  Nothing tells them whether they are fast enough to apply. The `stats` slot exists and is
  suppressed because it is empty (`DriverCard.astro:25-28`).
- **Riley (sponsor, stress-testing the claim):** sees "GLYTCH is the only partner" on `/partners`
  and a **NordVPN decal on the hero car** on `/`. Two pages, one contradiction, 30 seconds in.
- **Casey (mobile, one-handed, interrupted):** `/partners` is 11,918 px tall on a 390 screen and
  the email lives at 89% depth; the top nav's only button is the wrong one for them.

---

## 1. Scoring summary per page

Nielsen's 10 heuristics, 0-4 each, 40 possible. Bands: 36-40 excellent / 28-35 good /
20-27 acceptable / 12-19 poor.

### `/` home - **27 / 40 (Acceptable)**

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Garage progress bar renders as a 1px artifact at rest (`scaleX(0.001)`, `site.ts:136`); no "1 of 6" index; home has no nav item so there is no current-page cue |
| 2 | Match system / real world | 3 | Racing language is fluent and correct; GTP / LMP2 / "NASCAR Class B" go unexplained, which is right for the audience but leaves nothing for a lapsed visitor |
| 3 | User control and freedom | 3 | Native scroll, no pinning, anchor CTA works; no "back to top" on a 5,163px page |
| 4 | Consistency and standards | 3 | Tokens are applied rigorously; "Recent results" appears with a different row count and a different meaning on `/partners` |
| 5 | Error prevention | 3 | Little to get wrong; new-tab links are signalled only by a 15px glyph |
| 6 | Recognition rather than recall | 2 | Results give position with no field size or series; four driver teasers all link to the same page top |
| 7 | Flexibility and efficiency | 2 | One path only; results are reachable from nowhere except this page |
| 8 | Aesthetic and minimalist design | 3 | Hero is genuinely good; the last three sections are one skeleton repeated with large empty left columns |
| 9 | Error recovery | 3 | n/a on this page; the 404 it routes to is solid |
| 10 | Help and documentation | 3 | The three-step Join explainer is the best piece of UX copy on the site |

### `/team` - **29 / 40 (Good)**

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | `aria-current`, sticky group head and per-group entry counts orient well |
| 2 | Match system / real world | 3 | "Road / Oval / Pitwall" is the right vocabulary; "Pitwall" needs the blurb to land |
| 3 | User control and freedom | 3 | Nothing to get trapped in |
| 4 | Consistency and standards | 3 | Same row grammar throughout; crew rows lose the number column cleanly |
| 5 | Error prevention | 3 | n/a |
| 6 | Recognition rather than recall | 2 | No photos, no iRating, no licence, no results per driver - eight rows of prose |
| 7 | Flexibility and efficiency | 3 | Correct to have no filters at eight people |
| 8 | Aesthetic and minimalist design | 3 | Typographically clean; the sticky left column leaves 400-600px voids beside the two-entry groups |
| 9 | Error recovery | 3 | n/a |
| 10 | Help and documentation | 3 | "Race with us" repeats the three steps where they are needed |

### `/about` - **27 / 40 (Acceptable)**

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Fine |
| 2 | Match system / real world | 2 | "Built in silence", "builds in silence, improves with intention, competes with precision" is the one place the brief's "beautiful page of slogans" failure mode shows |
| 3 | User control and freedom | 3 | Fine |
| 4 | Consistency and standards | 2 | The four pillars are rendered verbatim here and on home; two pages, identical content, different headings |
| 5 | Error prevention | 3 | n/a |
| 6 | Recognition rather than recall | 2 | The three photos are uncaptioned and show non-sim-racing activity under the heading "Our people, in person" |
| 7 | Flexibility and efficiency | 3 | Fine |
| 8 | Aesthetic and minimalist design | 3 | The stepped collage is the one composition on the site that is not the two-column skeleton |
| 9 | Error recovery | 3 | n/a |
| 10 | Help and documentation | 3 | "How to join" lands the CTA in the right place |

### `/partners` - **25 / 40 (Acceptable, lowest on the site)**

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The meta line ("6 results listed / 2 podiums / contact below") is a genuine status cue |
| 2 | Match system / real world | 3 | Sponsor language is plain and honest |
| 3 | User control and freedom | 3 | Fine |
| 4 | Consistency and standards | 2 | The site-wide nav CTA ("Join the team", Discord) directly competes with this page's only purpose |
| 5 | Error prevention | 3 | The prefilled mailto subject is a nice touch |
| 6 | Recognition rather than recall | 2 | No media kit, no numbers, no summary of the offer at the top - the sponsor must carry it all to the bottom |
| 7 | Flexibility and efficiency | 1 | Contact at 93% depth on desktop, 89% on mobile (11,918px page), with no anchor, no header action and no repeated email |
| 8 | Aesthetic and minimalist design | 3 | Clean, but three consecutive two-column sections again |
| 9 | Error recovery | 3 | n/a |
| 10 | Help and documentation | 2 | "Ask and we will send current numbers" is honest but gives a sponsor nothing to act on inside the 60 seconds |

### `404` - **29 / 40 (Good)**

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | "404" + "Off track." states the situation immediately |
| 2 | Match system / real world | 3 | "Back to the paddock" is jargon, but the lead sentence covers it |
| 3 | User control and freedom | 4 | Two actions plus all three page links - a genuinely complete escape |
| 4 | Consistency and standards | 3 | Same system, same voice |
| 5 | Error prevention | 3 | n/a |
| 6 | Recognition rather than recall | 3 | Fine |
| 7 | Flexibility and efficiency | 3 | Fine |
| 8 | Aesthetic and minimalist design | 2 | The ghost mark is `--bg-panel` on `--bg` (~1.6:1) and occupies 40% of the composition as a smudge |
| 9 | Error recovery | 3 | Good, though it does not offer the one thing people most often lose (results) |
| 10 | Help and documentation | 2 | No contact route except the footer |

**Site total: 137 / 200 (avg 27.4 / 40).** Strongest page `/team` and `404`; weakest `/partners`.

---

## 2. Ranked findings

| ID | Sev | Page | Where | Issue | Evidence | Fix |
|---|---|---|---|---|---|---|
| A1 | P1 | partners | `src/pages/partners.astro:58-62`, `:144-162`; `src/components/Nav.astro:28-36` | The sponsor page's only above-the-fold button is "Join the team" (Discord); its actual CTA (mailto) is the last element before the footer. | `desktop-partners-full.png` - contact at y≈3,600/3,854; `mobile-partners-full.png` - contact at y≈10,600/11,918 (89% depth) on a 390 screen. Research #6/#9 and PRODUCT.md both say Partners' primary action is "Partner with us". | Give `PageHead` an optional `action` slot and render `<a class="btn btn-solid" href="mailto:contact@artemisesports.com?subject=Partnership%20enquiry">Email us about a partnership</a>` plus a quiet `#contact` anchor in the first screen; on `/partners` swap the nav CTA by passing a per-page CTA (add `ctaByPath` to `nav.json`, select it in `Nav.astro` from `Astro.url.pathname`). |
| A2 | P1 | home | `src/pages/index.astro:18` (`heroSource`), `src/data/partners.json` | The LCP hero shows a **NordVPN** decal on the car door while `/partners` states GLYTCH is the only partner - a visible sponsor claim the site contradicts one click later. | `desktop-home-hero.png`, decal legible at ~(640,515) at 1440. The brief §5 says "Do not add NordVPN or anyone else"; flagged in `pass1-report.md` §6.5 and still shipping. | Swap `heroSource` to a render with no third-party decals (`watkins-glen-gtp.jpg` or `nordschleife-bmw-m4.jpg` both work at 16:9), or keep the shot and set `.hero-media img { object-position: 74% center }` so the door leaves the frame. If the deal is real, add it to `partners.json`. |
| A3 | P1 | all | `PillarBand.astro:37-42`, `PartnerBand.astro:82-87`, `JoinCta.astro:94-99`, `about.astro:113-118`, `partners.astro:190-195`, `:239-244`, `team.astro:80-86`, `404.astro:52-57` | One composition - narrow heading column left, content column right - is used **14 times across five pages**, three of them consecutively at the bottom of home, each leaving a 400-600px empty left column at 1440. | `desktop-home-scroll-04.png` and `-05.png`: "How we race", "Who backs us" and "On the hunt" are the same skeleton back to back; `desktop-team-full.png`: "OVAL" and "PITWALL" leave ~500px voids. DESIGN.md §1 claims asymmetry, but it is one ratio repeated. | Re-cut at least three of them. `PillarBand`: full-bleed band, heading on its own line, the four rules as a four-column hairline row ≥1024 (they are four short pairs - they fit). `JoinCta`: full-width heading with the three steps as an inline 3-column row under it. `PartnerBand` on home: single wide row, logo left, copy right, no heading column. |
| A4 | P1 | home, partners | `src/components/ResultsTable.astro:23-62`; `src/data/results.json` | Results publish a bare position with no field size, no split and no series - `series` exists in the data and is never rendered - so the site's core proof asset ("P2") cannot be judged. | `desktop-home-scroll-01.png`; `results.json:6` etc. carry `"series"` but `ResultsTable` renders only pos/event/class/drivers/date. Research #8 makes results the credibility substitute for follower counts. | Add `entries` (and optionally `split`/`sof`) to each record in `results.json`; render the Pos cell as `P2` with a `/ 41` sub-line in `--ink-faint`, and print `series` in the event sub-line before the track (`SUZUKA 1000 · iRacing special event · Suzuka International Racing Course`). Update the `## Fill in` table in `CONTENT.md`. |
| A5 | P1 | team | `src/pages/team.astro:58-67`; `src/components/DriverCard.astro:25-28`, `:63-87` | The recruiting page - the site's only job per PRODUCT.md priority 1 - carries no photo, no iRating, no licence, no per-driver result: eight rows of name, country and a one-line bio. | `desktop-team-full.png`, `mobile-team-full.png`. `drivers.json` ships `"stats": { "irating": "", "licence": "" }` for all eight, and the filter at `DriverCard.astro:25-28` drops empty values, so the feature never appears. | Two moves, both implementable now: (a) derive each driver's most recent finish from `results.json` by surname match and render it as a `.data` line in `.driver-detail` ("Last drive: P2, Suzuka 1000, 06 Sep 2026"); (b) fill `stats` in `drivers.json` for at least licence class, which is public information for every iRacing account. Keep the empty-slot suppression for anything genuinely unknown. |
| A6 | P2 | home | `src/components/Hero.astro:227-245` (mobile block, `object-position: 62% center`) | At 390 the LCP image is mostly empty grandstand; the car - the only thing the photo is for - sits under the darkest part of the scrim. | Crop of `mobile-home-full.png` rows 0-1700: the top 55% is stand, the Porsche is a silhouette behind the gradient. | Set `object-position: 62% 72%` in the ≤900px block, or art-direct it: add a `<picture>` with a 4:5 crop source for `(max-width: 900px)` generated by the same `getImage()` call, and preload that one instead. |
| A7 | P2 | all | `src/components/Nav.astro:95-100` | The scrolled header is 94% opaque, so large display type and teal links ghost through it behind the lockup wherever `backdrop-filter` is unavailable or disabled. | Measured: behind the bar in `mobile-about-scroll-03.png` the "STAND FOR" heading reads `rgb(14,24,23)` against a bar background of `rgb(0,10,8)`; in `desktop-home-scroll-05.png` the teal "WHAT A PARTNER GETS" link reads `rgb(1,24,20)` directly under the ARTEMIS mark. | `.site-nav.is-stuck { background: var(--bg); }` - keep `backdrop-filter` only for the transparent-over-hero state where it is doing real work. |
| A8 | P2 | home, partners | `src/pages/index.astro:64`, `src/pages/partners.astro:94`; `src/scripts/site.ts:25-36` | The entire results table sits inside one `.reveal`, so the site's most important block is a screen-height of black until the observer fires (`threshold: 0.15`, `rootMargin: -8%`). | `mobile-home-scroll-01.png`: heading and lead render, the whole table area below is empty; the next step (`-02`) shows it populated. The impeccable rule is explicit - reveals must enhance already-visible content. | Remove the wrapper `.reveal` on both tables (the heading reveal is enough), or move the reveal onto `tbody tr` with `threshold: 0` and a 40ms stagger so rows never gate a full screen of content. |
| A9 | P2 | home | `src/pages/index.astro:31-35`; `src/data/events.json` | `events.json` holds three entered events; only the first ever renders, so the "reason to come back" is a single date. | `desktop-home-scroll-01.png` shows one strip; `events.json:12-31` contains Richmond (2 Oct) and Talladega (8 Oct), unrendered. Research #7 makes calendar freshness the return-visit driver. | Pass the full sorted list to `NextRace`; render entry 1 as now and entries 2-3 as two hairline rows underneath ("Also entered: 02 OCT · Richmond · NASCAR Class B"). Render `status` as the row label so "entered" vs "provisional" is visible. |
| A10 | P2 | home | `src/data/cars.json:16-22`; `src/assets/racing/nordschleife-bmw-m4.jpg` | Garage slide 3 is dominated by a Mercedes-AMG trackside banner; the Artemis BMW is a small distant shape. One of six frames sells another brand. | Crop of `desktop-home-scroll-02.png` rows 600-900: the AMG board occupies ~25% of the frame, the car ~6%. (The caption itself is correct - it is a BMW M4 GT3 at the source resolution.) | Re-crop: give `GarageSlide` an optional `focus` prop writing `object-position` per slide and set this one to `~62% 68%` so the car fills the frame, or replace the render with one shot closer to the car. |
| A11 | P2 | about | `src/pages/about.astro:43-91` | Under "Our people, in person" the three photos show an esports crew outside a venue and a player with a controller at a LAN - no sim racing, no captions, no dates - on the page that has just claimed an iRacing program. | `desktop-about-full.png`, `mobile-about-scroll-02.png`. The copy at `:29-32` explains the 2017 non-racing origin, but the imagery is 800px away from that explanation. | Add a `<figcaption class="data">` to each shot with what and when ("Artemis crew at the 2024 LAN, before the sim program"), or move the collage up into the "Where this came from" section so the non-racing pictures read as history rather than as the current team. |
| A12 | P2 | home, about | `src/pages/index.astro:90-93`; `src/pages/about.astro:93-96`; `src/data/site.json:21-26` | The same four pillars render verbatim on two pages with only the heading changed ("How we race" / "What we stand for"), so `/about` adds nothing for anyone who has read `/`. | `desktop-home-full.png` and `desktop-about-full.png` show identical dt/dd pairs. | Keep the compact band on home; on `/about` expand each value into one concrete sentence about how it shows up in a race weekend (add a `detail` field per pillar in `site.json`, rendered only by the about instance via a `variant="long"` prop). |
| A13 | P2 | home, partners | `src/components/DriverCard.astro:34` (`href ?? '/team'`) | All four driver teasers link to the top of `/team`; clicking "Ines Marchetti" does not take you to Ines Marchetti. | `desktop-home-scroll-03.png`; every compact card resolves to the same URL. | Emit `id={slug(driver.name)}` on the `row` variant in `team.astro`, and pass `href={'/team#' + slug(driver.name)}` from the teasers. `scroll-padding-top` is already set, so the landing offset is correct. |
| A14 | P2 | all | `src/data/nav.json:2-6` | Results - the site's designated proof - are reachable from nowhere but the home page; the nav has no route to them and neither does the footer "Pages" list. | `nav.json` primary = Team / About / Partners; `partners.astro:89` links to `/#results`, but `/team` and `/about` offer no path at all. | Add `{ "href": "/#results", "label": "Results" }` as the first `primary` entry (four items is still inside the ≤5 rule) or, if the nav must stay at three, add it to `nav.footer`. |
| A15 | P2 | all (mobile) | `src/components/Nav.astro:51-71`; `src/scripts/site.ts:53-83` | With the mobile menu open the page behind it stays in the tab order and the accessibility tree - tabbing past the CTA walks into content the user cannot see. Focus is also never moved into the panel on open. | `Nav.astro` toggles `hidden` and a class only; no `inert`, no `aria-hidden`, no focus move. Escape-to-close and focus return are correctly implemented. | In `setOpen`, set `document.getElementById('main').inert = open` and the footer likewise (with `aria-hidden` as the fallback), and focus the first link in `#mobile-menu` when opening. |
| A16 | P2 | home | `src/scripts/site.ts:132-140`; `src/components/Garage.astro:146-158` | The garage progress bar is scaled to `0.001` at rest, so at the top of the strip it reads as a 1px artifact rather than "you are at the start of six". | `desktop-home-scroll-03.png`, `mobile-home-scroll-04.png`: a hairline with a barely visible teal tick. | Size the thumb to the visible fraction and translate it instead of scaling from zero: width `clientWidth / scrollWidth`, `translateX(ratio * (100% - thumbWidth))`. Same three lines, and the control finally says how much is left. |
| A17 | P2 | team | `src/pages/team.astro:80-90` | The sticky group column holds three short lines next to lists of two entries, leaving 400-600px of empty column at 1440 in two of three groups. | `desktop-team-full.png`: the "OVAL" and "PITWALL" bands are more empty than filled. | Below 1200px (and for groups with <3 members) drop `roster-inner` to one column and run the group head as a full-width hairline bar with the count on the right; keep the sticky rail only where the list is long enough to scroll past it. |
| A18 | P2 | 404 | `src/pages/404.astro:52-63` | The ghost mark is `--bg-panel` on `--bg` (~1.6:1) and takes 40% of the composition while reading as a smudge rather than as a mark. | `desktop-404-hero.png`: the left column is a dark shape with no edge; `mobile-404-full.png` shrinks it to 6rem where it disappears entirely. | Either commit (raise it to `--line-teal` strength at `min(18rem, 40vw)` so it is clearly the Artemis mark) or cut the column and set the copy against the same spray texture the Join band uses. Half-visible is the one option that reads as an accident. |
| A19 | P2 | partners | `src/pages/partners.astro:61` | The first screen quantifies the evidence as "6 RESULTS LISTED / 2 PODIUMS", which frames a thin record in the sponsor's opening seconds. | `desktop-partners-hero.png`, `mobile-partners-full.png` rows 0-900. | Lead with span and calibre instead of a count the reader can judge: "2026 season / Daytona, Sebring, Watkins Glen, Suzuka / endurance, GT and oval". Keep the number honest, just stop making it the headline statistic. |
| A20 | P3 | partners | `src/pages/partners.astro:59` and `:156-159` | "Partner with us" is both the `h1` and the final button label, so a screen-reader user hears the page title announced again as the action. | Source; `desktop-partners-full.png`. | Title: "Partner with Artemis". Button: "Email us about a partnership" (also fixes the vague target of the mailto). |
| A21 | P3 | about | `src/components/PageHead.astro:47-56`; `src/pages/about.astro:21` | The meta line wraps to two lines with "SINCE 2023" orphaned, because 12px mono at 0.16em tracking overruns the 44ch measure. | `desktop-about-hero.png` - "FOUNDED 2017 / RACING ON IRACING SINCE 2023" breaks after "IRACING". | Shorten the string to "Founded 2017 / iRacing since 2023", or raise `.page-meta { max-width: 60ch }` - the tracking makes ch a bad proxy here. |
| A22 | P3 | all | `src/components/Footer.astro:44-53`; `src/components/Nav.astro:28-36`; `src/pages/partners.astro:124-135` | Every external link opens a new tab, signalled only by a 13-15px arrow glyph that is `aria-hidden`. Nothing announces it. | `Icon.astro:34` sets `aria-hidden="true"`; all three link sets use `target="_blank"`. | Append `<span class="sr-only"> (opens in a new tab)</span>` inside the external anchors. The class already exists. |
| A23 | P3 | home, partners | `src/pages/index.astro:37`, `:79-82` | The teaser shows four of six drivers and the link says only "Full roster", so the visitor cannot tell whether they have seen the team. | `desktop-home-scroll-03.png`. | Label it "Full roster (8)" - `drivers.length` is already in scope on both pages. |
| A24 | P3 | home, partners | `src/components/ResultsTable.astro:160-164` | Result rows take a hover background but are not interactive - a false affordance on the one table people will try to click. | `.results tbody tr:hover td { background: var(--bg-raise) }`; no row is a link. | Remove the rule, or earn it: add an optional `url` per result (replay, league standings, a post) and wrap the event cell in a link, keeping the hover only on rows that have one. |
| A25 | P3 | all | `src/styles/global.css:140-144` | `scroll-behavior: smooth` is global, so "See results" on a 5,163px home page animates a long distance and an anchor from `/partners` to `/#results` lands mid-flight. | `global.css:141`; reduced-motion is correctly handled at `:512-519`. | Scope it: `html { scroll-behavior: auto }` with `:is(html):has(:target) { scroll-behavior: smooth }` is fragile - simpler is to keep smooth only on the home page's own in-page anchor by handling the click in `site.ts` with `scrollIntoView({ behavior })` chosen from the reduced-motion query. |

---

## 3. Do not change

1. **The contrast discipline in `src/styles/global.css:51-64`.** I re-derived the ink steps
   independently: `--ink-faint` is 5.52:1 on `--bg` and 5.27:1 on `--bg-raise`; `--teal-soft` is
   7.56:1 on `--bg-raise`. Every text token clears AA on *both* surfaces. Do not push these
   alphas back down for "elegance" - this is the single most commonly broken thing in dark
   designs and it is correct here.
2. **The garage as a native scroll-snap filmstrip** (`Garage.astro:41-48`, `:127-140`):
   `overflow-x: auto`, `scroll-snap-type: x mandatory`, `tabindex="0"` + `role="region"` + a
   label, arrows on every device, and `scroll-padding-inline` aligned to the container gutter so
   the first slide lines up with the heading. It works with a trackpad, a thumb and the keyboard,
   and it replaced a scroll-jacked pan. Keep it exactly as it is - fix A16 inside it, nothing else.
3. **Progressive enhancement via `html.js`** (`Base.astro:57-59`, `global.css:452-463`,
   `:469-483`). Reveals, the hero entrance and the parallax are all gated so the no-JS render is
   the finished state; the countdown line is pre-reserved so filling it shifts nothing. When you
   fix A8, fix it *inside* this gate - do not remove the gate.
4. **The two-weight type idea** (`Hero.astro:42-47`, `:139-143`; `DESIGN.md` §3): Nexa Bold
   "ARTEMIS" over Nexa Light "ESPORTS" tracked +0.06em in teal, at the same size, with JetBrains
   Mono confined strictly to numbers and column labels. A licensing constraint turned into the
   hero's whole idea. Nothing on the site is better than this.
5. **The results table's semantics** (`ResultsTable.astro:23-34`, `:166-221`): a real `<table>`
   with explicit `role` attributes so the mobile `display: block` stack is still announced as a
   table, a visually hidden `<caption>`, and `data-label` prefixes generated in CSS. This is the
   correct, unglamorous solution to a problem most sites get wrong, and A4's extra columns must
   be added without disturbing it.
