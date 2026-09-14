# Pass 2 critique B - Artemis Esports redesign

Read-only audit. Sources: `<scratchpad>\shots\r1b\` (70 files, all five routes, desktop
1440 + mobile 390), the Astro source in `D:\Artemis\Website\Website\src`, `PRODUCT.md`,
`DESIGN.md`, `pass1-report.md`, and the pre-redesign baseline at
`<scratchpad>\shots\baseline\desktop-home-full.png`.

Method: taste `design-taste-frontend.md` pre-flight and AI-tells, taste
`redesign-existing-projects.md` full audit (typography, colour/surfaces, layout,
interactivity/states, content, component patterns, iconography, code quality, strategic
omissions), taste `brandkit.md` (logo usage, colour system, type pairing), impeccable
"Absolute bans" and "AI slop test".

**Headline judgement.** Against the baseline this is not close: the old site was four
full-screen slogans and a logo, and this one puts results, a calendar, a roster, cars and
a real join path on the page. The register is right. What is missing is composition. The
brief asked for a pit wall, and a pit wall got built, but it got built once and then
pasted eleven times. Almost every band on the site is the same skeleton: a short
uppercase heading on the left, two lines of lead under it, a stack of hairline-ruled rows
on the right. Nothing on any page is a different shape, a different scale, or a different
weight of moment. The AI-slop test does not fail on the usual tells (no gradient text, no
glass cards, no eyebrow on every section, no em dashes, no invented metrics, no stock
imagery, real tabular data) but it fails on the second-order one: the uniform reflex.
Someone could look at this and say "one component, repeated" without doubt.

---

## 1. Verdict per page

### `/` (home)

**Premium:** the hero is genuinely good. A diagonal clip on the photo, a copy column on
solid brand black, the single proof point (`P2 / SUZUKA 1000 / GT3 class, 06 SEP 2026`)
set as a timing-tower fragment rather than a badge, and two actions. It reads as a team
with a result, in about two seconds, which is the brief's own success test. The results
sheet under it is the best module on the site: mono positions, teal for podiums, real
prose notes, a class chip, a right-hand date column, and it stacks on mobile without
losing its table semantics. The garage filmstrip is the right answer to "show the cars"
(native scroll-snap, varying slide widths, captions outside the frame, arrows that also
work on touch). Next race is a good thin strip.

**Template:** below the garage the page stops designing. "Who drives", "How we race",
"Who backs us" and "On the hunt" are four consecutive bands with the same two-column
skeleton, the same `display-md` heading in the same corner, and the same hairline rows.
Three of them in a row is already past taste's zigzag cap; four is a grammar. The h1 is
the word "ARTEMIS ESPORTS", set at 80px, two hundred pixels below the identical wordmark
in the nav, so the largest thing on the page is a logo repeat that says nothing. The hero
car wears a NordVPN decal that the Partners page does not list. On mobile the whole
results table is invisible until the scroll observer fires, leaving a 275px blank band.

### `/team`

**Premium:** the roster-as-entry-list was the right call given there are no headshots.
Outlined car numbers in `-webkit-text-stroke` teal, name, country, `NO. 41`, the class and
a one-line bio that is actually about racecraft ("Double stints without a complaint. Talks
to the pitwall like an engineer."). The road / oval / pitwall grouping with a per-group
count is honest and scannable. Crew rows correctly drop the number column and still align.

**Template:** the first screen is a heading, two lines and a meta line occupying the left
45%, with roughly 650 x 400 px of empty near-black to its right and below. That is not
restraint, it reads as an unfinished header, and it is identical on `/about` and
`/partners`. Each group's left column then repeats the same emptiness at a smaller scale.
The "Race with us." band at the bottom is the home page's join band with two strings
swapped and the identical 01/02/03 list. On mobile there is no visible CTA anywhere on the
first screen because the nav hides it below 821px.

### `/about`

**Premium:** "BUILT IN SILENCE." is the best headline on the site, and the origin copy
does real work in two paragraphs (2017 as a gaming crew, 2023 as the first iRacing season,
what carried over). The three-photo stepped collage is the only asymmetric composition on
the site that is not the standard two-column grid, and it is the right instinct.

**Template:** the photos undercut the page. None of the three shows sim racing. One is a
crowd outside a brick building, one is a dark shot of a player at a "TAP ESPORTS CENTER"
booth playing something that is visibly not iRacing, one is a street portrait. The page
under the heading "OUR PEOPLE, IN PERSON" is the site's only photography and it argues
against the positioning. "What we stand for" is the home page's pillar band with a
different heading and identical content. "How to join." is the third verbatim copy of the
01/02/03 block. Between them sits a whole band whose only content is four non-clickable
hashtags in 28px teal.

### `/partners`

**Premium:** the honesty is the design. "We do not publish follower counts on a marketing
page. Ask and we will send current numbers from each dashboard, with the screenshots" is
worth more to a sponsor than any invented reach figure, and the driver `stats` slots that
render only when filled are the same discipline in code. "What a partner gets" is concrete
(livery placement sized to read in a replay, result posts, roster exposure, the Discord).
The contact panel is the clearest conversion moment on the site.

**Template:** three of its six bands are home-page modules re-run with the same data in
the same layout (results sheet, roster teaser, partner card with the identical GLYTCH
blurb). The channels grid is `repeat(2, 1fr)` with seven items, so STORE sits alone and
the bottom-right cell is a visible hole with a hairline that stops halfway across. The
page head is the same 55%-empty header as `/team`, and its meta line wraps "CONTACT BELOW"
onto a second line for no reason.

### `404`

**Premium:** the best-composed page on the site, and the only one with real asymmetry. The
ghost mark bleeding off the left, the content offset into the right two thirds, `404` as a
small mono marker, "OFF TRACK." as the headline, and a genuinely useful copy line
("Nothing was lost, the pit lane is this way") plus links to all three pages. It is
branded, short, and it does not apologise.

**Template:** almost nothing. Two nits: "BACK TO THE PADDOCK" is jargon for a link that
goes to a page the nav calls "Home", and the ghost teal "JOIN THE TEAM" sits directly
under a solid teal "JOIN THE TEAM" in the nav, so the same label appears twice in one
viewport in two different button styles.

---

## 2. Findings, ranked

| ID | Sev | Page | Where | Issue | Evidence | Fix |
|---|---|---|---|---|---|---|
| B1 | P0 | all | `global.css:452-463`, `site.ts:25-36`, e.g. `index.astro:64` | Content visibility is gated on a JS class plus an IntersectionObserver. `html.js .reveal { opacity: 0 }` with `threshold: 0.15` and `rootMargin: 0 0 -8% 0` means a tall block must get 15% of its own height inside a shrunk root before any of it exists. No failsafe, no `document.hidden` path, and the `prefers-reduced-motion` block (`global.css:516-519`) only removes the transform, so reduced-motion users are still served `opacity: 0`. | `mobile-home-scroll-01.png`: the results table is a 275 CSS px blank band under "The last six finishes, across endurance, GT and oval."; it only appears in `scroll-02`. impeccable: "Reveal animations must enhance an already-visible default. Don't gate content visibility on a class-triggered transition; transitions pause on hidden tabs and headless renderers, so the reveal never fires and the section ships blank." | Never animate `opacity` from 0 on content. Set `.reveal { opacity: 1 }` and animate only `transform` / `clip-path` from `in-view`. If the fade stays, set `threshold: 0`, `rootMargin: '0px 0px 10% 0px'`, add a `setTimeout(…, 1200)` that force-adds `in-view` to everything still observed, and add `html.js .reveal { opacity: 1; transform: none }` inside the reduce block. |
| B2 | P1 | all | `PillarBand:39`, `PartnerBand:84`, `JoinCta:96`, `about:115`, `partners:192`, `partners:241`, `team:82`, `404:54`, plus `.section-head` (`global.css:271-282`) on results / garage / drivers | One layout family, eleven times. Every band below every hero is "narrow left text column, wider right block of hairline rows". Every section heading is `display-md`, uppercase, left, at the same y-offset. There is no scale ladder and no full-bleed moment anywhere except the join band's texture. | Home runs "How we race", "Who backs us", "On the hunt" back to back in the same skeleton. taste §4.7: "Once you use a layout family for a section, that family can appear at most ONCE on the page. A landing page with 8 sections must use at least 4 different layout families" and "Max 2 sections in a row with this image+text-split pattern." | Rebuild three bands on different skeletons: make the garage full-bleed edge to edge with the heading over it; make "How we race" a single centred statement with the four rules as a horizontal band of four short columns; give the join band the full width with the steps as a horizontal 3-up under the CTA. Vary heading scale: `display-lg` for the two bands that matter (results, join), `display-md` for the rest. |
| B3 | P1 | `/` | `Hero.astro:42-47` | The h1 is the brand name, set at 80px, directly under the identical wordmark in the nav lockup. The page's largest type carries zero information; the actual claim is demoted to `.lead`. | `desktop-home-hero.png`: the lockup reads ARTEMIS ESPORTS at (80,25); the h1 reads ARTEMIS ESPORTS at (80,250). taste §4.7 hero discipline: the headline is the value prop, not the logo. | Promote the claim. h1 = "We run the long races and bring the car home." or "iRacing endurance, GT and oval." Keep the ARTEMIS / ESPORTS two-weight treatment but at roughly half scale as a kicker above it, or drop it entirely since the lockup is already on screen. |
| B4 | P1 | `/`, `/team`, `/about` | `JoinCta.astro:41-55` rendered by `index:101`, `team:73`, `about:106`; `PillarBand` by `index:90` and `about:94` | The same 01/02/03 join block ships verbatim on three pages (identical titles and sentences from `site.json:join.steps`), and the same four-row pillar band ships verbatim on two. The component already has a `steps` prop documented as "Off on pages that already explain it" (`JoinCta.astro:10-14`) and it is never once passed. | `desktop-home-scroll-05.png`, `desktop-team-scroll-02.png`, `desktop-about-scroll-03.png` are the same block three times. `desktop-home-scroll-04.png` and `mobile-about-scroll-03.png` are the same four rows twice. | `steps` only on `/about`, where "How to join" is the section's job. `/` and `/team` get one sentence of what happens next plus the CTA. Drop the pillar band from `/` and let `/about` own the values, or keep it on `/` and replace the `/about` instance with something the home page cannot say. |
| B5 | P1 | all, mobile | `Nav.astro:228-231` | `.nav-links` is `display: none` below 821px, and the CTA lives inside it, so the site's single conversion action is hidden behind the hamburger on every mobile page. On `/team`, `/about` and `/partners` there is no visible CTA until the bottom band. | `mobile-team-full.png`, `mobile-partners-scroll-05.png`: header is lockup + hamburger only. PRODUCT.md names one primary action per page and the entire growth argument rests on it. | Keep a compact CTA in the mobile bar: `[Join] [☰]`. A `btn-sm` at 13px with just "Join" and the arrow fits inside 60px of nav height at 390px. |
| B6 | P1 | `/team`, `/about`, `/partners` | `PageHead.astro:33-45` | The inner-page header fills the left 45% of the first screen and leaves roughly 650 x 400 px of flat near-black. Three pages, the same void. `.page-head h1 { max-width: 14ch }` plus `padding-bottom: var(--space-xl)` guarantee it. | `desktop-team-hero.png`, `desktop-about-hero.png`, `desktop-partners-hero.png`. redesign audit: "Empty, flat sections with no visual depth. Sections that are just text on a plain background feel unfinished." | Put one real thing in the right half, different per page: `/team` the six car numbers as an entry-list strip; `/about` FOUNDED 2017 and FIRST IRACING SEASON 2023 as two large mono figures; `/partners` the "2 podiums from 6" snapshot as data rather than as a meta string. Failing that, cut the vertical padding so the header does not read as a gap. |
| B7 | P1 | `/`, `/partners` | `index.astro:18` (`daytona-porsche-911.jpg`); garage slide 3 "BMW M4 GT3" | Two unlisted third-party brands are the most visible imagery on the site. The hero car carries a NordVPN door decal; the Nordschleife garage slide is dominated by two large "AMG DRIVING PERFORMANCE" hoardings that occupy more pixels than the car. The Partners page says the list is short on purpose and names only GLYTCH. | `desktop-home-hero.png` (NordVPN at ~(660,515)); `desktop-home-scroll-02.png` (AMG boards across the top third of the widest slide). Flagged in `pass1-report.md` §6.5 and still unresolved. | Swap the hero to a render with no third-party decal. The Cadillac V-Series.R at Watkins Glen already in the garage reads well at hero scale. Re-crop the Nordschleife shot so the Karussell and the car are the subject, or replace the slide. |
| B8 | P1 | `/about` | `about.astro:9-11` (`crew-huddle.jpg`, `lan-stage.jpg`, `member-portrait.jpg`) | The site's only photography shows no sim racing. A crowd outside a brick building, a dark shot of a player at a "TAP ESPORTS CENTER" booth on a game that is visibly not iRacing, and a street portrait. Under the heading "Our people, in person" on a page arguing the team is a real iRacing outfit. | `desktop-about-scroll-01.png`. The brief forbids stock and AI imagery, which these obey, but the selection argues against the claim. | At least one frame must show a rig, a wheel, or a screen with a car on it. If no such photo exists, run two photos and one in-sim render, and caption the LAN shot so it reads as history ("2019, before the sim program") instead of as the present. |
| B9 | P1 | `/partners` | `partners.astro:206-210` | `.channel-list` is `repeat(2, minmax(0,1fr))` with seven items, so STORE sits alone in row 4 and the right-hand cell is empty. The `border-bottom` stops halfway across the grid and the `nth-child(even)` divider (`:228-231`) stops a row early. | `desktop-partners-scroll-03.png` top, `desktop-partners-full.png`. taste §4.7 BENTO CELL COUNT RULE: "If your grid has an empty cell in the middle or at the end, you planned wrong." | One column of seven rows (it already collapses to that on mobile and reads better), or three columns with a deliberate wide cell for Discord. Do not pad with an eighth fake channel. |
| B10 | P1 | `/`, `/about`, `/team`, `/partners` | `PillarBand.astro:39` + `:60`; `ResultsTable.astro:128`; `PageHead.astro:51` | Column widths fight their own content while adjacent columns sit empty. In the pillar band the `dt` column computes to about 318px at 1440, so three of four titles wrap to two lines, while the left copy column (about 458px) is empty below a two-line lead. `.event-sub { max-width: 46ch }` wraps "no / contact all race." inside a 511px cell. `.page-meta { max-width: 44ch }` at `0.16em` tracking wraps "SINCE 2023" and "CONTACT BELOW" onto a second line because `ch` does not account for letter-spacing. | `desktop-home-scroll-04.png` (PROGRESS OVER / PRIDE, PRECISION OVER / FLASH, CULTURE OVER / CLOUT), `desktop-about-hero.png`, `desktop-partners-hero.png`. | `.pillar` to `minmax(0, 1.15fr) minmax(0, 1fr)` so the longest title sets the column. Raise `.event-sub` to `56ch` or drop the cap and let the `col-event` width govern. Remove `max-width` from `.page-meta` or express it in `rem`, since tracked mono makes `ch` lie by roughly 20%. |
| B11 | P2 | `/`, `404` | `Nav.astro:28-36`, `Hero.astro:62`, `404.astro` actions | Two solid teal buttons with the same label in one viewport. The nav CTA and the hero CTA are both `btn-solid` "Join the team". On 404 the same label appears solid in the nav and ghost in the page. | `desktop-home-hero.png`, `desktop-404-hero.png`. Not a duplicate-intent failure (the label is correctly single), but a duplicate-emphasis one: two identical teal blocks compete. | Make the nav CTA `btn-ghost` while the nav is transparent over the hero, and swap it to `btn-solid` on `.is-stuck`. One line of CSS on an existing state class. |
| B12 | P2 | `/partners` | `partners.astro:~85` (ResultsTable), `:109-111` (roster teaser), `:139` (PartnerBand) | Half the page is home-page modules re-run with identical data and identical layout, including the same GLYTCH sentence. Defensible for a dossier, but it means the whole site has about five distinct compositions. | `desktop-partners-full.png` versus `desktop-home-full.png`. | Re-present rather than repeat: results as a season summary (6 starts, 2 podiums, classes run, series entered) in the data voice, roster as numbers + classes only. Keep the full sheet on home. |
| B13 | P2 | `/about` | `about.astro:98-104` and `:185-200` | A full band on `--bg-raise` with `padding-block: var(--space-xl)` whose entire content is four hashtags rendered as `<li>` plain text. Not links, no context, no call to action. | `desktop-about-full.png`, `mobile-about-scroll-03.png`. It is the only band on the site with no informational content. | Delete it. Put `#OnTheHunt` where it can be acted on (a link to the tag on X or Instagram in the footer, which already prints it once at `Footer.astro:62`). |
| B14 | P2 | `/` | `NextRace.astro:80-85`, and the section as a whole | A 10px solid teal square before "NEXT RACE" that conveys no state and never changes. taste §9.F: "ZERO decorative status dots by default." Separately the strip is a dead end: the one module that creates a reason to come back carries no link, no stream, no calendar. | `desktop-home-scroll-01.png`, `mobile-home-scroll-01.png`. | Drop the square. Make the event name a link when `events.json` carries a `url` (series page or Twitch), and render it as plain text when it does not. |
| B15 | P2 | `/`, `/partners` | `ResultsTable.astro:81` and `:160-164` | Result rows get a `--bg-raise` background on hover and a transition, but nothing in the row is interactive. The affordance promises a click that does not exist. | `desktop-home-scroll-01.png` (the CSS is only observable in source; the promise is the problem). redesign audit: interactivity must reflect real state. | Either remove the hover, or give the row a real destination (`result.url` to a replay or the X post) and make the whole row a link. |
| B16 | P2 | all | `Nav.astro:96-98` | `backdrop-filter: blur(14px)` behind a background that is already `color-mix(in srgb, var(--bg) 94%, transparent)`. At 94% opacity there is nothing left to blur, so this is a permanent compositing layer for an effect nobody can see. `DESIGN.md` §1 lists glass as deliberately absent. | Source. impeccable absolute bans: "Glassmorphism as default. Blurs and glass cards used decoratively. Rare and purposeful, or nothing." | Delete the two `backdrop-filter` declarations and set the background to solid `var(--bg)`. Nothing changes visually and the nav stops costing a layer on scroll. |
| B17 | P2 | `/`, `/partners` | `ResultsTable.astro:124-131` | The faintest ink step carries the most substantive copy. `.event-sub` (`--ink-faint`, 5.5:1) holds the track and the one-line story of each result, which is the reason the module exists, while the driver names beside it sit at `--ink-dim` (11.6:1). Hierarchy inverted. | `desktop-home-scroll-01.png`: "Suzuka International Racing Course. Two stops on strategy, no contact all race." is the dimmest text in the row. Passes AA, but AA is the floor, not the design. | `.event-sub` to `--ink-dim`. Move the class chip text and the date column down to `--ink-faint` so the ramp matches importance. |
| B18 | P2 | all | `global.css:203`, `ResultsTable.astro:114-122`, `DriverCard.astro:179-182`, `PageHead.astro:47-56` | Orphaned words wherever the heading is not an `h1`-`h4`. `text-wrap: balance` is set only on `h1, h2, h3, h4`, so `.event-name` (a `<span>`), `.driver-name` on crew rows and `.page-meta` all break badly. | `mobile-home-scroll-02.png`: "FRIDAY NIGHT LIGHTS, ROUND / 9". `desktop-team-full.png`: "PRIYA / RAGHUNATHAN". `desktop-about-hero.png`: "RACING ON IRACING / SINCE 2023". redesign audit: "Orphaned words. Fix with `text-wrap: balance`." | Add `text-wrap: balance` to `.event-name`, `.driver-name` and `.page-meta`. One declaration each. |
| B19 | P2 | `/`, `/partners` | `global.css:298-310`, `partners.astro:166-175` | Two equal-cell grids. `.roster-teaser` is `repeat(4, minmax(0,1fr))` with four identical number + name + class + country cells; `.offer-grid` is `repeat(2, 1fr)` with four identical heading + two-line cells. Hairlines instead of card borders soften it but the rhythm is the banned one. | `desktop-home-scroll-03.png`, `desktop-partners-hero.png` bottom. taste §9.C: "NO 3-column equal feature cards... Use 2-column zig-zag, asymmetric grid, scroll-pinned, or horizontal-scroll alternative." | Give the roster teaser a lead cell: one driver at double width with room for a portrait when one exists, three at single width. Weight "what a partner gets" so livery placement is visibly the headline item and the other three are secondary. |
| B20 | P2 | all | `Footer.astro:73-78` | `1.6fr 1fr 1fr` with every column's content hugging its own left edge, so the gap between the brand block and "PAGES" is about 350px and the right ~200px of the shell is empty. The footer reads as left-weighted with a hole. | `desktop-home-scroll-06.png`, `desktop-team-full.png` bottom. | `1fr 1fr 1fr` with the channels column right-aligned, or move the tagline and email into the base row so the three link columns can spread. |
| B21 | P2 | all | `Footer.astro:26-63`, `public/` (no `robots.txt`, no `sitemap.xml`), `astro.config.mjs` (no `@astrojs/sitemap`), `Base.astro:21-59` (no JSON-LD) | Strategic omissions. No privacy or terms line anywhere, no sitemap, no robots, no structured data. For a site whose job is to be found by sim racers searching for a team, a `SportsTeam` / `Organization` block with `sameAs` on the six real social URLs is free credibility. | redesign audit "Strategic Omissions: No legal links" and "Code quality: Missing meta tags". `site.json` already holds every URL the markup would need. | Add `@astrojs/sitemap` and a `robots.txt`; add a JSON-LD `SportsTeam` in `Base.astro` built from `site.json`; add one footer line, even just "We run no analytics and set no cookies." which happens to be true. |
| B22 | P2 | all | `Footer.astro:60`, `site.json:pillars`, `team.astro` page lead | Copy nits. "All rights reserved" is boilerplate no one reads. And the brand's "X over Y" construction now runs five deep: Work over words, Progress over pride, Precision over flash, Culture over clout, plus "Loyalty over attention" in the team lead. Four is a system; five is a tic. | `desktop-home-scroll-06.png`, `desktop-team-hero.png`. redesign audit: "AI copywriting cliches... Write plain, specific language." | "© 2026 Artemis Esports" and nothing else. Rewrite the team lead so the construction belongs to the pillars alone: "Everyone here earned the seat by showing up prepared, week after week." already says it without the formula. |
| B23 | P2 | `/` mobile | `Hero.astro:227-245` | The mobile LCP image shows an empty grandstand. At `object-position: 62% center` with the full-bleed crop, the top 280 CSS px of the first screen is stand seating and floodlights; the car is almost entirely under the scrim. The one image the visitor sees first says nothing about racing. | `<scratchpad>\crops\mobile-home-full-0.png` (top 1700px of `mobile-home-full.png`). | `object-position: 40% 68%` at `max-width: 900px`, or ship a `<picture>` with a portrait crop of the car's front quarter so it lands in the band above the headline. |
| B24 | P2 | `/`, `/team`, `/partners` | `DriverCard.astro:104-114` and `:169-177` | Car numbers are `color: transparent` plus `-webkit-text-stroke`, with no fallback. On the `compact` variant the number exists nowhere else in the DOM and the element is `aria-hidden`, so any environment without the non-standard property renders an invisible glyph in a 48px slot. | Source; the `row` variant is safe because `driver-meta` reprints "NO. 41" as text. | `@supports not (-webkit-text-stroke: 1px currentColor) { .driver-number { color: var(--teal-soft) } }`. Four lines. |
| B25 | P2 | all, mobile | `Nav.astro:39-48`, `site.ts:53-83` | The menu button's accessible name stays "Menu" when `aria-expanded="true"`, and the open full-screen panel has no focus trap: Escape closes it and returns focus, but Tab walks straight out into the page behind it. | Source. The rest of the menu work (aria-expanded, aria-controls, scroll lock, close-on-resize) is genuinely good, which makes these two the remaining gaps. | Swap the `sr-only` text to "Close menu" in `setOpen`, move focus to the first panel link on open, and trap Tab between the first link and the CTA. |

---

## 3. Do not change

1. **The results sheet.** `ResultsTable.astro` is the single best thing on the site and it
   is exactly what the brief asked for. Mono tabular positions, teal only for podiums, a
   class chip, real prose notes, a right-hand date column, explicit ARIA roles so the
   `display: block` mobile stack is still announced as a table, and a visually hidden
   caption. It is the module that turns the site from a claim into evidence. Keep it,
   including the mobile `data-label` prefixes.

2. **`--radius: 0` and the hairline vocabulary.** `global.css:102`. A single committed
   shape system across buttons, chips, frames, panels, the mobile menu and the garage
   slides, with `--line` / `--line-strong` / `--line-teal` doing all the grouping work
   instead of cards. One rounded corner anywhere would break it. Do not soften anything.

3. **The two-weight hero treatment.** `Hero.astro:129-143`. ARTEMIS in Nexa Bold over
   ESPORTS in Nexa Light, tracked `+0.06em` and set in teal at the same size, turns a
   licensing constraint (only 300 and 700 exist on disk) into the idea rather than fighting
   it. Keep the treatment even when the h1 copy changes per B3.

4. **The garage as a native scroll-snap filmstrip.** `Garage.astro` plus
   `site.ts:121-161`. No pinning, no scroll hijack, `scroll-snap-type: x mandatory` on
   every device, `scroll-padding-inline` that lines the first slide up with the container
   gutter rather than the viewport, a `tabindex="0"` `role="region"` track, arrows that
   stay visible on touch, and a progress line driven by the track's own passive scroll
   coalesced into one rAF. This is the correct answer to the brief's hardest constraint.

5. **The refusal to invent numbers.** `partners.astro:119-122` ("Ask and we will send
   current numbers from each dashboard, with the screenshots"), the `stats` slots in
   `DriverCard.astro:25-28` that render only when filled, `_placeholder` flags on every
   unconfirmed record, and GLYTCH as the only partner. Every AI-built esports page invents
   a follower count. This one says where to ask. That restraint is the most premium thing
   on the site and it should survive every future pass.

Honourable mentions that are also working and should not be undone: JetBrains Mono
confined strictly to numbers and column labels, zero em dashes across every visible
string, the 2.9 KB client bundle with no scroll listener, `aria-current` reinforced with
an underline rather than colour alone, and the 404 composition.
