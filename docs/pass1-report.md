# Pass 1 report - Artemis Esports redesign

Build: `npm run build` exit 0, 3.1 s, `dist/` **2.24 MB** across 45 files, zero new
warnings, zero console errors on every route.
Screenshots: `<scratchpad>\shots\r1\` (69 files, all five routes, desktop + mobile).

---

## 1. What changed, per file

### Added

| File | What it is |
|---|---|
| `PRODUCT.md` | Audience, success definition, IA, one-CTA-per-page table, content model, constraints, open owner decisions |
| `DESIGN.md` | The committed direction, full token tables with OKLCH and measured contrast, type scale, space/shape/z-index scales, motion vocabulary with a reason per move, component inventory, a11y checklist, and the two build gotchas that cost the most time |
| `src/components/Mark.astro` | Gen3 mark / wordmark / lockup as inline SVG paths, `fill="currentColor"`, sized by an inherited `--mark-size` |
| `src/components/Icon.astro` | The only icon set: 5 glyphs, one stroke weight (1.5), square caps |
| `src/components/Hero.astro` | Diagonal split hero, headline / lead / proof row / two actions |
| `src/components/NextRace.astro` | The thin next-race data strip with a JS-only countdown on a pre-reserved line |
| `src/components/ResultsTable.astro` | The timing sheet; real `<table>` with explicit ARIA roles |
| `src/components/Garage.astro` + `GarageSlide.astro` | Native scroll-snap filmstrip, six slots, arrow buttons and a progress line |
| `src/components/DriverCard.astro` | `compact` (home column) and `row` (full roster) variants |
| `src/components/PillarBand.astro` | The four values as one compact `<dl>` band |
| `src/components/PartnerBand.astro` | Partner copy plus the partner list; never renders an empty logo row |
| `src/components/JoinCta.astro` | Discord CTA over the brand's spray texture, with the three-step explainer |
| `src/components/PageHead.astro` | Shared h1 / lead / meta head for team, about, partners |
| `src/scripts/site.ts` | All client behaviour in one file: reveals, nav state, menu, countdown, garage, footer year |
| `src/lib/format.ts` | `raceDate` / `raceDateRange`, fixed 3-letter uppercase months |
| `src/data/nav.json` | Single source of truth for nav links, the CTA and footer links |
| `src/data/results.json` | 6 results, every record flagged `_placeholder` |
| `src/data/events.json` | 3 calendar entries, every record flagged `_placeholder` |
| `src/assets/brand/*.svg` | The three traced vectors, kept in-repo as the source of the inline paths |
| `src/assets/hunt-texture.jpg` | The spray "HUNT" texture, re-encoded from `Background.png` |
| `public/favicon.svg`, `public/apple-touch-icon.png` | Generated from the vector mark |
| `public/fonts/jetbrains-mono-{400,700}.woff2` | Latin subset only, copied out of the fontsource package |

### Rewritten

| File | What changed |
|---|---|
| `src/styles/global.css` | Full token system: 3-step surface ramp, 3 ink steps with measured contrast, the single teal accent plus `--teal-ink`/`--teal-soft`/`--teal-hover`, 10-step type scale, 9-step space ramp, `--radius: 0`, semantic z-index scale, motion tokens, hero entrance keyframes, reveal rules gated behind `html.js`, a real reduced-motion block. Added `.data`, `.field-label`, `.section-head-stack`, `.roster-teaser`, `.skip-link`, `.sr-only`. |
| `src/layouts/Base.astro` | Skip link, `<main id="main">`, nav sentinel, favicon set, optional LCP preload with `imagesrcset`/`imagesizes`, `theme-color`, `og:site_name`, `twitter:site`. Lenis removed; the only script is `import '../scripts/site'`. |
| `src/components/Nav.astro` | Lockup instead of a raster logo, links from `nav.json`, CTA to Discord, transparent-over-hero then solid, mobile panel with Escape-to-close and scroll lock. The Lenis-driven auto-hide is gone. |
| `src/components/Footer.astro` | Mark + tagline + contact, pages from `nav.json` (no second hardcoded list), a channels column built from `site.socials` + `store`, and a client-corrected copyright year with a build-time fallback. |
| `src/pages/index.astro` | New section order: Hero, Next race, Results, Garage, Drivers, How we race, Partners, Join. Hero image via `getImage` so the exact URL can be preloaded. |
| `src/pages/team.astro` | Roster grouped road / oval / pitwall with a sticky group head and a per-group entry count; Race with us band at the bottom. |
| `src/pages/about.astro` | Origin section built from the two known dates, a stepped three-photo collage, the values band, hashtags, and the how-to-join band. |
| `src/pages/partners.astro` | The 60-second dossier: what a partner gets, a results snapshot, a roster snapshot, an honest channels list, current partners, and the mailto contact (keeping `id="contact"`). |
| `src/pages/404.astro` | Ghost mark, 404 marker, two actions, and links to all three pages. |
| `src/data/site.json` | Real socials and store URL, `heroLead`, `shortDescription`, `founded`, `simRacingSince`, and the `join` block. |
| `src/data/drivers.json` | 8 entries (4 road, 2 oval, 2 crew) with `group`, `stats` and `socials` slots, all flagged `_placeholder`. |
| `src/data/cars.json` | Trimmed to the 6 garage slots, renamed files, added `track` and `shape`. |
| `src/data/partners.json` | Added `since` and `detail`. |
| `CONTENT.md` | New `## Fill in` table at the top listing every placeholder record and how to replace it, plus how-to sections for results, events, the garage, the hero, partners and nav. |
| `DEPLOY.md` | Same deploy path, plus expected dist size and largest-file table, a size regression check, updated redirects, and a post-upload checklist. |
| `package.json` | `lenis` and `gsap` removed, `@fontsource/jetbrains-mono` added. Nothing else. |

### Removed

- `lenis` and `gsap` from dependencies (and from the code).
- `src/assets/Background.png` (2.8 MB PNG) - re-encoded to `hunt-texture.jpg` (167 KB).
- 17 racing sources and 8 photo sources - replaced by 7 + 3 downscaled, kebab-cased
  JPEGs. Every original is copied to `<scratchpad>\originals\`.
- The pinned pillar stack, the scroll-driven garage pan, the mission word-brighten,
  the magnetic buttons, the "On the hunt" marquee, and the `--z-menu` dead token
  (now used).

`src/assets/logos/*.png` were left in place: they never ship (nothing imports them)
and they are the brand source files.

---

## 2. How each brief requirement was met

**§2 Identity.** Teal `#0fffcf` on `#000a08` and the mint ink are unchanged; they were
refined, not replaced (`--ink-dim` .68 -> .78, `--ink-faint` .45 -> .52, both because
the old faint step measured 4.35:1 and failed AA). The `#001410` that was hardcoded
inside `.btn-solid` is now the `--teal-ink` token. Nexa Bold and Light are still the
only display faces; hierarchy is size, tracking, case and colour. One mono family was
added for data: **JetBrains Mono**, latin subset, woff2 only, weights 400 and 700,
self-hosted, `tabular-nums`. The vector mark from `brand-vector/` replaced every
raster logo in the nav, footer, 404 and favicon set.

**§3 Direction.** "Pit wall, not billboard" is implemented as tabular numerals,
hairline rules, P-position markers, dense data rows and generous space. Asymmetric
layouts throughout; no equal card grids, no eyebrow on any section, no numbered
section markers except the one place that is genuinely a three-step sequence, no
gradient text, no glass, no hero-metric row, no em dashes anywhere.

**§4 IA.** Pages stayed flat at `/`, `/team`, `/about`, `/partners`, `404`. Results
and the next race are home modules. Nav is Team / About / Partners / [Join the team].
Footer carries all real socials, the store, the contact and the copyright. One primary
CTA per page per the table in `PRODUCT.md`; Partners swaps to "Partner with us".
Home follows the eight-section order in the brief exactly.

**§5 Content.** `results.json` and `events.json` added with the specified shapes.
`site.json` socials filled with the exact handles from the brief plus the store.
Drivers and results use varied, realistic placeholder names against real tracks,
series and dates; every placeholder record carries `"_placeholder": true` and is
listed in the new `## Fill in` table in `CONTENT.md`. GLYTCH is the only partner. No
invented metrics anywhere: iRating and licence slots are deliberately empty and do
not render, and the Partners page says "ask us and we will send current numbers"
rather than printing follower counts. Copy is plain, sentence case in body, no
"elevate / seamless / unleash / next-gen", no exclamation marks.

**§6 Motion and performance.**

- Lenis removed, GSAP removed. Client JS is **2,867 bytes** inline per page
  (~1.2 KB gzipped), down from 133 KB.
- Every pinned and scrub-driven section is gone. The garage is native
  `scroll-snap-type: x mandatory` on all devices.
- Hero entrance is pure CSS, 820 ms, masked line rise + staggered fades. The light
  hero parallax is a CSS scroll-driven animation (`animation-timeline: scroll()`),
  transform only, behind `@supports`, so browsers without it get a static photo.
- Reveals are IntersectionObserver + CSS and only apply under `html.js`, so nothing
  is invisible without JS.
- `prefers-reduced-motion: reduce` cuts every animation to 1 ms, turns reveals into a
  240 ms opacity fade with no movement, detaches the parallax, and makes the garage
  arrows jump instead of smooth-scroll.
- Interactive transitions are 120-240 ms with exponential ease-out curves. No bounce,
  no `ease-in`, no `transition: all`.
- **Structural debts from `site-structure.md`:** single nav source (`nav.json`, used by
  both nav and footer) [1]; headline no longer a hardcoded array [2]; the brittle
  `startsWith('precision')` accent is gone with the mission-word effect [3]; the
  hero/garage duplicate image is gone (the Daytona render is hero only) [4]; the
  marquee literal is gone [5]; `--z-menu` is now used by the mobile menu [6]; the
  footer year is set client-side with the build year as fallback [7].
- **The 72 MB dist.** Root cause found and fixed: Astro only drops the full-size
  original when `<Image src={...}>` receives a **bare imported identifier**. A glob,
  a map lookup, a spread, or a re-export through a `.ts` module all keep the asset URL
  live and Vite emits the original next to the webp. `Garage.astro` now imports its
  six photos statically and hands each one straight to `<Image>`, with `GarageSlide`
  taking the image through a `<slot>`. Sources were also downscaled to the largest
  width the layout can ask for, so the "native width" derivative is never larger than
  the top srcset entry. `dist/` went **72 MB -> 2.24 MB**, with **zero** non-webp
  images in `_astro`.
- Rendered widths held to 640 / 1280 / 1920 as requested.
- LCP element is the hero image, preloaded with its `srcset` and `sizes`,
  `fetchpriority="high"`. Explicit `width`/`height` on it and `aspect-ratio` on every
  other frame, so CLS should be ~0. The countdown line is pre-reserved so filling it
  in shifts nothing.
- Accessibility: skip link, visible 2px teal focus rings, all body text at 4.5:1 or
  better on both surfaces, `aria-current="page"` reinforced with an underline,
  semantic landmarks, descriptive alt on every meaningful image, mobile menu with
  `aria-expanded` / `aria-controls` / Escape-to-close / focus return / scroll lock,
  and a keyboard-scrollable garage region.
- Responsive: designed at 390 / 768 / 1024 / 1440. Verified at 375 in a real browser:
  `documentElement.scrollWidth === clientWidth`, i.e. no horizontal overflow.
  `100dvh` everywhere, never `100vh`.

---

## 3. Performance evidence

| Metric | Before | After |
|---|---|---|
| `dist/` total | 72 MB | **2.24 MB** (45 files) |
| Full-size originals shipped | 17 (7.5 MB largest) | **0** |
| Build time | ~15 s | **3.1 s** |
| Client JS | 133 KB (`gsap` 115 KB + `lenis` 18 KB) | **2.87 KB inline**, ~1.2 KB gzipped |
| CSS | - | 26.7 KB raw across 3 files, **6.3 KB gzipped** |
| Hero image | 3.9 MB PNG source | 404 KB webp @1920, **180 KB @1280** (what a 1440 viewport picks) |
| Largest dist file | 7.5 MB JPEG | 404 KB webp |
| `og.png` | 629 KB | 116 KB |
| `src/assets` | ~85 MB | 3.3 MB |

Largest five files in `dist/`: hero @1920 (404 KB), crew photo @1920 (223 KB),
hero @1280 (180 KB), Nordschleife @1280 (178 KB), crew photo @1280 (126 KB).

Per-route HTML: home 51.2 KB (12.5 KB gzipped), partners 43.3, team 37.1,
about 34.0, 404 26.7.

---

## 4. Accessibility checklist

| Item | Status |
|---|---|
| Skip link to main content | Done |
| Semantic landmarks (`header` / `main` / `footer` / `nav`) | Done |
| Visible focus ring on every interactive element | Done (2px teal, 3px offset) |
| Body text ≥ 4.5:1 | Done; every ink step measured, lowest is 5.5:1 |
| Large text ≥ 3:1 | Done, all far above |
| Button text contrast | Done, 14.7:1 on the solid teal button |
| `aria-current="page"` in nav | Done, plus a non-colour underline cue |
| Mobile menu `aria-expanded` / Escape / focus return | Done, verified in a browser |
| Body scroll locked behind the open menu | Done |
| Alt text on all meaningful images | Done; two decorative images are `alt=""` inside `aria-hidden` wrappers |
| Table semantics survive the mobile stack | Done via explicit ARIA roles + a `sr-only` caption |
| Scrollable region keyboard-reachable | Done (`tabindex="0"` + `role="region"` + label) |
| Reduced-motion alternative for every animation | Done |
| Nothing invisible without JS | Done (reveal styles gated behind `html.js`) |
| Hover effects gated to fine pointers | Done |
| Touch targets ≥ 44px | Done (menu toggle, garage arrows, buttons) |
| Lighthouse run | **Not done** - no Lighthouse in this environment; see gaps |

---

## 5. Decisions made inside the brief's latitude

1. **GSAP dropped entirely.** The brief allowed keeping it for the hero entrance and
   reveals. Once the pinned sections were gone, everything left was a staggered fade
   and a small parallax, both of which CSS does better and 115 KB cheaper. The brief's
   own escape clause ("if GSAP ends up used only for reveals, drop it") applied.
2. **Nav auto-hide removed.** It was driven by the Lenis scroll event. Rebuilding it
   would have needed the `window` scroll listener that the taste reference bans. The
   nav now stays put and goes from transparent to solid via an IntersectionObserver
   sentinel, which is calmer and cheaper.
3. **Social links are typographic, not icons.** Drawing Discord/X/TikTok glyphs by
   hand would break the "inline SVG, single stroke weight" rule and the no-hand-rolled
   -icons rule. Uppercase labels with a small external-link arrow fit the pit-wall
   voice better anyway.
4. **The roster is a timing-sheet list, not a photo grid.** Four of the five reference
   sites use photo roster cards, but there are no driver headshots. Empty avatar
   frames would look worse than a well-set list. Flagged as an open item.
5. **The garage is a fixed six-slot filmstrip** with one uniform frame height and
   varying widths, so the captions line up. Adding a seventh car is a two-line code
   edit, documented in `CONTENT.md`. That is the price of the 70 MB saving.
6. **Garage arrows show on touch too.** The brief said "arrow buttons on desktop";
   hiding a working 44px control on mobile seemed worse than leaving it, so they stay.
7. **Hero headline is the team name**, set in Bold over Light-and-teal at the same
   size. That uses the two-weight constraint as the idea rather than fighting it, and
   it keeps the first screen honest instead of leading with a slogan.
8. **Placeholder driver stats are empty, not invented.** The `stats` slot exists and
   renders only when filled, which demonstrates the feature without publishing a fake
   iRating.
9. **`--radius: 0` everywhere.** A single committed shape system; the language is
   hairlines and rectangles.
10. **`src/lib/format.ts`** instead of `Intl.DateTimeFormat`, because some ICU builds
    render "Sept" and break the column rhythm in a tabular layout.

---

## 6. Known gaps

1. **No Lighthouse score.** There is no Lighthouse or CrUX tooling in this
   environment. The targets (LCP, INP, CLS, bundle size) were engineered for and the
   evidence above supports them, but nobody has run the audit. Worth doing on the live
   host before signing off.
2. **No driver headshots**, so the roster is typographic (see decision 4).
3. **Placeholder roster and results.** Realistic and flagged, but not real. Listed in
   `CONTENT.md` "Fill in".
4. **The About origin copy is a draft** written from the two facts we had. Flagged.
5. **The hero render carries a NordVPN decal** on the car. It is a genuine screenshot,
   not an invented sponsor, but the brief says not to add NordVPN anywhere, and a
   prominent decal on the hero car could read as a current partnership. Flagged for
   the owner; swapping the hero is a two-line change.
6. **`PartnerBand.astro` still resolves its logo through a map lookup.** It does not
   currently leak the original (verified: zero non-webp files in `_astro`), but it is
   the same pattern that caused the garage leak. If a second partner is ever added,
   re-check `dist/_astro` for a raw logo file.
7. **The CSS scroll-driven hero parallax is Chromium-and-newer only.** Firefox and
   Safari get a static hero. That is the intended graceful degradation, not a bug, but
   it means the parallax is invisible to a chunk of visitors.

   **Corrected in pass 2:** this entry assumed the parallax worked in Chromium.
   It did not work in any browser in a production build. The rule was written as
   the `animation` shorthand plus `animation-timeline`, and the build minifier
   folds those together; `animation-timeline` is not part of that shorthand, so
   Chrome rejected the whole declaration and `.hero-media` had
   `animation-name: none`. It only worked in `astro dev`, where the CSS is not
   minified. It is longhands now and verified in `dist/`, not in dev.
8. **The garage progress bar and arrow disabled-states could not be verified in a
   visible browser** - the automated pane reported `document.hidden === true`, which
   stops `requestAnimationFrame`. The initial state renders correctly in the captured
   screenshots (prev greyed out, next active, progress at zero) and the logic runs
   synchronously on init; the rAF-coalesced updates are only exercised on real scroll.
9. **`site.json`'s `heroLead` is duplicated in spirit by `shortDescription`.** Both
   are used (one on the page, one available for meta), but an editor could drift them
   apart.

---

## 7. Open questions for the owner

1. Do you want the real roster published, and with which names or handles? Everything
   is ready for it; only the JSON needs replacing.
2. Do you want iRating and licence public? The slots exist and stay hidden until
   filled.
3. Is the NordVPN decal on the hero car current? If not, pick a different render.
4. Confirm or rewrite the two About origin paragraphs.
5. Should the Partners page print real reach numbers? It currently says "ask us",
   which is honest but softer than a sponsor may want.
6. The `/results` and `/calendar` redirects in `DEPLOY.md` now point at the home page.
   Confirm that is where you want those old URLs to land.
