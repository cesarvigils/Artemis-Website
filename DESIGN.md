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
markers. Gradient text. Glass cards. A hero metric row. Marquee text. Scroll cues.
Pinned or scroll-jacked sections. Decorative status dots. Em dashes.

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
| `--text-2xs` | `0.75rem` | Mono micro labels |
| `--text-xs` | `0.8125rem` | Nav links, buttons, footer links |
| `--text-sm` | `0.9375rem` | Captions, bios, table body |
| `--text-base` | `1.0625rem` | Body |
| `--text-lg` | `clamp(1.125rem, 1rem + 0.5vw, 1.375rem)` | `.lead` |
| `--text-xl` | `clamp(1.25rem, 1.1rem + 0.8vw, 1.75rem)` | Pillar titles, contact email |
| `--text-2xl` | `clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)` | `.display-sm`, roster group heads |
| `--text-3xl` | `clamp(1.875rem, 1.4rem + 2.4vw, 3rem)` | `.display-md`, section headings |
| `--text-4xl` | `clamp(2.375rem, 1.7rem + 3.4vw, 4rem)` | `.display-lg`, band headings |
| `--text-5xl` | `clamp(2.75rem, 1.95rem + 4.1vw, 5rem)` | `.display-xl`, page h1 |

Tracking: `--track-display: -0.01em`, `--track-label: 0.16em`, `--track-data: 0.02em`.
Display tracking never goes below -0.04em. Headings are uppercase with
`text-wrap: balance`; prose uses `text-wrap: pretty` and a `66ch` measure.

**Overflow rule:** every headline was tested at 390px. The longest single word on
the site (`PARTNERS`, `ESPORTS`, `PRECISION`) fits at the 2.75rem floor with the
`1.25rem` gutter. Any new headline must be checked at that width.

## 4. Space, shape, layers

Spacing is one fluid ramp; sections vary their padding deliberately rather than
repeating one rhythm.

`--space-3xs .25rem` · `--space-2xs .5rem` · `--space-xs .75rem` · `--space-s 1rem` ·
`--space-m 1.5rem` · `--space-l 2.5rem` · `--space-xl 4rem` ·
`--space-2xl clamp(4rem, 9vh, 7rem)` · `--space-3xl clamp(5.5rem, 13vh, 9.5rem)`

Layout: `--shell: 1400px`, `--pad-x: clamp(1.25rem, 4vw, 3.5rem)`, `--measure: 66ch`.
Breakpoints designed at 390 / 768 / 1024 / 1440; the two real switches are 820px
(nav) and 900px (layout). Full-height uses `100dvh`, never `100vh`.

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
| `--dur-ui` | `240ms` | Nav state, menu, skip link |
| `--dur-reveal` | `460ms` | Scroll reveal |
| `--dur-entrance` | `820ms` | Hero entrance |
| `--ease-out` | `cubic-bezier(.23, 1, .32, 1)` | Default |
| `--ease-out-quart` | `cubic-bezier(.25, 1, .5, 1)` | Entrances and reveals |
| `--ease-in-out` | `cubic-bezier(.77, 0, .175, 1)` | On-screen movement |

No bounce, no elastic, no `ease-in`, no `transition: all`. Only `transform`,
`opacity`, `filter`, `clip-path` and colour are animated.

**The vocabulary, and why each one exists:**

| Move | Where | Why it earns its place |
|---|---|---|
| Masked line rise | Hero h1, two lines, 90ms apart | Sets the pace of the page once, at the only moment there is nothing to read yet |
| Fade + 16px rise | Hero lead, proof, actions, page h1 | Sequences the hero so the eye lands on the headline first |
| Photo fade + 1.06 scale settle | Hero image | Keeps the photo from snapping in under the text |
| Scroll parallax, 5% travel | Hero image | Depth between the copy plane and the photo plane; CSS scroll-driven, no JS |
| Reveal (opacity + 14px) | Section content below the fold | Signals that a section is a new unit; it enhances content that is already visible |
| Underline scale-x | Nav links, current page | Feedback, and it marks the current page without relying on colour alone |
| `scale(0.97)` | Every button on `:active` | The interface confirms it heard the press |
| `scale(1.02)` on a photo | Garage slide, About photo, hover only | Signals the frame is interactive |
| Smooth `scrollBy` | Garage arrows | Shows the carousel moved rather than jumping |

**Rules that hold everywhere:**

- Nothing is invisible without JS. Reveal styles are gated behind `html.js`, which
  an inline head script adds. With JS off, every element renders at its final state.
- `prefers-reduced-motion: reduce` collapses all of it: animations are cut to 1ms,
  reveals become a 240ms opacity fade with no movement, the parallax is not
  attached at all, and the garage arrows scroll instantly instead of smoothly.
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
| `Nav.astro` | Fixed header, lockup, three links, one CTA | Transparent over the hero, solid once scrolled; mobile panel with `aria-expanded` and Escape-to-close |
| `Footer.astro` | Mark, tagline, contact, pages, channels | Social links are typographic labels, not hand-drawn brand glyphs |
| `Hero.astro` | Diagonal split, headline, lead, proof row, two actions | Takes the `getImage()` result so the same URL can be preloaded |
| `NextRace.astro` | One thin data strip | Static date always renders; the countdown is JS-only and its line is pre-reserved |
| `ResultsTable.astro` | The timing sheet | Real `<table>` with explicit ARIA roles so semantics survive the mobile `display: block` |
| `Garage.astro` + `GarageSlide.astro` | Native scroll-snap filmstrip | Six fixed slots; the `<Image>` stays in `Garage.astro` (see §8) |
| `DriverCard.astro` | `compact` column or `row` roster entry | Stats and socials render only when present |
| `PillarBand.astro` | The four values as one `<dl>` band | One band, not four screens |
| `PartnerBand.astro` | Copy plus the partner list | Never renders an empty logo row |
| `JoinCta.astro` | Discord CTA over the brand's spray texture | Optional three-step explainer |
| `PageHead.astro` | h1, lead, one data meta line | Shared by team / about / partners |

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
- Rendered widths are held to 640 / 1280 / 1920. The hero is preloaded with its
  `srcset` and `sizes` and is the LCP element.
- Astro's scoped styles do **not** reach a child component's root element. Sizing
  that has to cross a component boundary goes through an inherited custom property
  (`--mark-size`), and the `<img>` rendered by `<Image>` needs `:global(img)`.
