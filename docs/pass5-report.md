# Pass 5 report - Artemis Esports

Final polish, verification and handover. Target: `D:\Artemis\Website\Website`
(Astro 7, static, branch `redesign`). **Not committed.** No new runtime
dependency. No data file and no data contract touched.

Inputs read in order: `design-brief.md` sections 1-6 (6b superseded),
`data-contract.md`, `pass4-report.md`, `pass2-report.md`, `pass3-report.md`,
`PRODUCT.md`, `DESIGN.md`, `CONTENT.md`, `DEPLOY.md`, `README.md`, then the
whole of `src/`, `public/`, `scripts/` and `vercel.json`. Skills:
`anthropic-skills:impeccable` (`reference/polish.md`, `reference/clarify.md`,
`SKILL.md` absolute bans + the AI slop test), `anthropic-skills:taste`
(`reference/design-taste-frontend.md` including its section 14 pre-flight, and
`reference/full-output-enforcement.md`), `anthropic-skills:emil` (`SKILL.md`
core principles).

---

## 0. Headline

**Fonts 78,596 B to 48,036 B (-38.9%) with ten full-page renders coming back
pixel-identical. 22 polish changes. Lighthouse 100/100/100/100 on all five runs,
up from 99 on `/` in pass 4. Zero WCAG A/AA violations. Zero CSP violations. The
pass-2 interaction harness 14/14 and the pass-3 adapt matrix back to 15/70, both
after correcting one stale assertion each. Every pre-flight box ticks, with four
recorded as judged rather than mechanical.**

---

## 1. G11: font subsetting

The subsetter is `subset-font` 2.7.0 (the wasm build of harfbuzz's `hb-subset`)
in `<scratchpad>\font-tool\`, driven by `subset.mjs`. `analyse.mjs`,
`verify.mjs` and `diff.mjs` in the same folder measure the target set, the
coverage of the result and exactly which codepoints each face lost. No Python
involved.

### Bytes

| Face | Before | After | Saved |
|---|---|---|---|
| `nexa-bold.woff2` -> `nexa-bold.latin.v2.woff2` | 17,724 | **15,416** | -2,308 (-13.0%) |
| `nexa-light.woff2` -> `nexa-light.latin.v2.woff2` | 17,796 | **15,416** | -2,380 (-13.4%) |
| `jetbrains-mono-400.woff2` -> `jetbrains-mono-400.latin.v2.woff2` | 21,168 | **8,564** | -12,604 (-59.5%) |
| `jetbrains-mono-700.woff2` -> `jetbrains-mono-700.latin.v2.woff2` | 21,908 | **8,640** | -13,268 (-60.6%) |
| **Total** | **78,596** | **48,036** | **-30,560 (-38.9%)** |

Per first view that is about 17.3 KB on `/about` and `/partners` (three faces
preloaded) and about 30.6 KB on `/`, `/team` and the 404 (four).

### What is in the subset, and why that list

The character target was measured, not guessed. `analyse.mjs` walked every
built HTML, XML and text file: **the only codepoint the site renders beyond
ASCII printable is U+00A0**, the no-break space in the results sheet's driver
separator. Arrows are inline SVG paths in `Icon.astro`, so **no arrow glyphs are
carried**.

Kept: Basic Latin `U+0020-007E`, the whole Latin-1 Supplement `U+00A0-00FF`, the
General Punctuation a bot-written string can emit (en and em dash, both quote
pairs, low quotes, daggers, bullet, ellipsis, per mille, primes, guillemets,
fraction slash, euro, trade mark, minus, division slash, up and down arrows),
the seven combining marks, and the Latin Extended-A letters the originals
carried: `Ă ı Ł ł Œ œ Š š Ÿ Ž ž`.

**That last group is the one decision worth stating.** A pure "Basic Latin +
Latin-1 + the punctuation used" subset is 44,164 B, 3.9 KB smaller. It also
drops `Ł`, `Š`, `Ž`, `Œ` and `ı`. The bot writes driver names straight from
Discord and a sim-racing roster is exactly where those letters appear, so the
cheaper subset buys 3.9 KB at the price of one fallback letter in the middle of
a display-size name. I took the larger subset.

Measured drops, per face (`diff.mjs`):

- Nexa Bold: 13 codepoints. `U+0000`, `ƒ`, the eight spacing modifier letters
  `ˆ ˇ ˘ ˙ ˚ ˛ ˜ ˝`, Greek `µ` (the Latin-1 micro sign `U+00B5` is kept), and the
  `fi`/`fl` presentation forms.
- Nexa Light: the same 12 minus `U+0000`.
- JetBrains Mono 400 and 700: 6 each. `U+000D`, `U+FEFF`, `ʼ`, `ˆ`, `˚`, `˜`.

Nothing that can appear in rendered text was removed.

### Layout tables

`fontkit` reports what the originals actually carry, which is not what the brief
assumed:

| Face | Before | After |
|---|---|---|
| Nexa (both) | `kern` | **`kern`** |
| JetBrains Mono (both) | `calt`, `ccmp`, `frac`, `mark` | **`ccmp`, `mark`** |

- **`tnum` is not in JetBrains Mono and never was**, and does not need to be:
  the face is monospaced, so all ten digit glyphs have an advance width of 600
  units, measured before and after. `font-variant-numeric: tabular-nums` in the
  CSS is a no-op that costs nothing and documents intent.
- **`kern` and `liga` are not in JetBrains Mono either.** Monospace does not
  kern, and its ligatures come through `calt`.
- `calt` and `frac` are dropped. That is 151 of the 394 glyphs, which is where
  almost all of the mono's 60% saving comes from, and it is a correctness fix as
  well: `calt` in JetBrains Mono turns `->` into an arrow, and a results sheet
  must never do that to a note somebody typed in Discord.
- `ccmp` and `mark` are kept, so a decomposed accented name still composes. The
  first (smaller) subset attempt lost `mark` because no combining marks survived
  in it; the shipped subset keeps all seven.
- Nexa's `kern` is kept. The two-weight lockup is tracked display type and the
  pair fitting is part of the identity.

### Filenames and the one-way door

`vercel.json` serves `/fonts/*` with `public, max-age=31536000, immutable`, so a
replaced file would be stale in a browser for a year. All four faces therefore
ship under new names ending `.latin.v2.woff2`, and the four old files are
deleted from `public/fonts/`. The originals are backed up at
`<scratchpad>\originals\fonts\`. Updated together: the `@font-face` block at the
top of `src/styles/global.css` and the four `<link rel="preload">` tags in
`src/layouts/Base.astro`. Both places carry a comment pointing at the other, and
`DESIGN.md` section 3 and `DEPLOY.md` section 0b record the rule.

### Verification

**`audit-tool/fonts5.mjs`**, five routes at 1440 and 390:

- `document.fonts.status` is `loaded` on all ten, with **4 of 4 `FontFace`
  objects loaded** on every one.
- Every woff2 request is **200**, on the new filename, at the expected byte
  count (15,416 / 15,416 / 8,564 / 8,640).
- Every family in use paints with the web font, proved by measurement rather
  than by `document.fonts.check()`: a probe string built from the characters the
  page actually renders is measured with the site's stack and again with the
  stack's first family removed. All 47 family/weight/page combinations differ,
  so none is falling back. Example, home 1440: `Nexa 700` 1450.24 px against a
  1417.34 px fallback; `JetBrains Mono 400` 816 px against 720.31 px.
- The per-character probe flags `L` in Nexa Light on four pages. It is a false
  positive of the method (that glyph's advance happens to equal the monospace
  control's at 40px); `fontkit` confirms `U+004C` is present in both Nexa
  subsets, and the pixel diff below is the real evidence.

**Pixel diff, `audit-tool/fulldiff.mjs`** - the full-page render of all five
routes at 1440 and at 390 DPR2, reduced motion, everything revealed, against the
same capture from the pre-subset build:

| Render | Differing pixels | % |
|---|---|---|
| desktop home | 115 | 0.0013% |
| mobile home | 360 | 0.0032% |
| desktop and mobile team, about, partners, 404 (8 renders) | **0** | **0.0000%** |

The home difference is a 15x11 px box at (869, 958) on desktop and a 30x21 px
box at (218, 2076) on mobile: **the countdown's own digits**, which moved
between the two captures. Nothing else on the site changed by one pixel.

---

## 2. The polish pass

22 changes. Every one is a defect or an inconsistency found by looking, not a
preference.

### The one a visitor would have seen

**1. The results sheet's column headers were being styled by the body-cell
rules.** `.col-driver` and `.col-date` sit on the `<th>` as well as the `<td>`,
and an Astro-scoped `.col-driver` is (0,2,0) against `.field-label`'s (0,1,0) in
`global.css`. So in a row of five column headers, "Drivers" rendered at 15px
`--ink-dim` body type and "Date" at `--track-data` instead of `--track-label`,
beside three 11px tracked mono labels. Both are scoped to `td` now. Visible at
1440 in `shots/r5-sections/home-1440-03-results.png` (before) against
`shots/r5-sections-b/home-1440-03-results.png` (after). This is the same cascade
trap pass 3 documented for `--compact-inset` and `--compact-number-size`, in a
third place.

### Design-system drift

**2-9. Eight mono rules were asking for a weight the site does not ship.** The
body is `font-weight: 300` and only two mono faces exist, so `.data`,
`.field-label`, `.pos-field`, `.event-series`, `.chip`, `td.col-date`, the
stacked-table `data-label` prefix and `.founding dd` all inherited 300. Every
browser substituted the 400 face, so it looked right, from a rule that said
otherwise. All eight declare `font-weight: 400` now. **Measured after:** the
site paints exactly four family/weight pairs - `Nexa 300`, `Nexa 700`,
`JetBrains Mono 400`, `JetBrains Mono 700` - where the same probe before the fix
reported a fifth, `JetBrains Mono 300`, on every page.

**10-11. Eleven hard-coded colours became a token.** The hero scrim, the mobile
scrim, the nav scrim and the HUNT-texture scrim were `rgba(0, 10, 8, ...)`
literals across four components, at four different alphas. A colour token cannot
carry an alpha, so `--bg-rgb: 0 10 8` was added and they are
`rgb(var(--bg-rgb) / .88)` now. It is deliberately not redefined in the print or
forced-colours blocks: every element that uses it is hidden in both, and a scrim
that inverted with the page would paint white over white.

One measured side effect, worth recording because it looks like a regression and
is not: the join band shows a 510-pixel difference in a 10px-tall strip on
`/team` and `/about`. Cause, confirmed by running the minifier on both forms:
lightningcss folds `rgba(0, 10, 8, 0.86)` into `#000a08db`, whose alpha is
219/255 = 0.85882, while a `var()` inside `rgb()` cannot be folded and keeps the
authored 0.86. That 0.0012 of alpha shifts one dither band in a gradient. The
new values are the authored ones.

**20. One hairline weight was wrong.** `.channel-list` on `/partners` opened
with `--line` while every other list head on the site (results, roster, entry
strip, teaser, dossier, join steps, pillar register) opens with `--line-strong`.
The rule is now written down in `DESIGN.md` section 2: strong above the first
row of a data block, light between rows and between sections.

**17-19. Arrows and channel names.** A driver's own social link printed the raw
`socials` key ("youtube"), which the uppercase rule hid on screen and a screen
reader read out; it goes through the same `socialLabel()` the footer and
`/partners` use now. It also carried no arrow glyph while every other text link
that leaves the site does, so it gained the up-right icon and joined the
arrow-nudge family list. That list was itself wrong in the other direction:
`.channel-list a` carries an arrow and was not in it, and `.notfound-links a`
was in it and carries none. Corrected in all four blocks that name the family
(transition, hover, external hover, reduced-motion reset).

### Optical alignment

**12. The four-across values band did not line up.** At 1440 one of the four
titles wraps ("Precision over flash" in a 320px cell), so the four sentences
under them started at three different heights, with full-height hairlines
between the columns making it obvious. Two lines are reserved for the title in
the four-across band only (`min-width: 1025px`); below that the band is two
across and the pairs wrap together, so nothing is reserved and no space is
spent. Before and after: `shots/r5-sections/home-1440-07-pillars.png` against
`shots/r5-sections-b/home-1440-07-pillars.png`.

### Microcopy, per `clarify.md`

**13. The countdown's zero state was over-claiming.** The contract carries dates
and not times, so the target is midnight in the team's timezone. `Under way` at
six in the morning on race day is a claim the clock cannot support. It reads
**"Race day"** on the start date and **"Under way"** only once that date has
passed (the strip keeps an event until its end date does). The tick keeps
running through "Race day" and stops at "Under way", which is the first value
that can no longer change.

**14. The 404's lead was a comma splice and did not say why.** "That page does
not exist. Nothing was lost, the pit lane is this way." became "That page does
not exist, or it moved when the site was rebuilt. The main pages are below." -
what happened, why, where to go. The primary action stays "Back to the paddock":
it is the documented label, the audience is sim racers, and the page directly
under it lists the three real pages in plain words.

**15. One heading broke the site's own rule.** A heading that speaks takes a
full stop ("On the hunt.", "Race with us.", "How to join.", "Talk to us.",
"Built in silence.", "Off track."); a heading that names something does not
("The crew", "Recent results", "Who drives"). `/partners`'s h1 was
"Partner with Artemis" and is now "Partner with Artemis." The rule is written
into `DESIGN.md` section 6 with both lists, so the next person does not have to
infer it.

**16. Two words for one promise.** The home partner band said a partner gets
"a seat in the Discord"; `/partners` says "a channel inside the community" and
the band's own empty state says "a channel in the Discord". The home line says
"a channel in the Discord" now.

**22. One empty state was left alone, deliberately.** "No race scheduled" reads
a little flat and "No race scheduled yet" is better copy, but
`docs/data-contract.md` quotes the current string as the site's behaviour and
the Discord bot is written against that document. It changes on both sides or on
neither, and the brief forbids touching the contract. A comment in
`NextRace.astro` says so.

### Code hygiene

**21.** `src/lib/links.ts` still explained the short CTA label by saying
"`.btn` is `white-space: nowrap`". Pass 3 removed that declaration (it was what
broke the header at 200% text). The comment now gives the real reason.

### Deferred items from passes 2-4, reconciled

| Item | Pass | Outcome now |
|---|---|---|
| **G11** font subsetting | 4 | **Done.** Section 1 above. |
| **C20** animate the mobile menu | 2 | Already closed by pass 4 (F1). Listed here because pass 2's deferral list still names it. |
| **G14** unused inlined CSS | 4 | **Still deferred**, and it should be. The original critique's own recommendation was "leave it", most of what the tool counts is state CSS that must ship (`forced-colors`, `prefers-contrast`, `@media print`, the menu breakpoint, `.is-stuck`, every `:hover` and `:focus-visible` block), and the genuinely dead part is 2 to 4 KB gzipped per route. |
| **G21** explicit `twitter:*` tags | 4 | **Still deferred.** It is cheap to add and it is a net negative: X already falls back to the `og:*` values correctly, so four duplicated tags add bytes to a render-blocking document and a drift risk for zero rendering change. "Cheap" is not the same as "worth it". |
| **G23** the garage `prev` button is `disabled` at load and not tabbable | 4 | **Still deferred.** The critique's own verdict was "working as designed and WCAG-conformant". The region is focusable and arrow-scrollable, and `aria-disabled` plus a no-op handler trades a correct state for a discoverability nicety. |
| **G25** preview deployments are crawlable | 4 | **Cannot be code.** `vercel.json` is not environment-aware. It is item 7 in the owner list in `docs/redesign-summary.md` and in `DEPLOY.md` section 0b. |
| **A5b** fill `stats.licence` | 2 | **Owner decision, escalated.** It was filed as "cannot, these are placeholder drivers". It is really "should iRating and licence class be published about real people at all", and `PRODUCT.md` now says that. |
| **B3** make the h1 the value proposition instead of the lockup | 2 | **Still deferred.** The two-weight lockup is on the brief's keep list. |
| **B8 part** a photograph of a rig, a wheel or a screen | 2 | **Still open, owner.** No such photograph exists and the brief forbids new imagery. |
| **E17** a dark-variant GLYTCH mark | 3 | **Still open, owner.** The CSS plate keeps it legible in forced colours; a dark-on-transparent export is the right fix. |
| Nordschleife is a 1089px crop | 3 | **Still open, owner.** A clean re-render without the AMG hoardings in frame would close it. |

One new owner item was found and could not be fixed here: **`results.json` and
`events.json` spell one event `"CTC truck league, round N"`** while every other
name is title case, and `/partners` prints event names exactly as stored, so it
reads "CTC truck league, round 5" beside "Friday Night Lights, round 9". The
data files are out of scope for this pass; it is listed in `CONTENT.md` under
the record that carries it, to be fixed when the placeholder is replaced.

---

## 3. Anti-slop pre-flight, page by page

Run mechanically where it can be (`audit-tool/preflight5.mjs` and
`navcheck.mjs`, against the built pages in a real browser) and by inspection
where it cannot. **P** = pass, **n/a** = the pattern does not exist on this site.

### impeccable, Absolute bans

| Ban | home | team | about | partners | 404 | Evidence |
|---|---|---|---|---|---|---|
| Side-stripe borders (>1px coloured accent) | P | P | P | P | P | The only side borders are 1px column hairlines in the teaser, the entry strip and the value register. `grep border-radius` returns one line, `var(--radius)`, which is 0. |
| Gradient text (`background-clip: text`) | P | P | P | P | P | `grep background-clip src/` returns nothing. |
| Glassmorphism as default | P | P | P | P | P | `grep backdrop-filter src/` returns nothing. Both declarations were deleted in pass 2. |
| The hero-metric template | P | n/a | n/a | n/a | n/a | **Judged.** The hero carries one number, not a metric row: `P2` over `of 41` on a hairline, with the event that produced it beside it. No supporting stat trio, no gradient accent. The brief requires exactly one proof point on the first screen. |
| Identical card grids | P | P | P | P | P | **Judged.** The nearest thing is `/partners`'s offer grid, which is one full-width lead item at `--text-2xl` over three at `--text-xl`, with a top hairline each and no box. The only boxed elements on the site are the contact card and the single partner entry. |
| Tiny uppercase tracked eyebrow above every section | P | P | P | P | P | **Measured: 0 eyebrows on every page** against 8 / 5 / 4 / 6 / 1 headed sections. The cap would have been 3 / 2 / 2 / 2 / 1. |
| Numbered section markers as scaffolding | P | P | P | P | P | The only numbers labelling a sequence are `01 / 02 / 03` on the join explainer, which genuinely is a sequence, on the home page only. |
| Text that overflows its container | P | P | P | P | P | No horizontal overflow at 390 on any route (`scrollWidth === innerWidth === 390`), and all five pages hold a 390 layout at a 200% root font. |

### impeccable, general rules

| Rule | Result |
|---|---|
| Body text >= 4.5:1, large >= 3:1 | Every text token clears 4.5:1 on both grounds. axe reports zero AA contrast violations on ten page/viewport combinations. |
| No gray text on a coloured background | The one text-on-colour pair is `--teal-ink` on `--teal`, 14.7:1. |
| Body measure 65-75ch | `--measure: 66ch` for prose, `--measure-lead: 52ch` for every lead. |
| No two similar-but-not-identical families | Two families on a real contrast axis: geometric display sans against monospace. |
| Display clamp max <= 6rem | Top step is 5rem with a 15vw ceiling. |
| Display tracking floor >= -0.04em | `--track-display: -0.01em`. |
| `text-wrap: balance` on headings, `pretty` on prose | Global on h1-h4 and on `p`, plus the heading-shaped spans inside cells. |
| Vary spacing for rhythm | One fluid ramp; sections choose `--space-2xl` or `--space-3xl` deliberately. |
| Cards only when they are the best affordance | Two boxed elements on five pages. |
| Semantic z-index scale | Six named steps, no arbitrary values. |
| Ease-out, no bounce, no elastic | Two curves, both ease-out powers; no `ease-in`, no `transition: all`. |
| Reduced motion for every animation | `document.getAnimations()` returns **0 running, 0 total** under `reduce`; parallax is not attached; the property and duration lists are clamped together. |
| Reveals enhance an already-visible default | `.reveal` moves 12px and touches no opacity. With JS off: **0 of 37 reveals offset, faded or zero-height** across the five pages. |

### taste, section 14 pre-flight

| Box | Result |
|---|---|
| Brief inference declared | "Redesign, preserve: a sim-racing team's marketing site for prospective drivers first and sponsors second, pit-wall / timing-tower language, native CSS on Astro with two self-hosted families." Recorded in `DESIGN.md` section 1 since pass 1. |
| Dials explicit | Variance 7, motion 5, density 5. Asymmetric compositions, present but subordinate motion, dense data rows with generous space around them. Reasoned from "redesign, preserve" plus the evidence-first brief, not the baseline. |
| Design system chosen or aesthetic labelled honestly | No third-party system. Native CSS with a documented token set; `DESIGN.md` is the system. |
| Redesign mode detected, audit performed | Yes, across passes 1 to 4: six critiques, 141 findings. |
| **Zero em dashes anywhere** | **Measured: 0 em dashes and 0 en dashes** in the rendered text, alt text, aria-labels and titles of all five pages. Date ranges use a spaced hyphen (`25 - 27 SEP 2026`). |
| Page theme lock | One dark theme, five pages. `color-scheme: dark`. No section inverts. |
| Colour consistency lock | One accent, `--teal`, on every page. The only semantic colour rule is podium positions. |
| Shape consistency lock | `--radius: 0` everywhere. One system, no exceptions. |
| Button contrast | `--teal-ink` on `--teal` is 14.7:1; the ghost button is `--ink` with a `--line-strong` border on the page ground. In forced colours the solid button takes `Highlight` / `HighlightText`. |
| CTA wrap | **Measured: 0 wrapped CTAs** on all five pages at 1440. |
| Form contrast | n/a. The site has no `<form>`; `form-action 'none'` is in the CSP. |
| Serif discipline | n/a. No serif. |
| Premium-consumer palette | n/a. Not that brief, and the palette is the team's existing identity. |
| Italic descender clearance | n/a. No italics. |
| Hero fits the viewport | At 390, 768 and 1440 the lockup, the lead, the proof row and both buttons are on the first screen. The one exception is 390 at a 200% root font, where the second button falls below the fold; documented and accepted since pass 3, with the primary action also in the header on the same screen. |
| Hero top padding | `calc(var(--nav-h) + var(--space-m))` = 96px at 1440, under the 6rem-plus-bar guidance, and the copy is vertically centred rather than floating. |
| Hero stack discipline, max 4 text elements | **Measured: exactly 4** - `h1.hero-title`, `p.hero-lead`, `p.hero-proof`, `div.hero-actions`. No eyebrow, no tagline under the buttons, no trust strip. |
| Eyebrow count | **Measured: 0 on every page.** |
| Split-header ban | No section puts a small explainer in the opposite corner. `.section-head-stack` exists precisely to stack the heading over its lead. |
| Zigzag alternation cap | The only image-and-text split is the hero. There is no second one, let alone a third. |
| No duplicate CTA intent | **Measured.** home: "Join the team" x4 (header, compact header, mobile panel, hero, join band) plus "See results", "Full roster (6 drivers)", "What a partner gets". partners: "Partner with us" x4 plus "All results". One label per intent. The compact header label "Join" / "Partner" carries the full label as its accessible name. The one two-label intent is the results link, deliberate and documented in `PRODUCT.md`: "See results" where the reader has seen none, "All results" only where three are already on screen. |
| Logo wall = logo only | n/a. One partner, shown as a mark with a "partner since" line, not a wall. |
| Bento background diversity | n/a. No bento. |
| Trusted-by wall under the hero | n/a. |
| Copy self-audit | Every visible string re-read this pass. Four rewritten (items 13-16 above). No broken grammar, no invented metric, no cute-but-wrong phrasing. **0 exclamation marks and 0 emoji** measured across all five pages. |
| Motion motivated | Every move has a one-sentence reason in `DESIGN.md` section 5's table. |
| Marquee max one | **Zero.** The pass-1 "On the hunt" marquee was removed in pass 2. |
| Navigation on one line, <= 80px | **Measured at 1024, 1280, 1440 and 1920: 1 row, bar height 72px**, last item ending 41 to 56px inside the shell. |
| Section-layout repetition, 4+ families over 8 sections | Home runs eight sections in seven compositions: diagonal split hero, full-width data strip, stacked head over a table, head-with-controls over a bleeding filmstrip, head-with-link over a four-column register, heading-and-lead over a four-across register, logo-left row on a different ground, full-width statement over a numbered three-column band. |
| Bento cell count | n/a. The two grids that could leave a hole do not: six entry cells for six drivers, four offer cells for four items with the first spanning the row. |
| Long lists use the right component | **Judged, one deviation.** `/partners`'s channel list is 7 hairline rows. The alternatives were tried or ruled out: a two-column grid left a visible hole in the last row (pass 2, B9), a card grid needs channel logos the design forbids drawing, tabs are wrong for outbound links, and a second scroll-snap strip would dilute the garage. Seven 44px rows, each a real destination, is the honest shape. The results sheet is a real table capped at six rows, not a spec dump. |
| Real images, no fake screenshots, no hand-rolled decorative SVG | Seven in-sim renders and three photographs, all the team's own. The only hand-drawn vectors are the brand mark and the five-glyph icon set, both of which are the identity. |
| No pills or labels over images | None. Captions sit below the frame. |
| No photo-credit decoration | None. The three About captions say what the picture is and why it is there. |
| No version footers | **Measured: none.** |
| No micro-meta sentences under eyebrows | n/a. No eyebrows. |
| No decoration strip at the hero bottom | None. |
| No floating top-right sub-text | None. |
| No scoring bars with filled tracks | The garage progress line is a scroll position indicator on a 2px rule, not a comparison visual. |
| No locale, time or weather strips | **Measured: none.** |
| No scroll cues | **Measured: none.** |
| No version labels in the hero | None. |
| No section-numbering eyebrows | None. |
| No decorative dots | **Measured: 0 round empty elements between 4 and 16px** on all five pages. |
| No `border-t` and `border-b` on every row | One or the other, never both: a container top rule plus a bottom rule per row. |
| Content density | Six results, five cars, four values, three join steps, seven channels. No fake-precise numbers: every figure on the site comes from `results.json` or `drivers.json`, and the ones that are placeholders are listed record by record in `CONTENT.md`. |
| Quotes <= 3 lines | n/a. No testimonials. |
| Motion claimed = motion shown | The hero entrance, the position marker, the podium rule, the parallax, the row reveals, the nav underline, the press states and the menu all run. |
| GSAP skeletons | n/a. GSAP was removed in pass 2. |
| No `window` scroll listener | **Measured: one `addEventListener('scroll')` in the codebase, passive, on the garage track element.** Sticky state is an IntersectionObserver; the parallax is a CSS scroll timeline. |
| Reduced motion wrapped | Yes, and verified: 0 animations under `reduce`. |
| Dark mode tokens tested | Dark is the only mode, and it is tested in three more: `prefers-contrast: more`, `forced-colors: active` and `@media print`. |
| Mobile collapse explicit | Every multi-column layout declares its own stacked rule. |
| Viewport stability | **Measured: `grep 100vh src/` returns nothing.** Two uses of `100dvh`. |
| `useEffect` cleanup | n/a. No React. |
| Empty, loading, error states | Every array the bot writes has a deliberate empty state, verified by building with each file emptied and with all four emptied. No loading state exists because nothing loads. |
| Cards omitted in favour of spacing | Two boxed elements on five pages. |
| Icons from one family | One set, five glyphs, one stroke weight, square caps. |
| No AI tells from section 9 | No Inter, no AI purple, no three equal cards, no "Acme", no "Quietly in use at". Driver names are varied and locale-appropriate and every one is flagged as a placeholder in the data and listed in `CONTENT.md`. |
| Core Web Vitals plausible | LCP 1.8 s mobile / 0.4 s desktop, CLS 0, TBT 0 ms. |
| One design system | Yes. |

### The AI slop test

**First-order.** Could someone guess the theme and palette from the category
alone? For "esports team", dark is the reflex, and this site is dark. The honest
answer is that the palette is not a choice this work made: teal `#0fffcf` on
near-black `#000a08` is the team's existing Gen3 identity, and the brief's
section 2 fixes it as an identity-preservation constraint. What the redesign
chose is the *register*, and that is where the reflex was refused: a timing
tower and an entry list rather than an esports template, with tabular numerals,
hairline rules and position markers carrying the page instead of glows, angled
panels and animated hex patterns.

**Second-order.** Could someone guess the aesthetic family from
"esports-that-is-not-neon-esports"? The two saturated answers to that are
terminal-native dark mode and brutalism. Neither is what this is. The mono is
confined to data and never sets prose; there is no raw-border, unstyled,
Courier-and-borders brutalism; there are ten real photographs; and the layout is
asymmetric editorial rather than a grid of boxes. The one device that is only
this site's is the position marker counting down from the field size to the
finish, which no other category could use.

**Result: no box fails.** Four are recorded as judged rather than mechanical -
the hero proof row against the hero-metric ban, the offer grid against the
identical-card-grid ban, the seven-row channel list against the long-list rule,
and the first-order palette question above. Each is argued rather than asserted.

---

## 4. Verification

Everything below is against the final build. Nothing was measured on the dev
server.

### Build

```
npm run build   ->  exit 0
                    prebuild: check:data passed (6 results, 8 drivers, 3 events)
                    5 page(s) built in ~700 ms
                    zero warnings
```

`dist/` = **2,585,731 bytes across 78 files** (2,616,291 in pass 4; the
difference is exactly the 30,560 bytes of font).

### Lighthouse 13.4.1, on the brotli + `vercel.json` headers server

Three consecutive runs, identical numbers on all three.

| Route | Perf | A11y | Best practices | SEO | FCP | LCP | CLS | TBT | SI |
|---|---|---|---|---|---|---|---|---|---|
| `/` mobile | **100** | **100** | **100** | **100** | 0.8 s | **1.8 s** | **0** | **0 ms** | 0.8 s |
| `/team` mobile | **100** | **100** | **100** | **100** | 0.6 s | 1.2 s | **0** | **0 ms** | 0.6 s |
| `/about` mobile | **100** | **100** | **100** | **100** | 0.6 s | 1.1 s | **0** | **0 ms** | 0.6 s |
| `/partners` mobile | **100** | **100** | **100** | **100** | 0.9 s | 1.4 s | **0** | **0 ms** | 0.9 s |
| `/` desktop | **100** | **100** | **100** | **100** | 0.2 s | 0.4 s | **0** | **0 ms** | 0.2 s |

The floor was 99/100/100/100. Pass 4 scored 99 on `/` here and could not get
back to 100; the font subset did it. Against pass 4: `/` performance 99 to
**100**, LCP 2.0 s to **1.8 s**, `/team` LCP 1.4 s to **1.2 s**, `/partners`
99 to 100 already in pass 4 and held.

The pass-3 harness (no compression) is kept as the comparable baseline and also
improved: `/` went **98 to 99** and the other four hold 100. `/` LCP there is
2.2 s, FCP 1.3 s.

### axe-core 4.13.0

**Zero WCAG 2.0 / 2.1 / 2.2 level A and AA violations**, five pages at 1440 and
390, plus the mobile menu with the panel open.

| Page | 1440 | 390 |
|---|---|---|
| `/` | 0 A/AA (52 AAA-only nodes) | 0 A/AA (39) |
| `/team` | 0 (17) | 0 (17) |
| `/about` | 0 (8) | 0 (8) |
| `/partners` | 0 (30) | 0 (25) |
| 404 | 0 (5) | 0 (5) |
| `/` with the menu open, 390 | **0 violations of any kind** | |

The only rule that fires is `color-contrast-enhanced`, the AAA 7:1 bar, included
on purpose. Node counts are pass 4's plus one on `/` and one on `/partners`, and
the cause is the header fix in section 2: "Drivers" moved from `--ink-dim`
(11.6:1, clears AAA) to `--ink-faint` (5.5:1, clears AA), which is the correct
style for a column header and is counted by the AAA rule like the other four.

### Keyboard

**143 tab stops** across the five pages (32 / 27 / 21 / 38 / 25, unchanged).
**0 without a visible `solid 2px rgb(15, 255, 207)` ring, 0 without an
accessible name, 0 outside the viewport when reached.** The skip link is stop 1
and lands on `MAIN#main`. The menu trap cycles ten stops with `#main` and the
footer `inert`; Escape closes it, returns focus to the toggle, unlocks the body
and clears `inert`. `/#results` lands 88 px from the top against a 73 px bar.

### CSP, headers, cache and redirects

`audit-tool/csp-check.mjs`, `dist/` served with the real `vercel.json`, brotli
negotiated, every page driven through the things a policy could block.

**0 CSP violations, 0 console errors, 0 failed requests, on all five pages at
1440 and 390.** Every page reports the policy and the five other security
headers present, the client module running, every reveal settled (13 / 13, 8 / 8,
9 / 9, 7 / 7), the countdown rendered and the marker at `P2`.

| Path | Cache-Control |
|---|---|
| `/_astro/*.webp` | `public, max-age=31536000, immutable` |
| `/fonts/jetbrains-mono-400.latin.v2.woff2` | `public, max-age=31536000, immutable` |
| `/og.png`, `/favicon.svg` | `public, max-age=86400` |
| `/` | `public, max-age=0, must-revalidate` |

Redirects, probed live: `/join` 301, `/results` 301, `/calendar` 301, `/media`
301, `/legacy` 301, `/team.html` 301, `/404` 301, and `/team/` 308 to `/team`.

### Screenshots

- `shots/r5/` - 72 files, 1440x900 and 390x844 at DPR2, every route, full pages
  and scroll sequences. **Console: 0 messages, 0 page errors, 0 failed requests
  on all four real routes.** The 404 route's four entries are the deliberate
  HTTP 404 on the document itself.
- `shots/r5-tablet/` - 75 files at 768x1024 and 1024x768. Same console result.
- `shots/r5-sections/` and `shots/r5-sections-b/` - 125 section-level captures
  at 1440, 768 and 390, before and after the polish. This is what the polish was
  done against: a 6,000px full-page render is not something alignment can be
  judged in.
- `shots/r5-font/` and `shots/r5-polish/` - the two pixel-diff baselines.

Viewed directly: every desktop full and hero, every section at all three widths,
`mobile-home-full`, `mobile-404-full`, `t768-home-hero`, `t1024-team-hero`. Two
defects were found this way and fixed (the results header, the value register).

### Robustness

- **JS disabled**, five pages: `html` carries no `js` class, every `<h1>` at
  `opacity: 1` and `transform: none`, **0 of 37 reveals offset, faded or
  zero-height**, the countdown correctly `hidden` with the static date still
  printed (`25 - 27 SEP 2026`), the garage controls `visibility: hidden`, the
  menu hidden, the footer year from the build.
- **Reduced motion**: `document.getAnimations()` **0 running, 0 total**, the
  parallax not attached, reveals `transform: none`, the transition property and
  duration lists clamped together.
- **Print**: `body` `rgb(255,255,255)` on `rgb(0,0,0)`, headings and cells black,
  the fixed nav dropped.
- **200% text**, all five pages at 390: layout viewport holds **390**, no
  overflow, the hamburger 44x44 and fully on screen at x=316.

### Semantics

`html-validate`: `/` 45 errors, `/partners` 27, **all `no-redundant-role` and
all deliberate** - the explicit `role="table|rowgroup|row|columnheader|cell"` on
`ResultsTable` is the mechanism that keeps the stacked mobile layout announced
as a table. `/team`, `/about` and `404.html` are clean. Unchanged from pass 4.

### The pass-2 interaction harness

`shots-tool/verify-r2.mjs`: **14 checks, 14 pass, 0 fail.**

It failed once first, on the garage check, and the failure was real but was not
a pass-5 regression: pass 4 (G24) replaced the explicit `role="region"` on the
scroll wrapper with a labelled `<section>`, which *is* `role="region"`
implicitly and clears html-validate's `prefer-native-element`. The assertion was
reading `getAttribute('role')`, so it was testing the markup rather than the
semantics. It asks the accessibility tree now, through CDP: **computed
`role=region`, name "Artemis liveries, scroll sideways"**, with the `<ul>`
keeping its list role. The correction is commented in the harness.

### The pass-3 adapt harness

`adapt-tool/run-r5.mjs`, `run2-r5.mjs`, `imgcheck-r5.mjs`, scored with
`score-r3.mjs` on critic E's own bar: **15 of 70 cells carry a note, identical
to pass 3, cell for cell.**

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

The ten `img` cells are all UPSCALE and all source-bound (the 1920px HUNT
texture behind a scrim at 0.55 opacity, and the 1089px Nordschleife crop).
**OVERSIZE is 0**: 133 measurements over 10 viewports x 5 pages and nothing
fetches more than 1.6x the pixels it needs. The five `menu-offscreen` cells and
the one `hero-cta-below-fold` are the 200%-text residuals pass 3 accepted.

**A third harness correction, same class as pass 3's two.** The raw probe now
reports the results sheet's `thead` as truncated on every viewport where the
sheet stacks: pass 4 (G2) stopped hiding it with `display: none`, which deletes
it from the accessibility tree, and clipped it instead, which is the same
mechanism as `.sr-only`. The scorer already excluded `.sr-only`; it excludes the
clipped `thead` now, for the same reason, and the exclusion is commented. Before
the exclusion the score read 24/70, and all nine extra cells were that one
element.

### Empty-data build test

Each file copied, replaced with `[]`, built, screenshotted, restored.

| Case | Build | Pages | Validator |
|---|---|---|---|
| `results.json: []` | **exit 0** | 5 | `passed (0, 8, 3)` + the empty-file warning |
| `events.json: []` | **exit 0** | 5 | `passed (6, 8, 0)` |
| `partners.json: []` | **exit 0** | 5 | `passed (6, 8, 3)` |
| `drivers.json: []` | **exit 0** | 5 | `passed (6, 0, 3)` |
| all four at once | **exit 0** | 5 | `passed (0, 0, 0)` |

Screenshots in `shots/r5-empty/`. **`git diff --stat src/data` is empty,
`git status --porcelain src/data` prints nothing, the four files are restored
byte-identical (SHA-256 compared) and no `.bak` file is left behind.**

### `npm run check:data`

Passes: `check:data passed (6 results, 8 drivers, 3 events)`. Negative-tested
again this pass: with `results.json` emptied it prints
`warning results.json: file is empty; the site will render its empty state for
this section.` and still exits 0, which is the documented behaviour.

### Bytes

| Route | HTML raw | gzip | brotli | inline CSS (raw / gzip) | inline JS (raw / gzip) |
|---|---|---|---|---|---|
| `/` | 108,691 | 22,827 | **17,851** | 54,078 / 8,753 | 5,755 / 2,343 |
| `/team` | 73,724 | 16,096 | 13,346 | 35,049 / 6,202 | 5,755 / 2,343 |
| `/about` | 67,003 | 16,097 | 13,366 | 30,993 / 5,928 | 5,755 / 2,343 |
| `/partners` | 81,131 | 17,143 | 14,178 | 37,100 / 6,429 | 5,755 / 2,343 |
| 404 | 53,739 | 12,799 | 10,647 | 22,688 / 4,883 | 5,755 / 2,343 |

**0 external JavaScript files, 0 external stylesheets.** Fonts 48,036 B total.
`dist/_astro` 2,019,966 B across 62 webp derivatives. Largest single file: the
About group photo at 1920px, 227,940 B.

---

## 5. Handover documents

| File | State |
|---|---|
| `README.md` | **Rewritten.** What the site is, the five pages, the four branches and what each is for, `npm install` / `dev` / `build` / `check:data` with what each does and why the build gate exists, where every piece of content lives, how the Discord bot updates it, how deploying works, and a table pointing at the other six documents. Written for a volunteer: no jargon, no shorthand, node version and install link included. |
| `CONTENT.md` | **"Fill in" rewritten and completed.** All 17 `_placeholder` records now listed individually with their ids: 8 drivers in a table, 6 results in a table with what is fake in each, 3 events with which one is real. Plus the two empty-on-purpose slots (stats, socials) with the owner decision each implies, the About origin copy, the hero render choice and its two consequences, and the partner details to confirm. Also names the `/data placeholders` command, the "rename in both files" trap, and the one capitalisation fix to make while replacing a record. |
| `docs/redesign-summary.md` | **New.** One section per pass, the measured results, eight owner decisions and a nine-step go-live checklist with the exact git commands and the exact things to check on the live site. |
| `DESIGN.md` | Section 2 gains `--bg-rgb` and the hairline rule; section 3 gains the subset faces, what is in them, why, and the new-filename rule, plus the mono weight rule; section 6 gains a "Words" subsection recording every copy rule the site follows; section 8 gains the font result; section 9 gains the pass-5 decision log. |
| `PRODUCT.md` | The `/partners` secondary action corrected, the two-label results rule recorded, the iRating question reframed from "cannot" to "decide", and NordVPN added as an explicit open question. |
| `DEPLOY.md` | Expected build size updated to 2.6 MB with the current largest-file table, and the `/fonts/*` immutable note now names `.latin.v2` and says what a re-subset has to change. |

---

## 6. Files changed

```
public/fonts/                 four subset faces added, four originals deleted
src/styles/global.css         @font-face x4 -> subset filenames; --bg-rgb token;
                              .data + .field-label font-weight; arrow-nudge
                              family list corrected in 4 blocks
src/layouts/Base.astro        four preloads -> subset filenames
src/components/ResultsTable.astro  .col-driver/.col-date scoped to td; four mono
                              rules declare their weight
src/components/PillarBand.astro    two-line title reserve above 1024
src/components/DriverCard.astro    socialLabel(); the up-right glyph; gap
src/components/NextRace.astro      comment recording the pinned empty-state string
src/components/Hero.astro          five scrim literals -> rgb(var(--bg-rgb) / a)
src/components/JoinCta.astro       four scrim literals -> the token
src/components/Nav.astro           one scrim literal -> the token
src/components/PartnerBand.astro   the forced-colours plate -> the token
src/pages/index.astro         "a seat in the Discord" -> "a channel"
src/pages/partners.astro      h1 full stop; .channel-list head hairline
src/pages/about.astro         .founding dd font-weight
src/pages/404.astro           lead rewritten
src/lib/links.ts              socialLabel() exported; stale comment corrected
src/scripts/site.ts           countdown zero state
README.md                     rewritten
CONTENT.md                    "Fill in" rewritten
DESIGN.md                     sections 2, 3, 6, 8, 9
PRODUCT.md                    CTA table, two open decisions
DEPLOY.md                     build size, font filename rule
docs/redesign-summary.md      new
```

Scratchpad tooling added: `font-tool/{analyse,subset,verify,diff}.mjs`,
`audit-tool/{fonts5,fulldiff,sections5,preflight5,navcheck,lh5}.mjs`,
`perf-tool/{lh5-vercel,lh5-plain}.mjs`,
`adapt-tool/{run-r5,run2-r5,imgcheck-r5}.mjs`, `empty-test5.mjs`. Three existing
harnesses corrected: `shots-tool/verify-r2.mjs` (computed role),
`adapt-tool/score-r3.mjs` (clipped `thead` exclusion),
`audit-tool/csp-check.mjs` (the font path it probes).

Nothing committed. `node_modules/` untouched. `src/data/` byte-identical.
Nothing written outside the project and the scratchpad.

---

## 7. The five things I am least sure about

1. **Keeping the Latin Extended-A letters cost 3.9 KB and the reasoning is a
   guess about future data.** The cheaper subset is 44,164 B rather than
   48,036 B, and the extra glyphs (`Ł ł Š š Ž ž Œ œ Ÿ ı Ă`) render nothing at
   all today, because every driver on the site is a placeholder with an
   unaccented name. I kept them because the bot writes real names from Discord
   and a European sim-racing roster is where those letters live, and because one
   fallback letter inside a 36px outlined car-number block is a worse defect
   than 3.9 KB. But it is a bet on data that does not exist yet, and if the real
   roster turns out to be entirely anglophone the bytes were wasted.

2. **Dropping `calt` from JetBrains Mono is a judgement about text nobody has
   written yet.** It is 12 of the 13 KB saved on each mono face, and I am
   confident it is right for a results sheet (a note containing `->` or `!=`
   would otherwise render as a ligature). What I cannot rule out is that
   somebody one day wants JetBrains Mono's actual code ligatures somewhere on
   the site, at which point this is a re-subset rather than a CSS change. The
   `frac` drop is the same shape of decision and even less likely to matter.

3. **"Race day" versus "Under way" is a guess at what the reader wants.** The
   contract has no start time, so the countdown reaches zero at midnight in the
   team's timezone. "Race day" is honest for the whole of the start date, and
   "Under way" is honest from the day after. What neither is, is precise: on a
   single-day event the reader still cannot tell from the site whether the green
   flag has dropped. The real fix is a start time in the contract, which I was
   told not to change, so this is the best available wording rather than the
   right answer.

4. **I scoped the value-register title reserve to `min-width: 1025px` rather
   than fixing it structurally.** `grid-template-rows: subgrid` on the pillar
   items would align the two rows properly at every width with no reserved
   space, and it is supported everywhere that matters in 2026. I did not use it
   because a subgrid item's own block padding interacts with the parent's track
   sizing in ways I could not verify quickly, and `.is-row .pillar` carries
   `padding: var(--space-m) var(--space-m) 0 0`. The `min-height` is a floor, so
   a title that ever needs three lines would re-break the alignment for that one
   column.

5. **The results-link pair, "See results" and "All results".** I kept two labels
   for one destination and wrote the rule down rather than collapsing them. The
   argument is that "All results" on `/partners` tells a sponsor that the three
   rows above are a subset, which "See results" does not. The counter-argument
   is taste's own rule: one label per intent, and a visitor moving from `/` to
   `/partners` does see two words for one link. I think the information is worth
   the inconsistency; somebody could reasonably disagree.

---

## 8. Stop conditions

**None hit.**

- **The build never failed after a real fix.** It failed exactly once, on the
  first build after the polish edits, with `Expected ',' or ')' but found
  'class'`. The cause was mine and immediate: I had put a `{/* ... */}` comment
  inside the parenthesised else-branch of a ternary in `NextRace.astro`, which
  is two expressions where JSX allows one. The comment moved above the
  expression and the next build was exit 0. Every other build in the pass,
  including all five empty-data builds, returned exit 0 first time.
- **No Lighthouse or axe regression.** Lighthouse went up on both harnesses.
  axe's A/AA count stayed at zero; its AAA-only node count rose by one on two
  pages, and the cause is a fix, explained in section 4.
- **No missing glyph after subsetting**, so the original fonts were not
  restored. Coverage was checked three ways: `fontkit` against the target
  codepoint list, a codepoint-by-codepoint diff against each original, and a
  pixel diff of ten full-page renders in which eight were byte-identical and the
  other two differed only in the countdown's digits.

Two things a future pass should know, neither of which blocked anything:

- **Three of the six harnesses now carry an assertion that a later pass
  invalidated**, and two of those were found this pass. A check written against
  markup (`getAttribute('role')`, "is this element 1x1") breaks when a later
  pass improves the markup. Both corrections are commented in place. A harness
  is code and it drifts like code.
- **The event names in `results.json` and `events.json` are not consistently
  capitalised**, and `/partners` prints them raw. It is a data fix, out of scope
  here, and it is recorded in `CONTENT.md` beside the record that carries it.
