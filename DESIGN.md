# DESIGN.md - Artemis

The visual system. Read `PRODUCT.md` first for audience and IA, and
`docs/brand-core.md` for the brand this system serves.
Tokens live in `src/styles/global.css`; this file explains them and records why.

## 0. Where the brand core overrules a design rule

Pass 6 aligned the site to `docs/brand-core.md`. Three places where that
document and a generic design rule disagree, and what was chosen:

| Generic rule | Brand core | Choice |
|---|---|---|
| **impeccable** `reference/brand.md` lists **Inter** on the reflex-reject font list (a training-data default that creates monoculture) | Section 6 names Inter for body, UI and numbers, with tabular numerals | **Inter.** The same reference says identity-preservation wins where the brand has already committed to a face, and this brand has: the choice is the org's, made outside this repository, and a website whose body face differed from the stream overlays and the social templates would be the more expensive mistake. The reflex-reject list is for greenfield decisions. |
| **taste** and **impeccable** both treat a near-black-plus-one-saturated-accent palette as the esports category reflex | Section 6 fixes Night, the surface ramp, Mist and Signal by hex | **The brand core's palette.** The palette was never this work's to choose. What the redesign chose is the register (a timing tower, not an esports template), and pass 6 narrowed the accent from "the site's colour" to five named jobs. The hexes are NOCTURNE's as of the palette migration; the reasoning is unchanged. |
| **colorize** `reference/colorize.md`: "alpha is a design smell; define explicit overlay colours" | Section 6 gives two muted values and one Mist, not a nine-step ramp | **One alpha step kept** (`--mist-dim`). The two hairlines were alpha for the same reason until the NOCTURNE migration made them opaque; see below. |
| NOCTURNE darkens the accent on hover (`#0BD4AB`, 10.5:1) | - | **The lighter step (`#7DFFE3`, 16.0:1) was kept.** On a near-black ground, darkening on hover reads as the control dimming as the pointer arrives. Brightening is the direction every other state change on this site already moves in, and it holds more contrast. This is the one place the site departs from NOCTURNE. |
| **colorize** again, and the reasoning that kept the hairlines alpha | NOCTURNE specifies opaque borders | **Opaque, with a condition.** Measured against the two grounds actually in use, the opaque steps land in the same perceptual band as the alpha ones they replaced: `--line` is 1.50 on Night and 1.36 on `--surface-1`, against alpha's 1.32 and 1.39. The alpha argument only bites on `--surface-2`, which nothing currently paints a hairline on. **If something ever does, re-measure** - that is where an opaque value falls off (1.22) and the alpha one did not (1.40). |

## 1. Direction

**"Pit wall, not billboard."**

The brand identity (Night, Signal, the notched A, the wordmark) is fixed by
`docs/brand-core.md` and was preserved. What changed in pass 1 was the register:
from *agency motion showcase* to *a racing team with evidence*. What changed in
pass 6 is the discipline: the accent went from decoration to budget, the two
licensed faces became two variable ones, and the grid moved onto the brand's
own 8% edge.

The vocabulary is the pit wall and the timing tower: tabular numerals, hairline
rules, position markers (P1 / P4), dense-but-calm data rows, and a lot of quiet
space around them. Motion is present and precise; it is never the content.

Named references for the lane: a live timing screen, a race entry list, a stint
sheet. Not: an esports org template, not an editorial magazine, not a SaaS hero.

### What is deliberately absent

Equal card grids. A tiny uppercase kicker above every section. Numbered section
markers. Gradient text. Glass and `backdrop-filter` of any kind. A hero metric
row. Marquee text. Scroll cues. Pinned or scroll-jacked sections. Decorative
status dots. Em dashes. Hover states on rows that are not clickable. Graffiti,
paint splash and scrawled words of any kind (brand core, section 6).

One more rule, added in pass 2: **no layout family twice on a page.** Home runs
nine sections and eight compositions. If a new band would be "narrow heading
column on the left, hairline rows on the right" and something above it already
is, it gets a different shape.

The one place numbers label a sequence is the three-step Join explainer, because
it genuinely is a sequence.

## 2. Colour

Dark only. There is no light mode: the brand is a near-black ground with one
saturated accent, and a light variant would not be the same brand.
`color-scheme: dark` is declared so form controls and scrollbars match.

Strategy on the commitment axis: **restrained**, not committed. That is the
pass-6 change. Signal used to be "the site's colour" and carried labels,
kickers, class chips, driver numbers, table accents, footer tags and icons. The
brand core caps it at 5-10% of any layout and says what it is for, so it now has
exactly five jobs and everything else is Mist or muted.

### Tokens

| Token | Value | Role | Contrast on `--night` |
|---|---|---|---|
| `--night` | `#0a0e0d` | The field, ~80% of every screen | - |
| `--surface-1` | `#131a19` | Tinted bands: next race, the commitments, the join band, the footer | - |
| `--surface-2` | `#1b2422` | Panels sitting on a tinted band | - |
| `--mist` | `#e8f0ee` | Most text and UI | 16.8:1 |
| `--mist-dim` | `rgba(232,240,238,.76)` | Secondary prose: leads, blurbs, bios | 9.8:1 |
| `--muted` | `#93a5a1` | Captions, metadata, field labels, dates | 7.5:1 |
| `--muted-deep` | `#687c78` | Large decorative type, disabled states. **Never body-size text** | 4.4:1 |
| `--signal` | `#0fffcf` | The one thing the eye lands on | 15.0:1 |
| `--signal-ink` | `#0a0e0d` | Text on a Signal fill. The ground, never white | 15.0:1 on `--signal` |
| `--signal-hover` | `#7dffe3` | Solid-button hover, every link hover step | 16.0:1 |
| `--line` | `#26333b` | Hairline rules | - |
| `--line-strong` | `#34443f` | Table head, ghost button border, first row of a data block | - |
| `--night-rgb` | `10 14 13` | `--night` as channels, for the hero scrims | - |
| `--gain` | `#5bd98a` | Data: a position gained | 10.9:1 |
| `--loss` | `#f2766b` | Data: a position lost | 7.0:1 |
| `--caution` | `#e8b84b` | Data: provisional, at risk | 10.5:1 |
| `--info` | `#6fb6e8` | Data: neutral annotation | 8.8:1 |

The pass-5 names are gone: `--bg`, `--bg-raise`, `--bg-panel`, `--ink`,
`--ink-dim`, `--ink-faint`, `--teal`, `--teal-soft`, `--teal-ink`,
`--teal-hover`, `--line-teal`. A token named `--teal` invites a designer to
reach for teal; a token named `--signal` states its job. That is also why the
NOCTURNE migration took its **values** and not its names: NOCTURNE calls them
`bg`, `text` and `accent`, and `--accent` does not tell you it has a budget.

`--surface-3` and `--teal-deep` went with that migration. Both were declared,
redefined in the print block, and read by nothing - `--surface-3`'s job as the
opaque divider step is now `--line-strong`, and no area of Deep Teal was ever
placed on the site. A token nothing uses is a value that drifts.

Where they are used today: `FormLine.astro` (a driver's recent races) and
`StandingsTable.astro` (movement since the last round). Both render movement
as a signed number - `+7`, `-3` - so the sign carries the meaning and the
colour only reinforces it.

**The data colours are not brand colours.** They sit outside the Signal budget
because they are not directing the eye, they are labelling a value. Never
decorative, and never alone: each use pairs with a glyph or a rule, the same
way the results sheet marks a podium with a rule as well as with ink, so the
meaning survives forced colours and reads for a colour-blind visitor.

### The Signal budget

Signal is allowed in exactly five places. Anywhere else on the site is a bug.

1. `.btn-solid` - the **one primary CTA per page** (hero, join band, sticky
   phone bar, and the header button once the bar is the only chrome on screen).
2. `.hero-pos` and `.hero-pos-rule` - the hero position marker and its podium
   rule. This is the pass-4 signature moment, kept.
3. `.nav-link[aria-current='page']::after` - the active-nav underline. The
   label itself is Mist: a second accent on the same element spends the budget
   twice.
4. `:focus-visible` - every focus ring on the site, plus `::selection`.
5. Every `:hover` colour step on a link or a control.

**Measured, not asserted.** `audit-tool/signal6.mjs` counts Signal-coloured
pixels on the full-page and hero captures of every route at 1440 and 390, with
the photographs hidden (`visibility: hidden` preserves layout exactly) so the
number describes the design rather than the teal liveries in the renders. The
worst screen on the site is **5.4%**, against a 10% cap. The table is in
`docs/pass6-report.md`.

What moved off Signal in pass 6: the "Next race" heading, the countdown, the
hero name's second line, the outlined car numbers in three places, the driver
focus label, the results sheet's podium positions, the garage progress
indicator, the join steps' numbers, the 404 code and mark, the footer mark, the
partner-roster numbers, the class chips, the contact card border and the hero
proof rule. All of them are Mist, `--muted` or `--muted-deep` now.

**Which hairline, and when.** `--line-strong` goes above the first row of a data
block: the results head, the roster list, the entry strip, the teaser, the
dossier, the join steps, the commitment register, the channel list, the seat
list. `--line` is everything else: the rule between two rows, the seam between
two sections, the rule that separates two things inside one block. There is no
third weight.

**`--night-rgb` exists because a colour token cannot carry an alpha.** The hero
scrims need the brand ground at several opacities and were eleven hard-coded
`rgba(0, 10, 8, ...)` values across four files. It is deliberately *not*
redefined in the print or forced-colours blocks: every element that uses it is
hidden in both, and a scrim that inverted with the page would paint white over
white.

### Texture

The graffiti texture is gone: `src/assets/hunt-texture.jpg` is deleted and no
component references it. The brand core's replacement is material grain at 3-5%,
implemented as `--grain` in `global.css`: one `feTurbulence` tile inside a
`data:` URI, desaturated, painted by `.grain::before` at **4% opacity** on the
join band and the 404. It costs no request, no raster asset and no layout, and
it is dropped entirely in forced colours and in print.

One measured side effect, recorded because it looks like a regression and is
not: axe reports `color-contrast` as *incomplete* (not a violation) for text on
the two grained sections, because it cannot compute a background behind a
background-image. The real composite shift is under 3/255 of lightness on a
19:1 pair.

## 3. Typography

Two families on a real contrast axis: a condensed grotesk against a neutral
humanist sans. Both variable, both self-hosted, no third family.

| Token | Stack | Used for |
|---|---|---|
| `--font-display` | Archivo, then Arial Narrow, Helvetica Neue, Arial | h1-h4, buttons, nav, labels that sit beside the wordmark |
| `--font-body` | Inter, then the system stack | Body, UI, leads, table cells |
| `--font-data` | `var(--font-body)` | Positions, dates, counts, car numbers - Inter with `tabular-nums` |

- **Archivo** carries the display voice on two axes. `wdth` is the idea: **80%
  (condensed) for h1 and h2**, the headline register; **100% for h3, h4 and
  every subhead-scale label**. `wght` runs 400-800 and the site paints 400 (the
  hero's second line), 600 (subheads and small labels) and 700 (h1, h2,
  buttons).
- **Inter** carries body, UI, tables and numbers, `wght` 400-700, with `tnum`
  kept in the subset and `font-variant-numeric: tabular-nums` on `.data` so a
  column of positions lines up. The `opsz` axis is pinned at 16: nothing here
  needs optical sizing and the axis cost 9 KB.
- **`--font-data` is deliberately the same family as the body.** Pass 5's data
  voice was a monospace; the brand core names Inter for numbers. The token still
  exists so a data rule reads as a data rule, and what separates data from prose
  now is tabular figures, tracking and weight rather than a second family.
- **Semi-bold is the floor for small type on this ground.** `--weight-small:
  600` is applied to `.data`, `.field-label` and every label at `--text-xs` or
  below. Light type on Night reads lighter than it measures, which is the same
  reason the leading went up a step.
- **Measured after the change:** the body paints exactly seven family / weight /
  width combinations - `Archivo 400 100%`, `Archivo 600 100%`, `Archivo 700
  100%`, `Archivo 700 80%`, `Inter 400 100%`, `Inter 600 100%`, `Inter 700 100%`
  - and no fallback face paints any text on any page.
- `.data` and `.field-label` pin `font-stretch: var(--wdth-normal)` explicitly,
  because both are used inside `<h2>` in places (the footer column heads) and
  would otherwise inherit the 80% condensed width into a family that has no
  width axis at all.

### The subset faces

Four files in `public/fonts/`, two per family, split by `unicode-range`:

| File | Bytes | Range |
|---|---|---|
| `archivo-core.latin.v3.woff2` | 35,800 | Basic Latin + the characters the site itself emits |
| `archivo-ext.latin.v3.woff2` | 36,820 | Latin-1 Supplement, Latin Extended-A, combining marks, bot punctuation |
| `inter-core.latin.v3.woff2` | 14,864 | as above |
| `inter-ext.latin.v3.woff2` | 13,992 | as above |

**50,664 B on a first paint** (the two core files, both preloaded) against
48,036 B in pass 5, and 101,476 B on disk. As one file per family it was
94,156 B on every first paint, which cost 0.2 s of LCP and one Lighthouse point
on `/`; the split bought that back. The `ext` pair is not preloaded and is
fetched only when a character in its range is actually rendered, which today is
never.

The character target is byte-for-byte the one pass 5 measured. What decided the
split was a scan of the built HTML: the only characters the site's own copy
emits beyond ASCII are **U+00A0** (the no-break space in the results sheet's
driver separator) and **U+00A9** (the footer copyright), so both are in `core`.
Leaving either in `ext` pulled a 14 KB face on every page for one glyph.

The two ranges are **disjoint on purpose**: where two `@font-face` rules of one
family declare overlapping ranges, the last one defined wins, so an `ext` rule
that still claimed U+00A0 would beat the `core` rule that carries it.

What is in the target, and why that list rather than a shorter one:

- Basic Latin and the whole Latin-1 Supplement.
- The Latin Extended-A letters the pass-5 faces carried: `Ă ı Ł ł Œ œ Š š Ÿ Ž ž`.
  The bot writes driver names straight from Discord, and a sim-racing roster is
  exactly where those letters appear.
- The General Punctuation the site or a bot-written note can emit, plus the
  seven combining marks, so decomposed input still composes.

Two codepoints are in the target and missing from the Inter source: **U+00AD**
(the soft hyphen, which is invisible) and **U+2215** (the division slash, which
the site never renders; `/` is U+002F). Archivo carries both.

**No arrow glyphs are carried.** Every arrow on the site is an inline SVG path
in `Icon.astro`, and the roster's start-to-finish column says "to" rather than
drawing one.

**A replacement face must get a new filename.** `vercel.json` serves `/fonts/*`
with a one-year `immutable` cache, so a browser that has the old file will keep
it. That is what `.v3` is for: re-subset with `font-tool/subset6.mjs`, ship
`.v4`, and change the four `@font-face` rules at the top of `global.css` and the
two preloads in `Base.astro` together.

Both faces are under the SIL Open Font License; `public/fonts/OFL.txt` ships
with them, which section 5 of that licence requires.

## 3b. Logo tiers

Three marks, one job each, from `docs/brand-core.md` section 6. The component is
`src/components/Mark.astro` and the variant names match the brand core's names.

| Tier | Variant | Where | Sizing |
|---|---|---|---|
| **Wordmark** | `wordmark` | Header, footer, `public/og.png` | `--mark-w`, with a `max(100px, ...)` floor so it can never go below the brand core's minimum. 104px on a phone, 132px in the desktop bar, 168px in the footer |
| **Icon** (the notched A) | `icon` | `favicon.svg`, `favicon.ico`, `favicon.png`, `apple-touch-icon.png`, the 404 mark | `--mark-size`, any size |
| **Hero mark** (the profile) | `hero` | Nothing on the website | `--mark-size`, 96px and above only |

**The icon is extracted, not redrawn.** `Mark.astro` pulls the A out of
`WORDMARK_PATH` with a regular expression at build time and throws if it is not
there, and `src/assets/brand/artemis-icon-a.svg` is written from the same
substring by the icon generator. The two marks cannot drift.

**The hero mark has no place on this website, and that is the finding.** The
header and footer are the wordmark's job, everything under 96px is the icon's,
and adding the profile somewhere in order to use it would be decoration. The
variant stays in the component because the OG and social assets are generated
from it.

The pass-5 `lockup` variant (mark + wordmark locked together) is gone: the
brand core's first tier is the wordmark alone.

## 3c. The grid

`--pad-x` is `clamp(1.25rem, 4vw, 3.5rem)` below 1024px and **`8vw` at 1024 and
above**, because the brand core puts the lockup and every content edge at 8%
from the left on every asset.

The hard part is that a centred shell cannot satisfy that. At 1920 a
`max-width: 1400px; margin-inline: auto` box puts its content edge at 16.5% of
the viewport, not 8%. So `.container` and `.nav-inner` are **left-aligned
boxes** - `margin-inline: 0 auto`, `max-width: calc(var(--shell) + 2 *
var(--pad-x))` - and `--shell` rises to 1600px at 1024. The result:

| Viewport | Left edge | Content width | Right gutter |
|---|---|---|---|
| 1024 | 81.9px (8%) | 860px | 81.9px |
| 1440 | 115.2px (8%) | 1210px | 115.2px |
| 1920 | 153.6px (8%) | 1600px | 166.4px |
| 2560 | 204.8px (8%) | 1600px | 755px |

Below 1920 the layout is still symmetric; above it the right gutter grows while
the left edge stays on the brand grid, which is the trade the brand core asks
for. The garage strip, which is full-bleed and cannot use `.container`, derives
the same two numbers from `--pad-x` and `--shell` directly.

### Scale

Fluid `clamp()`, ratio about 1.27, ceiling 5rem (80px) - under the 6rem cap.

| Token | Value | Typical use |
|---|---|---|
| `--text-2xs` | `0.6875rem` | Micro labels, chips, field labels (600 weight, always) |
| `--text-xs` | `0.8125rem` | Nav links, buttons, footer links |
| `--text-sm` | `0.9375rem` | Captions, bios, table body |
| `--text-base` | `1.0625rem` | Body |
| `--text-lg` | `clamp(1.125rem, 1rem + 0.5vw, 1.375rem)` | `.lead` |
| `--text-xl` | `clamp(1.25rem, 1.1rem + 0.8vw, 1.75rem)` | Commitment titles, seat roles, contact email |
| `--text-2xl` | `clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)` | `.display-sm`, roster group heads |
| `--text-3xl` | `min(clamp(1.875rem, 1.4rem + 2.4vw, 3rem), 11vw)` | `.display-md`, section headings |
| `--text-4xl` | `min(clamp(2.375rem, 1.7rem + 3.4vw, 4rem), 13vw)` | `.display-lg`, band headings |
| `--text-5xl` | `min(clamp(2.75rem, 1.95rem + 4.1vw, 5rem), 15vw)` | `.display-xl`, page h1 |

**The micro step is 11px, not 12px.** 12 / 13 / 15 is not a scale - the ratios
are 1.08 and 1.15, and those three sizes carried 408 of about 570 text elements
at 1440. 11 / 13 / 15 is 1.18 and 1.15, and a field label now reads as a
different thing from a nav link. Everything at `--text-2xs` is a tracked
uppercase label, never prose.

**The three display steps carry a `vw` ceiling as well as a `rem` floor.** A
`clamp()` minimum is in `rem`, so at a 200% root font the *floor* doubles while
the column does not: headings painted straight out of their grid cells and
`overflow-x: clip` cut them off with no scrollbar. `min(clamp(...), Nvw)` caps
the step against the viewport without changing anything at 100%.

### Number sizes

| Token | Value | Used for |
|---|---|---|
| `--number-md` | `var(--text-2xl)` | Roster row, entry strip, teaser columns |
| `--number-lg` | `var(--text-4xl)` | The teaser's lead cell only |

Car numbers used to be four hard-coded clamps in three files (36 / 40 / 48 /
60px at 1440) that laddered with nothing. They now move with the headings.

### Leading

| Token | Value | Used for |
|---|---|---|
| `--leading-display` | `1.06` | h1-h4 |
| `--leading-tight` | `1.2` | Field labels, chips, nav, `.data`, single-line display spans |
| `--leading-snug` | `1.4` | Titles inside cells, sub-headings |
| `--leading-body` | `1.65` | Body and all small prose |

All four went up a step in pass 6. Inter has a larger x-height than the face it
replaced, and light type on Night reads lighter than it measures, so the pass-5
numbers would have set the body tighter than it looked.

Before these existed, roughly twenty tracked uppercase labels silently
inherited the body's 1.7, and `.step-title` led looser than the sentence under
it. Prose leading was spread across 1.4 / 1.5 / 1.55 / 1.6 / 1.7 for one job.

### Tracking

| Token | Value | Used for |
|---|---|---|
| `--track-display` | `-0.005em` | h1-h4 |
| `--track-title` | `0.02em` | Uppercase component titles at body size |
| `--track-link` | `0.08em` | Uppercase micro-caps: interactive labels and chips |
| `--track-label` | `0.14em` | Field labels and tracked meta |
| `--track-data` | `0.01em` | Tabular data |

Every value came down in pass 6. Archivo and Inter are both wider-set than the
faces they replaced, so the pass-5 tracks over-opened the same labels.
`--track-lockup` is gone: the hero's two lines separate on Archivo's width
axis now, not on a bespoke tracking step.

No component declares a literal `em` tracking value. There used to be ten of
them across 28 declarations, which gave five identical 13px uppercase link
styles five different tracks.

Display tracking never goes below -0.04em. Headings are uppercase with
`text-wrap: balance`; prose uses `text-wrap: pretty`.

### Measure

`--measure: 66ch` for body prose, `--measure-lead: 52ch` for **every** `.lead`
on the site. There used to be five different caps for that one element,
spanning 39-54ch, three of them under the 45ch comfort floor.

Headings are capped in `em`, never `ch`. `ch` is the advance of `0`; condensed
uppercase Archivo is a different width per character again, so a "14ch" cap was
never comparable with the next one.

**Overflow rule:** every headline was tested at 390px, and again at 390px with
a 200% root font. The longest single word on the site (`PARTNERS`, `ESPORTS`,
`SCOREBOARD`) fits at the floor with the `1.25rem` gutter. Any new headline must
be checked at both.

**Unbreakable tokens.** `overflow-wrap: anywhere` is on h1-h4 globally and on
every name-shaped span the bot can write: `.event-name`, `.driver-name` (both
variants), `.driver-focus`, `.also-name`, `.slide-car`, `.entry-name`,
`.partner-name`, `.field-label`, `.roster-name`, `.seat-role`. The one
exception is `.hero-title`, which is the lockup and must never break mid-word.

## 4. Space, shape, layers

Spacing is one fluid ramp; sections vary their padding deliberately rather than
repeating one rhythm.

`--space-3xs .25rem` · `--space-2xs .5rem` · `--space-xs .75rem` · `--space-s 1rem` ·
`--space-m 1.5rem` · `--space-l 2.5rem` · `--space-xl 4rem` ·
`--space-2xl clamp(4rem, 2.5rem + 5vw, 7rem)` ·
`--space-3xl clamp(5.5rem, 3.5rem + 7vw, 9.5rem)`

**The top two steps are keyed to width, not height.** They used to be `9vh` and
`13vh`, which meant the site's entire section rhythm was set by window height
and had no relationship to layout width: a 1024x768 laptop got 69px of section
padding (the tightest on the site) while a 768x1024 tablet got 92px, and two
people on identical 1440-wide monitors got different rhythm if one had a
shorter window. Width-keyed they compute 64 / 78 / 91 / 112px across
390 / 768 / 1024 / 1440 - monotonic, and the step above `--space-xl` grows
from 1.0x to 1.75x instead of collapsing to 1.08x on the widest layout.

Layout: `--shell: 1400px`, `--pad-x: clamp(1.25rem, 4vw, 3.5rem)`, `--measure: 66ch`.
Breakpoints designed at 390 / 768 / 1024 / 1440; the real switches are 820px
(nav), 900px (layout), 1101px (the page-head split) and two band rules at
761-1200 (roster row) and 621-860 (results sheet). Full-height uses `100dvh`,
never `100vh`.

**`--nav-h` is `clamp(64px, 4rem, 88px)`** (72 / 4.5rem / 96 above 821px). The
`rem` term is what lets the bar grow with the reader's text size; the `px`
floor and ceiling keep it sane at both ends. It has to contain a 44px CTA at
100% and a 62px one at 200%.

**Safe areas.** The viewport meta carries `viewport-fit=cover`, without which
every `env(safe-area-inset-*)` on the site resolves to 0. The footer pays for
the bottom inset, `.container` for the left and right ones (landscape on a
notched phone), and the mobile menu for the bottom one.

**Shape: `--radius: 0`.** Everything is square - buttons, frames, chips, panels,
the mobile menu. This is a commitment, not an oversight: the whole language is
hairlines and rectangles, and a rounded corner anywhere would read as a mistake.

**Z-index scale** (semantic, no arbitrary values):
`--z-base 0` → `--z-raised 1` → `--z-sticky 50` → `--z-nav 100` → `--z-menu 110` →
`--z-skip 200`. The old dead `--z-menu` token is now used by the mobile menu.

## 5. Motion

**One easing family, three durations.** Nothing is exempt, including the
entrance. Before pass 4 there were five duration tokens and three curves, which
gave the same gesture four answers: a press at 120ms beside a press at 240ms, a
hover eased on one curve with its own underline on another, three properties of
one hover running on three clocks.

| Token | Value | Used for |
|---|---|---|
| `--dur-1` | `120ms` | Press: `scale(0.97)` on a control, an opacity step on a text link, the menu-icon cross-fade |
| `--dur-2` | `200ms` | State: hover and focus colours, the nav underline, the sticky-bar cross-fade, the mobile panel, the podium rule |
| `--dur-3` | `320ms` | Travel: the scroll reveal, the entrance rise, the hero photo's scale settle |
| `--ease-out-expo` | `cubic-bezier(.16, 1, .3, 1)` | Anything arriving or leaving: entrances, reveals, the bar, the panel |
| `--ease-out-quart` | `cubic-bezier(.25, 1, .5, 1)` | Hovers and presses, where the travel is a few pixels and a long tail reads as lag |
| `--press-scale` | `0.97` | Every control on the site. One value, one gesture |

No bounce, no elastic, no `ease-in`, no `transition: all`. Only `transform`,
`opacity`, `clip-path` and colour are animated.

**The vocabulary, and why each one exists:**

| Move | Where | Why it earns its place |
|---|---|---|
| **Position marker count + podium rule** | Hero `P41 → P2` over 420ms, then a 2px rule drawn left to right in 200ms | **The signature moment.** It animates the evidence rather than the logo, it is the one device only this site could do, and it happens once, on one element, on one page |
| Masked line rise | Hero h1, two lines, 70ms apart | Sets the pace of the page once, at the only moment there is nothing to read yet. This is the house entrance, not the signature |
| 16px rise, no fade | Hero lead, proof, actions, page h1, the 404 | Sequences the first screen so the eye lands on the headline first, at no cost to legibility |
| Photo 1.04 scale settle | Hero image | Keeps the photo from snapping in under the text. No opacity: see §8 on the LCP |
| Scroll parallax, 5% travel | Hero image | Depth between the copy plane and the photo plane; CSS scroll-driven, no JS |
| Reveal (12px rise, no fade) | Sibling lists below the fold, including the six results rows at 45ms apart | A timing tower filling row by row is the one entrance that is *about* what it reveals |
| Underline scale-x | Nav links: current page, hover **and focus** | Feedback, and it marks the current page without relying on colour alone |
| `scale(--press-scale)` | Every button, the garage arrows, the hamburger, on `:active` | The interface confirms it heard the press |
| `opacity: 0.65` | Every text link on `:active` | Same confirmation, without re-flowing words under the finger |
| 3px arrow nudge | Every arrow-carrying link; diagonal on the ones that open a tab | The glyph leaves in the direction it points |
| Cross-fade, 200ms | The mobile panel *and* the bar above it, on one clock | They are one surface arriving, not two |
| Snap-position `scrollTo` | Garage arrows | Shows the carousel moved, and moves it to the next slide's own stop |

**Rules that hold everywhere:**

- **Nothing is ever animated from `opacity: 0`.** As of pass 4 this is true of
  `[data-enter]` as well: `enter-up` is a 16px transform and nothing else, so the
  hero copy, the CTAs and every inner page's `<h1>` are at full ink on the first
  frame. Reveals move 12px and nothing else. A paused tab, a headless renderer or
  an observer that never fires can only cost the reader an offset. Reveal and
  entrance styles are gated behind `html.js`, so with JS off every element renders
  at its final state, and a 1.5s timer settles anything the observer missed.
  - **The one exception, and why it is one.** The two hero lockup lines rise out
    of an `overflow: hidden` mask, so they are clipped at t=0. That is a clip
    reveal and not a fade - the type is at full ink throughout - it clears in
    320ms / 390ms, and the same two words are painted in the header lockup from
    frame one. A partial mask was tried and rejected: at any travel small enough
    to be legible at t=0 it cuts the bottom bar off the uppercase and "ESPORTS"
    reads as "FSPORTS".
- **The signature moment is safe by construction.** The finished position is what
  is in the markup; the script borrows the number, counts to it and hands it back.
  The counting glyph is `aria-hidden` with the real value beside it as text, the
  field is reserved at the width of the largest number that can appear in it (so
  counting cannot shift a pixel), and the count is skipped entirely under reduced
  motion, on a hidden tab, with no field size in the record, or when the module
  runs later than the CSS clock it is in step with. The podium rule is a CSS
  animation with `both`, so its finished state is reached whether or not the
  module runs at all.
- `prefers-reduced-motion: reduce` collapses all of it: animations are cut to 1ms,
  reveals lose their transition, the parallax is not attached at all, the garage
  arrows scroll instantly, the marker does not count, and the transition property
  **and duration** lists are clamped together so no transform-based hover survives
  and no duration lands on the wrong property. Reduced motion is gentler, not
  zero: colour and opacity still ease.
- **Nothing on a keyboard-initiated path animates.** The skip link has no
  transition; it arrives on the first frame of the first Tab.
- **Hover, press and focus are one table, not one state.** Every interactive
  family has all three, and the focus state carries the same affordance the mouse
  gets - the nav underline included. Hover is gated behind `@media (hover: hover)
  and (pointer: fine)`; focus never is.
- **No hover effect promises a click that does not exist.** The results rows have
  no row hover, and as of pass 4 neither the garage slides nor the About collage
  have a hover zoom: they are captioned figures, not links.
- No `window` scroll listener anywhere. Sticky nav state comes from an
  IntersectionObserver on a **64px** sentinel (1px made it a hair trigger on a
  200ms cross-fade: the bar flipped at two pixels of scroll and back); the garage
  progress bar listens to the *track element's* own scroll, passively, coalesced
  into one `requestAnimationFrame`, and writes its width only when the width
  actually changes.

**Removed in pass 2:** Lenis smooth scroll, the pinned four-panel pillar stack,
the scroll-driven horizontal garage pan, the word-by-word mission brightening, the
magnetic buttons, the looping "On the hunt" marquee, and GSAP itself. Client JS
went from 133 KB to about 4 KB.

## 6. Components

`src/components/`

| Component | What it is | Notes |
|---|---|---|
| `Mark.astro` | The three logo tiers as inline SVG: `wordmark`, `icon`, `hero` | `fill="currentColor"`; the wordmark is sized by width (`--mark-w`, floor 100px), the other two by height (`--mark-size`). The icon path is extracted from the wordmark path at build time, so the two marks cannot drift. See §3b |
| `Icon.astro` | The only icon set: arrow-right, arrow-left, arrow-up-right, menu, close | One stroke weight (1.5), square caps, mitred joins |
| `Nav.astro` | Fixed header, wordmark, four links, one CTA | Ghost CTA over the hero, solid and fully opaque once scrolled; a compact CTA with a short label sits in the bar at phone widths and is the only item allowed to shrink; mobile panel with `aria-expanded`, Escape-to-close, a focus trap, `inert` behind it, a `position: fixed` body scroll lock and `overscroll-behavior: contain` |
| `Footer.astro` | Wordmark, the promise, contact, pages, channels | Three equal columns, channels flush right. Social links are typographic labels, not hand-drawn brand glyphs |
| `Hero.astro` | Diagonal split, headline, lead, proof row, two actions | Takes the `getImage()` result so the same URL can be preloaded. The proof row prints field size when the record has it |
| `NextRace.astro` | One thin data strip plus the rest of the calendar | Static date always renders; the countdown is JS-only and its line is pre-reserved. Falls back to "No race scheduled" with the last completed event |
| `ResultsTable.astro` | The timing sheet | Real `<table>` with explicit ARIA roles so semantics survive the mobile `display: block`. Position, field size, series, class, drivers, date |
| `Garage.astro` + `GarageSlide.astro` | Native scroll-snap filmstrip | Five fixed slots; the scrollable region is a wrapping `<section aria-label>` (which *is* `role="region"`) so the `<ul>` keeps its list role; the `<Image>` stays in `Garage.astro` (see §8). The arrows step to the next slide's own snap offset, derived from the first slide rather than from a computed `scroll-padding` that Chrome hands back unresolved |
| `DriverCard.astro` | `compact` column or `row` roster entry | Stats and socials render only when present; the row prints the driver's latest finish, derived from `results.json`. When `stats.json` has an entry, `compact` adds the iRating alone and `row` adds iRating, licence and a four-column table of the three newest official races. No entry means no label, not an empty one |
| `PillarBand.astro` | The three commitments, `row` or `long` | Each one is a title, the commitment and the test anyone can run against it. `row` is a three-across band (home) with the tests sharing a baseline via `margin-top: auto`; `long` is one entry per row (about). Three across rather than four is also why no title reserve is needed any more |
| `PartnerBand.astro` | `row` (logo-led register) or `stack` (dossier entries) | Never renders an empty logo row: with no partners it collapses to one column with the heading, an honest sentence and the mailto. `row` sits on `--bg` so it does not merge with the tinted pillar band above it |
| `JoinCta.astro` | Discord CTA on a grained band | Full-width heading, lead, button, then the three steps across the band. The default heading is the motto, which is the one place on the site it appears. `intent` picks the wording of the same Discord action: `join` everywhere, `apply` on `/join` |
| `AudienceRouter.astro` | Three plain links under the next-race strip | "Follow the team", "Race for us", "Partner with us", one line each. Hairlines, no cards, no icons: it is a router, and the moment it grows a box it competes with the Scoreboard below it |
| `StickyCta.astro` | The phone-only action bar | 55px plus a hairline, `env(safe-area-inset-bottom)`, `position: fixed` from the first frame so it can never move the document. Shown once the first screen has scrolled away, hidden again at the footer and while the menu is open; the compact header CTA hides while it is up, so one Signal button is on screen at a time |
| `PageHead.astro` | h1, lead, meta, optional `action` and `aside` slots | Shared by team / join / about / partners; the aside is what stops the first screen being half empty. The split starts at 1101px, not 901px, because below that the copy column cannot carry the `display-xl` step; it renders the aside slot first and tests the result, so a slot whose content is conditional on data collapses instead of reserving a column |

Shared classes in `global.css`: `.container`, `.section`, `.section-tall`,
`.rule-top`, `.section-head` (+ `.section-head-stack`), `.roster-teaser`, `.btn`
(`.btn-solid`, `.btn-ghost`, `.btn-sm`), `.text-link`, `.lead`, `.data`,
`.field-label`, `.display-*`, `.reveal`, `.skip-link`, `.sr-only`.

### Words

The copy rules, written down because "polish" on a site this small is mostly
this. Plain, specific, sentence case for anything that is a sentence. No
exclamation marks. No em dashes. No "elevate", "seamless", "unleash", "next-gen".

- **The promise is everywhere, the motto is once.** *Every shot on the record.*
  is `site.tagline`: the footer, every `og:image:alt`, the JSON-LD slogan.
  *Take the shot.* appears exactly once, as the heading of the home join band.
- **Words the site never uses**, because the brand core's don't-say column
  bans them: "silence", "built in silence", "quiet", "precision", "noise",
  "called by the hunt", "results speak louder", "on the hunt", and every
  hashtag. `site.hashtags` is an empty array and the footer tag line is gone.
  There is also **no sentence anywhere about our own restraint** - not "we keep
  the list short", not "we would rather do a small number properly", not "the
  roster stays small on purpose". Describing your own quietness is the one
  thing the voice section forbids outright.
- **Headings.** A heading that speaks takes a full stop; a heading that names
  something does not. "Take the shot.", "Race with us.", "Race for us.",
  "How to join.", "How to apply.", "Talk to us.", "Partner with Artemis.",
  "Off track." all carry one. "The crew", "About Artemis", "The Scoreboard",
  "Recent results", "Next race", "The garage", "Who drives", "Open seats",
  "What a season asks of you", "Who backs us", "Where this came from",
  "What we stand for", "Current partners" do not.
- **Field labels** are sentence case, always: "Best finish", "Results listed",
  "First iRacing season", "Who runs these entries". The uppercase is a
  `text-transform`, not the text. That matters because the same strings are read
  aloud.
- **One label per intent, per audience.** `src/lib/links.ts` holds three:
  **"Join the Discord"** is the driver action on every page but `/join`,
  **"Apply in the Discord"** is the same address worded for the one page where
  the reader has already decided, and **"Partner with us"** is the partnership
  mailto on `/partners`. The address is written once for each.
  The Scoreboard is named the same way wherever it is linked: a text link says
  **"The Scoreboard"**, a button says **"See the Scoreboard"**, the nav says
  **"Scoreboard"**. Pass 5's "See results" / "All results" pair is gone - there
  is one name for the destination now.
- **One spelling per channel.** `socialLabel()` in `src/lib/links.ts` is the
  only place a social network is named, so the footer, `/partners` and a
  driver's own link all say "YouTube" rather than one of them saying "youtube".
- **Dates** are `06 SEP 2026` and ranges are `25 - 27 SEP 2026`, everywhere,
  from `src/lib/format.ts`. Fixed three-letter months, uppercase, zero-padded
  day: `Intl` gives "Sept" in some builds and that breaks the column.
- **Arrows.** A text link that leaves the site carries the up-right glyph; a
  text link that stays carries the right glyph; a link whose content is a logo
  carries neither, because the mark is the label. All six arrow-carrying
  families nudge 3px on the same clock (see §5).
- **The empty states are wording too.** "No race scheduled" in the "Next race"
  strip is pinned: `docs/data-contract.md` quotes it as the site's behaviour and
  the Discord bot is written against that document, so it changes on both sides
  or on neither. The countdown's zero state is ours, and it depends on what the
  record knows. With a `startTime` the target **is** the green flag, so zero
  means **"Under way"**. Without one the target is midnight in the team's
  timezone, so it says **"Race day"** on the start date and "Under way" only
  once that date has passed: "Under way" at six in the morning would be a claim
  the clock cannot support.
- **The green-flag time is UTC in the markup and local on screen.** The strip
  prints `15:15 UTC`, which is true with no clock and no JavaScript; the client
  rewrites it in the reader's own zone with the zone's short name, and adds the
  local date whenever the conversion lands on a different day from the one the
  strip is showing. A reader in Auckland would otherwise see "25 SEP" beside an
  03:15 that is really the 26th.
- **Seats are a real empty state.** `/join` says "No seats open right now" and
  offers the Discord anyway, because that is what is true between recruitment
  rounds. The page never invents a seat to fill the section.

## 7. Accessibility

- Skip link to `#main`; `<main>`, `<header>`, `<footer>`, `<nav>` landmarks.
- Visible focus: a `2px` Signal outline at `3px` offset on everything focusable. Measured: 174 tab stops across the six pages, 0 without a ring, 0 without an accessible name, 0 off screen when reached.
- `aria-current="page"` in the desktop nav, the mobile panel **and the footer**,
  reinforced by an underline so it does not rely on colour alone. One `isCurrent`
  in `src/lib/links.ts` serves all three, which is what finally gives the home
  page a marker: the primary nav's first entry is an anchor *into* home rather
  than a link to it, and the footer's list does contain `/`. An href carrying a
  fragment is never "the current page".
- **The results table keeps its column headers at every width.** Below 860px the
  sheet stacks, and the header row used to be `display: none`, which deletes the
  node from the accessibility tree rather than only from the screen - measured,
  the whole `thead` collapsed to six ignored nodes and three of the five columns
  had no name at all. It is clipped now (`position: absolute` + `clip-path:
  inset(50%)`), and the five `columnheader` nodes are present at 390, 768 and
  1440. The `data-label` prefixes are scoped to `td` so they do not prefix the
  headers themselves.
- **Print is a real mode.** Browsers drop background colours and keep text
  colour, so a dark site prints near-white ink on white paper. One `@media print`
  block inverts the token set (Signal becomes `#046b58`, 4.9:1 on white), drops
  the fixed header, the skip link, the hero photo, the grain, the sticky phone
  bar and the controls nobody can press, and prints the destination after every
  external link.
- **`.driver-number` will keep failing automated contrast checks, and it is
  fine.** It is `color: transparent` with `-webkit-text-stroke`, so every tool
  reads 1:1 and defers. As rendered it is a 7.9:1 `--muted` hairline at 36-64px,
  the element is `aria-hidden`, and the number is printed again as plain text in
  `.driver-meta`. Do not "fix" it.
- **axe reports `color-contrast` as *incomplete* on the grained sections and
  over the hero photo, and those are not violations.** axe cannot compute a
  background behind a `background-image`, so it defers rather than judging. The
  grain shifts the composite by under 3/255 of lightness on a 19:1 pair, and the
  hero copy sits on a scrim that takes the photo to near-solid Night. Zero
  violations at level A and AA on all six pages at 1440 and 390, and on the
  mobile menu with the panel open.
- **`html-validate` reports ~72 `no-redundant-role` errors and they are not
  errors.** The explicit `role="table|rowgroup|row|columnheader|cell"` on
  `ResultsTable` is the entire mechanism keeping the stacked mobile layout
  announced as a table. If the repo ever adopts html-validate in CI, turn the
  rule off for that file rather than removing the attributes.
- Mobile menu: `aria-expanded`, `aria-controls`, Escape closes and returns focus,
  the page behind it cannot scroll, and it closes itself on resize to desktop.
- The garage track is `tabindex="0"` with `role="region"` and a label, so it can be
  scrolled from the keyboard; the arrow buttons have visually hidden names.
- Every meaningful image has descriptive alt text. The only decorative images are
  the 404 mark. The join band's texture is gone entirely: the grain is a CSS
  pseudo-element, so there is no node for a reader to reach.
- The results table keeps `role="table"` / `rowgroup` / `row` / `cell` /
  `columnheader` so the mobile stacked layout is still announced as a table, and
  carries a visually hidden `<caption>`.
- Body text is 4.5:1 or better everywhere (see §2); large display text is far above.
- **Touch targets are 44px on every interactive element**, including the ones
  that look like text: footer links, channel links, the 404 page list, driver
  socials, `.text-link`, both email links, the brand lockup and the compact
  header CTA. The height goes on the control, not on the list gap, so the
  visual rhythm is unchanged. Where the underline has to stay on the word (the
  driver socials), the height lives on the anchor and the rule on a span
  inside it.
- **200% text.** All five pages hold a 390px layout viewport at a 200% root
  font: no page forces the mobile shrink-to-fit, the hamburger stays 44px and
  clickable, and the menu panel scrolls with `overscroll-behavior: contain`.
  Buttons are not `white-space: nowrap` (an unshrinkable label is what broke
  this), and the button's inline padding is capped in `vw` as well as `rem`.
- **`prefers-contrast: more`** raises five tokens (`--mist-dim`, `--muted`,
  `--muted-deep`, `--line`, `--line-strong`) and, because nothing hardcodes
  those colours, that lifts every hairline and every quiet step on the site at
  once.
- **`forced-colors: active`** is handled as a first-class mode, not an
  afterthought. Windows High Contrast strips every `background-image`, which on
  this site means every legibility scrim and the grain, so the hero photo and
  the grain are hidden rather than left under unscrimmed copy. The primary button
  takes `Highlight` / `HighlightText` with `forced-color-adjust: none` so it
  cannot collapse into the ghost button. The current-page indicator becomes an
  underline (a background-filled pseudo-element is forced to Canvas and
  vanishes). A podium position carries a 2px rule as well as the teal. The
  white-on-transparent partner mark sits on an opaque plate so it survives a
  Canvas-white ground.

## 8. Performance notes worth remembering

- **The 72 MB build.** The old build shipped every full-size original into
  `dist/_astro` next to the webp derivatives. The cause is that `<Image src={...}>`
  only drops the original when `src` is a **bare imported identifier**. A glob, a
  lookup (`map[car.image]`), a spread, or a re-export through a `.ts` module all
  make Vite keep the asset URL live and emit the original. `Garage.astro` therefore
  imports its six photos statically and passes each one to `<Image>` directly,
  with `GarageSlide.astro` taking the image through a `<slot>`. Keep it that way.
- Source images are capped at the largest width the layout can request, so the
  "native width" derivative is never larger than the top `srcset` entry.
- **`sizes` describes one element, so one string cannot serve three shapes.**
  The garage has a `sizes` per slide shape (portrait / standard / wide), each
  bracketed on both sides: a `vw` term for the band where the frame is
  `24vw`-derived, and a fixed px value above 1467px where `--frame-h` caps at
  `22rem` and the slide stops growing. The About collage has one per frame,
  using the fractions the frames actually occupy (38 / 23 / 27vw), also capped
  above 1512px where `--shell` caps. A single "46vw" string had a 275px
  portrait slide downloading a 1024w / 69.7 KB file.
- **A transform counts.** Below 900px the hero image is painted at 130% of its
  layout box (`--media-zoom: 1.3`), so its `sizes` is `130vw`, not `100vw`, and
  the `imagesizes` on the `<link rel="preload">` in `index.astro` must match
  Hero.astro exactly. The ladder gained a 1024 step because a 412px phone then
  asks for ~940px and would otherwise jump to 1280.
- Measured against the bytes actually downloaded, at 10 viewports x 5 pages,
  **nothing over-fetches**: zero derivatives more than 1.6x the pixels the
  element needs. The eleven remaining "upscale" rows are source-bound and
  deliberate - the HUNT texture is a decorative 1920px spray at 0.55 opacity
  behind a gradient, and the Nordschleife render is the 1089px crop from
  pass 2.
- Astro's scoped styles do **not** reach a child component's root element. Sizing
  that has to cross a component boundary goes through an inherited custom property
  (`--mark-size`), and the `<img>` rendered by `<Image>` needs `:global(img)`.
- **The minifier folds `animation` longhands into the shorthand.**
  `animation-timeline` is not a component of that shorthand, so a browser rejects
  the whole declaration and the effect silently dies in `dist/` while still
  working in `astro dev`. Anything using a scroll-driven timeline is written as
  longhands, and verified against the built file, never the dev server.
- **Stylesheets are inlined** (`build.inlineStylesheets: 'always'`). The whole CSS
  budget is about 7 KB gzipped; three render-blocking round trips cost more than
  the bytes. Measured with Lighthouse, 33-44% of what is inlined is never matched
  during load - but most of that is state CSS that has to ship (`forced-colors`,
  `prefers-contrast`, `@media print`, the =<820px menu, `.is-stuck`, every
  `:hover` and `:focus-visible` block). The genuinely dead part is ~2-4 KB
  gzipped per route. Recorded here so a future pass does not re-litigate it: the
  recommendation is to leave it.
- **The LCP element is not always the hero image.** Traced directly with a
  `PerformanceObserver`: unthrottled at 1350px it is the `<img>` at ~180ms; on a
  throttled phone profile it is `p.hero-lead` on `/` and `p.lead` on `/team`,
  because the photograph is still arriving. Either way it is not the bottleneck -
  the image is preloaded, `fetchpriority="high"` and 31 KB. What *was* the
  bottleneck is fixed: with the entrance faded from `opacity: 0` the LCP text
  arrived 680ms after it could have, and the measured FCP -> LCP gap on `/team`
  is now **0ms** over brotli and 144ms uncompressed.
- **Compression is the difference between 98 and 99.** The local audit server
  sends the documents uncompressed, and the home document is 108 KB raw against
  17.8 KB brotli. Lighthouse's simulator weights the render-blocking document at
  the throttled bandwidth, so the uncompressed harness reports Perf 98 on `/`
  while the same build served the way `vercel.json` serves it reports 99. Measure
  against `audit-tool/server-vercel.mjs`, not `audit-tool/server.mjs`, when the
  number is the point.
- **The fonts are subsets, and that is where the last real win was.** 78.6 KB of
  woff2 became 48.0 KB with no visible change: ten full-page renders at 1440 and
  390 came back pixel-identical to the previous build except for the countdown's
  own digits. Nearly all of it is the mono's code-editor ligature tables, which a
  results sheet had no use for. See §3 for what is in the subset and for the rule
  that a replacement face needs a new filename.
- **`jetbrains-mono-700` is preloaded per page, not everywhere.** It sets
  above-the-fold text on `/`, `/team` and the 404 (the position marker and the
  roster numbers) and below the fold on `/about` and `/partners`, where a fourth
  font preload only competes with the LCP image. `Base.astro` takes a `monoBold`
  prop. Pass 2's note that "its first use `.pos` is below the fold" was out of
  date the moment the hero gained a position marker.
- **Never read layout before first paint.** Measuring every `.reveal` on load, or
  the garage track's `scrollWidth`, forced a full layout of a 5,000px page ahead
  of the first frame and was the largest single main-thread cost on the home page.
  The garage measures inside `requestAnimationFrame`; the reveals measure nothing.

## 9. Decision log

### Pass 6, 14 Sep 2026

Brand-core alignment, then the retention features. The full report is
`docs/pass6-report.md`; these are the decisions a future pass would otherwise
have to re-derive.

1. **Signal became a budget, not a colour.** Fifteen resting-state uses were
   moved to Mist, `--muted` or `--muted-deep` and five jobs were kept. The
   colour tokens were renamed at the same time, on purpose: `--teal` invited a
   designer to reach for teal, `--signal` states its job. The worst screen on
   the site measures 5.4% against a 10% cap.
2. **Nexa and JetBrains Mono out, Archivo and Inter in.** Two variable families
   replace four static faces, and the data voice stopped being a second family:
   what separates a number from prose now is tabular figures, tracking and
   weight. See §3 for what that cost and how the `unicode-range` split bought
   it back.
3. **The `unicode-range` split is the reason `/` is still a Lighthouse 100.**
   One file per family was 94,156 B on every first paint and measured 99 with an
   LCP of 2.0 s. Preloading only Inter was tried and was worse (FCP 0.8 s to
   1.2 s, plus a 0.002 CLS on three routes, because the h1 then swapped). The
   split ships 50,664 B and measures 100 with an LCP of 1.7 s, better than pass
   5's 1.8 s.
4. **The container is left-aligned above 1024px.** A centred shell cannot put a
   content edge at 8% of a 1920px viewport; the brand grid wins over symmetry
   above 1920, and the numbers are in §3c.
5. **The hero mark is not on the website.** Recorded as a finding rather than a
   gap: see §3b.
6. **The h1 on the home page still says the org's name, under the header
   wordmark that also says it.** This is the one pass-6 decision made against
   instinct. Pass 2 filed it (B3) and pass 5 deferred it; pass 6 kept it because
   the brand core asks for "wordmark-adjacent labels" in the condensed width,
   which is what that heading is, and because replacing an `<h1>` on the home
   page is a bigger call than a brand-alignment pass should make on its own. The
   two lines now separate on Archivo's width axis rather than on a colour, which
   is the most that could be done without making the call.
7. **The results section is "The Scoreboard" and the anchor moved** from
   `#results` to `#scoreboard`. `vercel.json`'s `/results` redirect follows it.
   A bare `/#results` fragment cannot be redirected server-side and will now
   land at the top of the home page, which is acceptable for a branch that has
   not shipped.
8. **The sticky phone bar and the compact header CTA are mutually exclusive.**
   Two Signal-filled buttons in one 390px viewport measured 8.1% of the screen
   for one intent. Hiding the header copy while the bar is up costs no layout,
   because the hamburger is already flush right and the wordmark flush left.

Newest first. Only decisions that changed the system, not every edit.

### Pass 5, 14 Sep 2026

**The fonts are subsets now, and the mono lost its ligature tables.** 78.6 KB to
48.0 KB across the four faces, which is about 30 KB off a first view. Most of it
is `calt` and `frac` in JetBrains Mono: 151 glyphs of code-editor ligatures and
automatic fractions that a timing sheet has no use for, and that would have
turned `->` in a bot-written note into an arrow. What was *not* dropped is the
Latin Extended-A the originals carried: `Ł ł Š š Ž ž Œ œ Ÿ ı Ă` are exactly the
letters a real sim-racing roster contains, and saving a kilobyte is not worth one
fallback letter in the middle of a display-size name. Because `/fonts/*` is
served `immutable` for a year, the files carry new names (`.latin.v2`) and the
`@font-face` block and the preloads changed with them.

**The column headers of the results sheet were being styled by the body-cell
rules.** `.col-driver` and `.col-date` sit on the `<th>` as well as the `<td>`,
and an Astro-scoped class out-specifies `.field-label` in `global.css`, so
"Drivers" rendered as 15px body type and "Date" at the wrong tracking beside
three 11px tracked mono labels. Both are scoped to `td` now. This is the same
cascade trap pass 3 documented for `--compact-inset`, in a third place.

**Eight mono rules were asking for a weight that does not exist.** The body is
300 and the site ships two mono faces, 400 and 700, so every rule that set
`font-family: var(--font-mono)` and no weight inherited 300; browsers quietly
substituted 400 and it looked correct. Every mono rule declares its weight now,
and the site paints exactly the four family/weight pairs it loads.

**The scrims are tokens.** Eleven `rgba(0, 10, 8, ...)` literals across four
components became `rgb(var(--bg-rgb) / ...)`. A colour token cannot carry an
alpha, which is why they were literals; a channel token can.

**The four-across value register lines up.** One of the four titles wraps at
1440 ("Precision over flash" in a 320px cell), so the four sentences under them
started at three different heights with full-height hairlines between them
making it obvious. Two lines are reserved for the title in the four-across band
only; below 1025px the band is two across, the pairs wrap together, and nothing
is reserved.

**The countdown's zero state stopped over-claiming.** The contract carries dates
and not times, so the target is midnight in the team's timezone. "Under way" at
six in the morning on race day was a claim the clock could not support. It says
"Race day" on the start date and "Under way" only once that date has passed.

### Pass 4, 14 Sep 2026

**The site got a signature moment, and it is not the wordmark.** The masked
two-line lockup rise is the most-reproduced "designed hero" of the last five
years; drop a law firm's name into it and it is unchanged. It is also used on
three of five pages, which makes it a grammar rather than a signature. The
device that is genuinely only this site's is the **P-marker**: `P2 / of 41` on a
teal rule. It now arrives the way a result arrives on a timing tower - counting
down from the field size to the finish over 420ms with an exponential ease-out,
then the podium rule drawing left to right underneath in 200ms, built from the
same `scaleX` primitive as the nav underline. It animates the evidence, not the
logo; it is the one thing on the first screen a sponsor doing a 60-second check
is looking for; and it happens once per load on one element on one page. The
masked rise stays as the house entrance. **This is the only signature moment.
Nothing else gets new decorative motion.**

**The entrance stopped lying about the invariant.** §5 has said "nothing is ever
animated from `opacity: 0`" since pass 2, and it was true of `.reveal` and of
`[data-enter-media]` and false of `[data-enter]`. Frozen at document-timeline
t=0 the home first screen was a photograph and nothing else - no headline, no
claim, no proof row, no CTAs - and `/team`, `/about` and `/partners` shipped an
invisible `<h1>`. It cost real LCP: Lighthouse named `p.lead` as the largest
paint on `/team`, arriving exactly `120ms + 560ms` late. `enter-up` is now a
16px transform and nothing else. Measured at t=0: every `[data-enter]` element
at opacity 1, both headline lines mid-mask, and the FCP -> LCP gap on `/team`
down to 0ms over brotli.

**Five duration tokens and three curves became three and two.** A system that
offers four answers to "how long is a press" is not a system. `--dur-1 / -2 / -3`
(120 / 200 / 320) and `--ease-out-expo` for arrivals, `--ease-out-quart` for
hovers. The entrance is not exempt: it settles at 520ms instead of 840ms.
`--press-scale: 0.97` replaced a `0.97` on buttons and a `0.94` on the garage
arrows - two scales for one gesture.

**Press and focus are states, not afterthoughts.** Eight of ten pressable
families acknowledged nothing at all, and the nav underline - the affordance that
says "this one" - was behind `@media (hover: hover)`, so a keyboard user got the
ring and never the mark. Every family now has hover, press and focus, and the
focus state carries the same affordance the mouse gets. Controls scale; text
links take an opacity step, because a scaling text link re-flows words under the
finger.

**The mobile menu and the bar move together.** The full-screen panel snapped in
0ms while the header above it cross-faded for 240ms, so for a quarter of a second
they were different colours with hero foliage showing between them. The panel's
closed state is now `visibility: hidden` rather than `display: none` - which is
what lets it transition at all while still leaving the accessibility tree and the
tab order - and it and the bar share one tier and one curve. The `hidden`
attribute stays the single source of truth; only the way it is expressed changed.

**The garage arrows step to a real snap point.** They used to take the *first*
slide's width plus a hard-coded 32px gap and scroll by that every time, for
slides of three widths and a real gap of 24. It landed correctly only because
Chrome resolves mandatory snap in the direction of travel. The first rewrite read
`scroll-padding-inline-start` from `getComputedStyle`, which Chrome hands back as
the unresolved `max(56px, 50% - 644px)` - parsing that gave a pad of 0, every
stop landed 76px past its own snap point, and snap pulled the track straight
back: six presses, zero pixels. The stops are measured against the first slide
instead, which *is* scrollLeft 0 by construction.

**A hover zoom on a figure that is not a link was the same mistake the results
table refuses.** `ResultsTable` has no row hover and the comment says why: "a
background change promises a click that does not exist". The garage slides and
the About collage were making that promise with a 3% scale. The zoom is gone.

**The deployment is configured, not assumed.** `vercel.json` is in the repo root:
security headers including a CSP verified against the built output, `immutable`
on the hashed assets and the fonts, the five legacy redirects that only ever
existed as an `.htaccess` snippet Vercel does not read, and one slash policy so
the canonical, the sitemap and every internal link are the same string.

### Pass 3, 14 Sep 2026

**Astro's scoped styles beat page-level selectors, and that had silently
defeated three rules on purpose.** A component's scoped rule picks up a
`[data-astro-cid-*]` attribute on every compound selector, so
`.driver-compact .driver-number` is (0,4,0) while the page's
`.roster-teaser > li:first-child .driver-number` is only (0,3,0). Three
deliberate rules never applied: the roster teaser's column inset (four names
sat 1px from their hairlines), the teaser lead cell's larger number (all four
columns rendered identically), and - for the same class of reason, this one
purely within one file - the pillar register's two-column override at 1024
(row two kept a 24px indent and an orphan vertical hairline). **The rule now:
anything that has to cross a component boundary is an inherited custom
property, never a selector.** `--compact-inset` and `--compact-number-size`
join `--mark-size`. Where both selectors live in one file, the override is
written in the same shape as the rule it overrides so source order decides.
No `!important` anywhere on the site.

**The timing sheet is a timing sheet again.** Cells carry a real
`padding-inline-end: var(--space-l)` gutter instead of relying on how wide each
class chip happens to be (the chip-to-drivers gap measured 16.4px in one row
and 108.8px in another), the class column is `min-content` so the chip sets its
own width, and `vertical-align: baseline` puts the position marker and the
event name on one baseline - they used to share a *top*, 11px apart at the
baseline, in a layout whose whole idea is a timing tower. Between 621 and 860px
the stacked entry runs as three tracks instead of using 60% of a 706px line.

**Every section seam carries a rule or a background change.** "How we race" and
"Who backs us" were the only adjacent pair with neither, so two tinted bands
merged into one region. The home partner band moved to `--bg`.

**Empty is a state, not a crash.** `partners.astro` reduced `results.json`
without an initial value, so the Discord bot writing an empty file passed
`check:data` and then killed `astro build` with an opaque TypeError. Every
array the bot writes now has a deliberate empty state: the hero proof row is
omitted rather than claiming nothing, the sponsor's dossier prints one honest
line, the results snapshot prints a sentence instead of a column header over
nothing, the partner band drops to one column with the mailto (the brief
forbids an empty logo row), the roster teaser section disappears rather than
leaving a 1px orphan hairline, and `/team` prints "Roster in transition".
`PageHead` renders its `aside` slot up front and tests the result, because
`Astro.slots.has()` is true for a slot whose content is conditional on data.
`check:data` stays the single validator and now *warns* (never fails) on an
empty file, so the cause is named in the build log. Verified by emptying each
of the four files and all four at once: five builds, five successes, files
restored byte-identical.

**The header yields in one order: CTA, then lockup, then never the hamburger.**
`.menu-toggle` declared `width: 44px` but was a shrinkable flex item, so it
measured 33px on a 320px phone; at 200% text the nowrap compact CTA took the
whole bar and pushed the toggle off the device entirely. The toggle is now
`flex: 0 0 44px`, the brand `flex: 0 0 auto`, and the compact CTA is the one
item allowed to shrink - and it carries a short label ("Join" / "Partner") with
the full one as its accessible name. Opening the menu now locks the document by
taking `<body>` out of flow at a negative offset and restoring the position on
close; `overflow: hidden` alone stops a wheel but not a touch drag that chains
out of the panel, and not a scripted scroll at all.

### Pass 2, 14 Sep 2026

**Data comes from a Discord bot now.** `results.json`, `drivers.json` and
`events.json` implement `docs/data-contract.md` (stable `id`s, enumerated
classes, ISO alpha-3 countries, `role` / `group` / `active`, event `status`,
optional `entries` field size). `scripts/check-data.mjs` validates all three and
runs as `prebuild`, so an invalid write fails the build and the previous
deployment keeps serving. All sorting and selection moved into `src/lib/data.ts`
and no reader assumes the file is in order.

**Position without field size is an assertion, not evidence.** Results print
`P2` over `of 41` whenever the record carries `entries`, and print `P2` alone
when it does not. The series line was already in the data and is now rendered.
Each roster row shows that driver's most recent finish, matched on name.

**Hero render swapped to the Interlagos LMP2.** The Daytona Porsche carries a
legible NordVPN door decal, and the Partners page says GLYTCH is the only
partner. The Interlagos render is the only one in the set with no third-party
mark on the car or the scenery. The Porsche is out of the garage too, because
the decal still reads at slide width. The Nordschleife shot came back in as a
re-crop of the original: the uncropped frame is dominated by two AMG hoardings.
The garage is five slots, not six.

**One layout family per section.** Three bands on the home page were the same
"narrow heading column left, hairline rows right" skeleton in a row. The pillars
became a four-across register, the partner band a logo-led horizontal row, and
the join band a full-width statement with the three steps running underneath it.
Heading scale now ladders: `display-lg` on results and the values, `display-xl`
on the join band, `display-md` elsewhere. `PageHead` gained `aside` and `action`
slots so the inner pages open with an entry list, the founding dates or the
season dossier instead of a flat void.

**The reveal system no longer animates opacity.** A tall block gated on
`opacity: 0` plus an IntersectionObserver shipped a blank screen on mobile. It
now moves 12px and nothing else, the observer fires at `threshold: 0`, and a
1.5s timer settles anything left. Reveals were removed from whole-section
wrappers and kept only on genuine sibling lists.

**The hero image is a paint candidate from its first frame.** The entrance
animated `opacity` from 0 over 1100ms, which cost 2.26s of measured LCP because
a transparent image is not a candidate at all. The keyframe is a 640ms scale
settle now, and the width ladder gained 828 and 1536 steps so a phone stops
pulling the 1280 file and a retina laptop stops pulling the 1920 one.

**The stuck nav is fully opaque and has no blur.** At 94% opacity display type
ghosted through the bar; the 14px `backdrop-filter` behind it was invisible,
cost a compositing layer on every scroll, and the unprefixed property was being
dropped by the minifier anyway. The header CTA is a ghost button while the bar
is transparent over the hero and solid once it is stuck, so the page's own
primary button is never competing with an identical teal block.

**The header button follows the page, not the site.** `/partners` exists to
start a partnership, so its header CTA, its first-screen action and its contact
button are the same mailto with the same label. Every other page keeps
"Join the team". `nav.json` carries the override; `src/lib/links.ts` owns the
two intents so the address is written once.

**Smooth scrolling is per click.** A global `scroll-behavior: smooth` turned a
cross-page anchor into a long animated flight that landed mid-page. In-page
anchors are smoothed in script, with the reduced-motion query respected.

**Deliberately not done, and why:** the h1 stays the two-weight ARTEMIS /
ESPORTS lockup rather than the value proposition, because the lockup is a
protected decision; the claim was promoted to full ink strength instead. Driver
iRating and licence stay empty rather than being invented. The mobile menu still
appears and disappears instantly, which is cohesive with a square, radius-free
system and is the one motion note that wanted a real phone before changing it.
