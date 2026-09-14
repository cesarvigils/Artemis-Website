# DESIGN.md - Artemis Esports

The visual system. Read `PRODUCT.md` first for audience and IA.
Tokens live in `src/styles/global.css`; this file explains them and records why.

## 1. Direction

**"Pit wall, not billboard."**

The brand identity (Gen3 teal on near-black, the leaf-and-profile mark, the
"On the hunt" voice) is fixed and was preserved. What changed is the register:
from *agency motion showcase* to *a racing team with evidence*.

The vocabulary is the pit wall and the timing tower: tabular numerals, hairline
rules, position markers (P1 / P4), dense-but-calm data rows, and a lot of quiet
space around them. Motion is present and precise; it is never the content.

Named references for the lane: a live timing screen, a race entry list, a stint
sheet. Not: an esports org template, not an editorial magazine, not a SaaS hero.

### What is deliberately absent

Equal card grids. A tiny uppercase kicker above every section. Numbered section
markers. Gradient text. Glass and `backdrop-filter` of any kind. A hero metric
row. Marquee text. Scroll cues. Pinned or scroll-jacked sections. Decorative
status dots. Em dashes. Hover states on rows that are not clickable.

One more rule, added in pass 2: **no layout family twice on a page.** Home runs
eight sections and seven compositions. If a new band would be "narrow heading
column on the left, hairline rows on the right" and something above it already
is, it gets a different shape.

The one place numbers label a sequence is the three-step Join explainer, because
it genuinely is a sequence.

## 2. Colour

Dark only. There is no light mode: the brand is a near-black ground with one
saturated accent, and a light variant would not be the same brand. `color-scheme:
dark` is declared so form controls and scrollbars match.

Strategy on the commitment axis: **committed** - one saturated colour carries the
identity, everything else is a three-step near-black ramp.

| Token | Hex | OKLCH | Role | Contrast on `--bg` |
|---|---|---|---|---|
| `--bg` | `#000a08` | `oklch(13.0% 0.023 183)` | Page ground | - |
| `--bg-raise` | `#03120e` | `oklch(16.6% 0.025 176)` | Alternating bands, footer | - |
| `--bg-panel` | `#06201a` | `oklch(22.1% 0.034 175)` | Panels, the ghost 404 mark | - |
| `--ink` | `#ebfffb` | `oklch(98.4% 0.022 183)` | Body and headings | 19.3:1 |
| `--ink-dim` | `rgba(235,255,251,.78)` | `oklch(82.1% 0.020 185)` | Leads, secondary copy | 11.6:1 |
| `--ink-faint` | `rgba(235,255,251,.52)` | `oklch(61.7% 0.018 182)` | Field labels, meta | 5.5:1 |
| `--teal` | `#0fffcf` | `oklch(89.2% 0.171 172)` | The single accent | 15.5:1 |
| `--teal-soft` | `rgba(15,255,207,.7)` | `oklch(69.2% 0.133 172)` | Outlined car numbers, hashtags | 7.8:1 |
| `--teal-ink` | `#001410` | `oklch(17.1% 0.031 179)` | Text on a teal fill | 14.7:1 on `--teal` |
| `--teal-hover` | `#7dffe3` | `oklch(93.3% 0.114 170)` | Solid-button hover | - |
| `--line` | `rgba(235,255,251,.12)` | - | Hairline rules | - |
| `--line-strong` | `rgba(235,255,251,.24)` | - | Table head, ghost button border | - |
| `--line-teal` | `rgba(15,255,207,.32)` | - | Accent hairlines | - |

Decisions inside that:

- `--ink-dim` was raised from the old `.68` to `.78` and `--ink-faint` from `.45`
  to `.52`. The old faint step measured **4.35:1**, under AA. Every text token now
  clears 4.5:1 on both `--bg` and `--bg-raise`.
- `--teal-ink` replaces a hardcoded `#001410` that only existed inside `.btn-solid`.
- Podium positions (P1-P3) are teal; the rest are `--ink-faint`. That is the only
  semantic colour rule on the site, and it uses the same single accent.

## 3. Typography

Two families, on a real contrast axis: a geometric display sans against a
monospace. No third family, no extra weights.

| Token | Stack | Used for |
|---|---|---|
| `--font-display` / `--font-body` | Nexa 700 / 300, then Avenir Next, Helvetica Neue | Everything readable |
| `--font-mono` | JetBrains Mono 400 / 700 | Data only |

- **Nexa** is the licensed brand face and only Bold (700) and Light (300) exist on
  disk. Hierarchy therefore comes from size, tracking, case and colour. The hero
  uses that constraint as the idea: `ARTEMIS` in Bold, `ESPORTS` in Light, tracked
  wider and set in teal, same size.
- **JetBrains Mono** (`@fontsource/jetbrains-mono`, latin subset, woff2 only, two
  weights, self-hosted in `public/fonts/`) carries positions, dates, counts, car
  numbers and field labels, with `font-variant-numeric: tabular-nums`. It was
  chosen over IBM Plex Mono and Space Mono, which are training-data defaults.
  Mono here is not decoration: every use is a number or a column label.
- All four faces are `font-display: swap`; the two Nexa faces are preloaded.

### Scale

Fluid `clamp()`, ratio about 1.27, ceiling 5rem (80px) - under the 6rem cap.

| Token | Value | Typical use |
|---|---|---|
| `--text-2xs` | `0.6875rem` | Mono micro labels, chips, field labels |
| `--text-xs` | `0.8125rem` | Nav links, buttons, footer links |
| `--text-sm` | `0.9375rem` | Captions, bios, table body |
| `--text-base` | `1.0625rem` | Body |
| `--text-lg` | `clamp(1.125rem, 1rem + 0.5vw, 1.375rem)` | `.lead` |
| `--text-xl` | `clamp(1.25rem, 1.1rem + 0.8vw, 1.75rem)` | Pillar titles, contact email |
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
| `--leading-display` | `1.04` | h1-h4 |
| `--leading-tight` | `1.15` | Field labels, chips, nav, `.data`, single-line display spans |
| `--leading-snug` | `1.35` | Titles inside cells, sub-headings |
| `--leading-body` | `1.6` | Body and all small prose |

Before these existed, roughly twenty tracked uppercase labels silently
inherited the body's 1.7, and `.step-title` led looser than the sentence under
it. Prose leading was spread across 1.4 / 1.5 / 1.55 / 1.6 / 1.7 for one job.

### Tracking

| Token | Value | Used for |
|---|---|---|
| `--track-display` | `-0.01em` | h1-h4 |
| `--track-title` | `0.04em` | Uppercase component titles at body size |
| `--track-link` | `0.1em` | Uppercase micro-caps: interactive labels and chips |
| `--track-label` | `0.16em` | Field labels and tracked meta |
| `--track-data` | `0.02em` | Mono data |
| `--track-lockup` | `0.06em` | The two-weight hero lockup only |

No component declares a literal `em` tracking value. There used to be ten of
them across 28 declarations, which gave five identical 13px uppercase link
styles five different tracks.

Display tracking never goes below -0.04em. Headings are uppercase with
`text-wrap: balance`; prose uses `text-wrap: pretty`.

### Measure

`--measure: 66ch` for body prose, `--measure-lead: 52ch` for **every** `.lead`
on the site. There used to be five different caps for that one element,
spanning 39-54ch, three of them under the 45ch comfort floor.

Headings are capped in `em`, never `ch`. `ch` is the advance of `0`; uppercase
Nexa is about a fifth wider per character, so a "14ch" cap actually held ten or
eleven glyphs and the nine `ch` caps on the site were not comparable with each
other.

**Overflow rule:** every headline was tested at 390px, and again at 390px with
a 200% root font. The longest single word on the site (`PARTNERS`, `ESPORTS`,
`PRECISION`) fits at the floor with the `1.25rem` gutter. Any new headline must
be checked at both.

**Unbreakable tokens.** `overflow-wrap: anywhere` is on h1-h4 globally and on
every name-shaped span the bot can write: `.event-name`, `.driver-name` (both
variants), `.driver-focus`, `.also-name`, `.slide-car`, `.entry-name`,
`.partner-name`, `.field-label`, `.roster-name`, `.pillar-tags li`. The one
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

Durations and easings are tokens, and every one of them is under 300ms except the
two entrance animations.

| Token | Value | Used for |
|---|---|---|
| `--dur-press` | `120ms` | `:active` scale on buttons |
| `--dur-hover` | `180ms` | Colour and border changes |
| `--dur-ui` | `240ms` | Nav state, menu |
| `--dur-reveal` | `320ms` | Scroll reveal |
| `--dur-entrance` | `560ms` | Hero entrance |
| `--ease-out` | `cubic-bezier(.23, 1, .32, 1)` | Default |
| `--ease-out-quart` | `cubic-bezier(.25, 1, .5, 1)` | Entrances and reveals |
| `--ease-in-out` | `cubic-bezier(.77, 0, .175, 1)` | On-screen movement |

No bounce, no elastic, no `ease-in`, no `transition: all`. Only `transform`,
`opacity`, `filter`, `clip-path` and colour are animated.

**The vocabulary, and why each one exists:**

| Move | Where | Why it earns its place |
|---|---|---|
| Masked line rise | Hero h1, two lines, 70ms apart | Sets the pace of the page once, at the only moment there is nothing to read yet |
| Fade + 16px rise | Hero lead, proof, actions, page h1 | Sequences the hero so the eye lands on the headline first |
| Photo 1.04 scale settle, 640ms | Hero image | Keeps the photo from snapping in under the text. No opacity: see the log entry on the LCP |
| Scroll parallax, 5% travel | Hero image | Depth between the copy plane and the photo plane; CSS scroll-driven, no JS |
| Reveal (12px rise, no fade) | Sibling lists below the fold | Signals a new unit without ever being the reason content is not on screen |
| Underline scale-x | Nav links, current page | Feedback, and it marks the current page without relying on colour alone |
| `scale(0.97)` | Every button on `:active` | The interface confirms it heard the press |
| `scale(1.02)` on a photo | Garage slide, About photo, hover only | Signals the frame is interactive |
| Smooth `scrollBy` | Garage arrows | Shows the carousel moved rather than jumping |

**Rules that hold everywhere:**

- **Nothing is ever animated from `opacity: 0`.** Reveals move 12px and nothing
  else, so a paused tab, a headless renderer or an observer that never fires can
  only cost the reader an offset, not the section. Reveal styles are also gated
  behind `html.js`, so with JS off every element renders at its final state, and
  a 1.5s timer settles anything the observer has not reached.
- `prefers-reduced-motion: reduce` collapses all of it: animations are cut to 1ms,
  reveals lose their transition entirely, the parallax is not attached at all, the
  garage arrows scroll instantly, and the transition property list is clamped to
  colour and opacity so no transform-based hover survives. Reduced motion is
  gentler, not zero: colour still eases.
- **Nothing on a keyboard-initiated path animates.** The skip link has no
  transition; it arrives on the first frame of the first Tab.
- No `window` scroll listener anywhere. Sticky nav state comes from an
  IntersectionObserver on a 1px sentinel; the garage progress bar listens to the
  *track element's* own scroll, passively, coalesced into one `requestAnimationFrame`.
- Hover effects are gated behind `@media (hover: hover) and (pointer: fine)`.

**Removed in this pass:** Lenis smooth scroll, the pinned four-panel pillar stack,
the scroll-driven horizontal garage pan, the word-by-word mission brightening, the
magnetic buttons, the looping "On the hunt" marquee, and GSAP itself. Client JS
went from 133 KB to about 2.9 KB.

## 6. Components

`src/components/`

| Component | What it is | Notes |
|---|---|---|
| `Mark.astro` | The Gen3 mark, wordmark and lockup as inline SVG | `fill="currentColor"`; sized by the parent through `--mark-size` |
| `Icon.astro` | The only icon set: arrow-right, arrow-left, arrow-up-right, menu, close | One stroke weight (1.5), square caps, mitred joins |
| `Nav.astro` | Fixed header, lockup, four links, one CTA | Ghost CTA over the hero, solid and fully opaque once scrolled; a compact CTA with a short label sits in the bar at phone widths and is the only item allowed to shrink; mobile panel with `aria-expanded`, Escape-to-close, a focus trap, `inert` behind it, a `position: fixed` body scroll lock and `overscroll-behavior: contain` |
| `Footer.astro` | Mark, tagline, contact, pages, channels | Three equal columns, channels flush right. Social links are typographic labels, not hand-drawn brand glyphs |
| `Hero.astro` | Diagonal split, headline, lead, proof row, two actions | Takes the `getImage()` result so the same URL can be preloaded. The proof row prints field size when the record has it |
| `NextRace.astro` | One thin data strip plus the rest of the calendar | Static date always renders; the countdown is JS-only and its line is pre-reserved. Falls back to "No race scheduled" with the last completed event |
| `ResultsTable.astro` | The timing sheet | Real `<table>` with explicit ARIA roles so semantics survive the mobile `display: block`. Position, field size, series, class, drivers, date |
| `Garage.astro` + `GarageSlide.astro` | Native scroll-snap filmstrip | Five fixed slots; the scrollable region is a wrapping `<div>` so the `<ul>` keeps its list role; the `<Image>` stays in `Garage.astro` (see §8) |
| `DriverCard.astro` | `compact` column or `row` roster entry | Stats and socials render only when present; the row prints the driver's latest finish, derived from `results.json` |
| `PillarBand.astro` | The four values, `row` or `long` | `row` is a four-across band (home), `long` one entry per row with a race-weekend sentence and the hashtags along the foot (about) |
| `PartnerBand.astro` | `row` (logo-led register) or `stack` (dossier entries) | Never renders an empty logo row: with no partners it collapses to one column with the heading, an honest sentence and the mailto. `row` sits on `--bg` so it does not merge with the tinted pillar band above it |
| `JoinCta.astro` | Discord CTA over the brand's spray texture | Full-width heading, lead, button, then the three steps across the band. Steps on the home page only |
| `PageHead.astro` | h1, lead, meta, optional `action` and `aside` slots | Shared by team / about / partners; the aside is what stops the first screen being half empty. The split starts at 1101px, not 901px, because below that the copy column cannot carry the `display-xl` step; it renders the aside slot first and tests the result, so a slot whose content is conditional on data collapses instead of reserving a column |

Shared classes in `global.css`: `.container`, `.section`, `.section-tall`,
`.rule-top`, `.section-head` (+ `.section-head-stack`), `.roster-teaser`, `.btn`
(`.btn-solid`, `.btn-ghost`, `.btn-sm`), `.text-link`, `.lead`, `.data`,
`.field-label`, `.display-*`, `.reveal`, `.skip-link`, `.sr-only`.

## 7. Accessibility

- Skip link to `#main`; `<main>`, `<header>`, `<footer>`, `<nav>` landmarks.
- Visible focus: `2px` teal outline, `3px` offset, on everything focusable.
- `aria-current="page"` in both the desktop and mobile nav, reinforced by an
  underline so it does not rely on colour alone.
- Mobile menu: `aria-expanded`, `aria-controls`, Escape closes and returns focus,
  the page behind it cannot scroll, and it closes itself on resize to desktop.
- The garage track is `tabindex="0"` with `role="region"` and a label, so it can be
  scrolled from the keyboard; the arrow buttons have visually hidden names.
- Every meaningful image has descriptive alt text. The only decorative images are
  the join-band texture (`alt=""`, in an `aria-hidden` wrapper) and the 404 mark.
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
- **`prefers-contrast: more`** raises five tokens (`--ink-dim`, `--ink-faint`,
  `--line`, `--line-strong`, `--line-teal`) and, because nothing hardcodes
  those colours, that lifts every hairline on the site at once.
- **`forced-colors: active`** is handled as a first-class mode, not an
  afterthought. Windows High Contrast strips every `background-image`, which on
  this site means every legibility scrim, so the hero photo and the join
  texture are hidden rather than left under unscrimmed copy. The primary button
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
  budget is about 6 KB gzipped; three render-blocking round trips cost more than
  the bytes.
- **Never read layout before first paint.** Measuring every `.reveal` on load, or
  the garage track's `scrollWidth`, forced a full layout of a 5,000px page ahead
  of the first frame and was the largest single main-thread cost on the home page.
  The garage measures inside `requestAnimationFrame`; the reveals measure nothing.

## 9. Decision log

Newest first. Only decisions that changed the system, not every edit.

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
