# Artemis Esports — Site Structure Report

Source: D:\Artemis\Website\Website (Astro ^7.0.7, gsap ^3.15.0, lenis ^1.3.25).
Build output: `dist/`, `format: 'directory'` (e.g. `/team` → `dist/team/index.html`).
`astro.config.mjs`: `site: 'https://artemisesports.com'`, `trailingSlash: 'ignore'`.

## Pages

### `/` — src/pages/index.astro
Data: site.json (tagline/heroSub/mission/focus/pillars), cars.json (10 entries), partners.json (1 entry).
Images: hero uses `src/assets/racing/iRacingSim64DX11 2024-01-17 21-56-09.png` (via `getImage`, webp, widths 900/1400/1920) — **this exact file is also entry #3 in cars.json** (used a second time in the Garage strip, captioned "On the grid at Daytona"). Garage renders all 10 `cars.json` images from `src/assets/racing/`. Partners band renders `src/assets/partners/glytch-white.png`.

Sections in order:
1. **Hero** — full-viewport (`100dvh`) diagonal-clipped hero image (right 68% of screen, clip-path polygon) + kicker "Sim Racing Team", 3-line headline ("Quiet." / "Precise." / "On the hunt." — hardcoded array, duplicates site.json's `tagline` string rather than deriving from it), `site.heroSub` lead copy, two CTAs: "Meet the team" → `/team`, "Get in touch" → `/partners#contact`.
2. **Mission** — `site.mission` rendered word-by-word (each word wrapped in a `<span class="m-word">`; word `"precision"` gets `.accent` teal color via a `word.startsWith('precision')` check — fragile, breaks if the mission copy is reworded), plus `site.focus` line below.
3. **Pillars** — one full-height panel per `site.pillars[]` entry (4 panels), desktop pins/stacks via ScrollTrigger.
4. **Garage** (`id="garage"`) — horizontal-scrolling strip of all `cars.json` images with per-shape sizing (portrait/wide/standard by aspect ratio), desktop-pinned horizontal pan.
5. **Partners band** — intro copy + link to `/partners`, logo strip from `partners.json` (1 logo, links to `p.url` external).
6. **CTA band** — looping CSS marquee background reading "On the hunt" (hardcoded literal string ×12, not sourced from `site.hashtags` or tagline), heading, "Get in touch" → `/partners#contact`.

Links: `/team`, `/partners#contact` (×2), `/partners`, external `https://glytchenergy.com` (partner logo, `target="_blank" rel="noopener"`). No dead/`#`-only links found.

### `/about` — src/pages/about.astro
Data: site.json (mission, pillars, hashtags).
Images: 3 hardcoded imports — `src/assets/photos/DSC03992.jpg` (huddle, wide), `DSC03590.jpeg` (lan, tall), `IMG_1142.jpg` (portrait, small). CONTENT.md documents these as manually swappable by editing the import paths (no data-file indirection).

Sections in order:
1. **Page head** — kicker "Who we are", h1 "Built in silence.", `site.mission` lead.
2. **Values** — list of `site.pillars[]` (title + line), 2-column row layout.
3. **People** — intro copy + 3-photo collage (wide/tall/small grid).
4. **Hashtag band** — renders `site.hashtags[]` as styled tags.

Links: none inside page content beyond global Nav/Footer (no in-page anchors or CTAs on this page).

### `/team` — src/pages/team.astro
Data: drivers.json (4 entries).
Images: none (no driver headshots; cards are text-only with a large outlined car `number`).

Sections in order:
1. **Page head** — h1 "The crew", lead "Loyalty over attention...".
2. **Roster sections** — one per role with ≥1 member, in fixed order Drivers → Pitwall → Staff (defined in-component, not data-driven). Currently: **Drivers (3)**, **Pitwall (1)**; **Staff section does not render** (0 entries in drivers.json, section is filtered out when empty — correct behavior, but the roster is effectively 4 people total and looks sparse).
3. **Join band** — "Think you belong here?" CTA → `/partners#contact`.

Links: `/partners#contact`. Roster data is explicitly placeholder (see Data schemas below).

### `/partners` — src/pages/partners.astro
Data: site.json (contactEmail), partners.json (1 entry).
Images: `src/assets/partners/glytch-white.png` (rendered at both height 96 in the list and reused via `Image` component).

Sections in order:
1. **Page head** — h1 "Partners", lead "We keep the list short...".
2. **Partner list** — one row per `partners.json` entry (currently 1: GLYTCH Energy) — logo, blurb, "Visit {name}" link.
3. **Contact** (`id="contact"`, the anchor target for `/partners#contact` links used elsewhere) — copy + contact card with `mailto:{site.contactEmail}` (×2: plain email link and "Get in touch" button).

Links: external `https://glytchenergy.com` (×2), `mailto:contact@artemisesports.com` (×2). `#contact` id confirmed present, so all `/partners#contact` references site-wide resolve correctly.

### `/404` — src/pages/404.astro
No data files, no images. Single centered section: h1 "Off track.", copy "This page does not exist...", "Back to the paddock" → `/`. Astro serves this automatically for unmatched routes; build output is `dist/404.html` (flat, not `404/index.html`, per Astro convention for the special 404 file).

## Nav.astro
Fixed header (`position: fixed`, `z-index: var(--z-nav)` = 100), translucent blurred background (`color-mix` + `backdrop-filter: blur(14px)`), 1px bottom border.
- Brand: logo image (`src/assets/logos/Logo_Layout_1.png`, height 44, densities 1x/2x) linking to `/`.
- Desktop nav (hidden ≤820px): links Home/Team/About/Partners (array literal in component, not data-driven) + solid "Get in touch" button → `/partners#contact`. Current page gets `aria-current="page"` via a path-prefix string match, rendered in teal.
- Mobile (≤820px): hamburger `.menu-toggle` button (`aria-expanded`, animates to an X via CSS transform on its two spans) toggles a `hidden` `.mobile-menu` panel containing the same 4 links + CTA, full-width, uppercase, large. Toggle logic is a tiny inline `<script>` (not GSAP) that flips `aria-expanded` and the `hidden` attribute — no animation on open/close, just show/hide.
- Nav auto-hides on scroll-down / reveals on scroll-up, driven by Lenis's `scroll` event listener in Base.astro (adds/removes `.nav-hidden`, which translates the header off-screen); suppressed while the mobile menu is open.

## Footer.astro
- 3-column grid: brand (icon image + `site.tagline`), footer nav (Team/About/Partners + `mailto:{contactEmail}`, all hardcoded in-component, not derived from the same `links` array as Nav.astro — two separate literals to keep in sync), tags column (`site.hashtags[]`).
- Base row: `{year} Artemis Esports. All rights reserved.` — `year` is `new Date().getFullYear()` evaluated **at build time** (Astro SSG), so it will read stale until the next rebuild each January.
- **Socials: confirmed hidden.** `site.socials` (twitter/instagram/twitch/youtube/discord) are all `""` in site.json; `Object.entries(site.socials).filter(([, url]) => url)` produces an empty array, so `socials.length > 0` is false and the `.footer-socials` block does not render at all. No empty/placeholder social icons ship.

## global.css — tokens, type scale, shared components

Fonts: `@font-face` "Nexa" — bold 700 (`/fonts/nexa-bold.woff2`) and light 300 (`/fonts/nexa-light.woff2`), both `font-display: swap`. Both preloaded in Base.astro `<head>`. `--font-display` and `--font-body` both resolve to the same `'Nexa', 'Avenir Next', 'Helvetica Neue', sans-serif` stack — there is no separate display/body typeface despite the two token names (CONTENT.md notes an "Eastman" font was intended but only trial OTFs existed, so Nexa covers everything).

Color tokens (all on `:root`, no light-mode variant — site is dark-only):
- `--bg: #000a08`, `--bg-raise: #03120e`, `--bg-panel: #06201a` (3-step near-black background ramp)
- `--ink: #ebfffb`, `--ink-dim: rgba(235,255,251,.68)`, `--ink-faint: rgba(235,255,251,.45)`
- `--teal: #0fffcf`, `--teal-dim: rgba(15,255,207,.55)` (single accent color)
- `--line: rgba(235,255,251,.14)`, `--line-teal: rgba(15,255,207,.28)` (hairline borders)

Other tokens: `--ease-out: cubic-bezier(.23,1,.32,1)`, `--ease-in-out: cubic-bezier(.77,0,.175,1)`; `--nav-h: 72px`; `--pad-x: clamp(1.25rem,4vw,3.5rem)`; `--z-nav: 100`, `--z-menu: 110` (`--z-menu` is declared but not referenced anywhere in the codebase — dead token, mobile menu has no explicit z-index of its own).

Type scale classes: `.display-xl` (clamp 2.75rem–6rem), `.display-lg` (2.25–4.25rem), `.display-md` (1.5–2.5rem), `.lead` (1.125–1.375rem, `--ink-dim`), `.kicker` (0.8125rem, uppercase, letter-spacing .18em, teal). All headings (`h1–h4`) are uppercase, bold, `text-wrap: balance` by base rule.

Shared components: `.container` (max-width 1400px, `--pad-x` gutters), `.section` (vertical padding clamp 5–9rem), `.btn`/`.btn-solid`/`.btn-ghost` (solid teal-on-dark vs. teal-outline ghost, both uppercase, hover states gated `@media (hover:hover) and (pointer:fine)`), `.reveal` (opacity/translateY fade-in-on-scroll, see Motion below).

## Motion inventory

| Effect | Location | Trigger | Reduced-motion fallback | Visible without JS? |
|---|---|---|---|---|
| Reveal-on-scroll (`.reveal`/`.in-view`) | Base.astro inline `<script>` + global.css | `IntersectionObserver`, 0.2 threshold | Yes — `@media (prefers-reduced-motion: reduce)` strips the transform, shortens transition to 300ms opacity-only | Yes — CSS only hides `.reveal` when `html.js` class is present (added by an inline head script); with JS fully disabled, elements render at full opacity/position by default |
| Lenis smooth scroll + nav hide/reveal | Base.astro inline `<script>` (dynamic `import('lenis')`) | Page scroll | Yes — only initialized inside `matchMedia('(prefers-reduced-motion: no-preference)')`; otherwise native scroll and the nav stays fixed | Yes — without JS the browser just scrolls natively |
| Hero entrance timeline (image scale/fade, kicker, headline line-reveal, lead, actions) | index.astro `<script>`, GSAP timeline | Page load, only `if (!document.hidden)` | Wrapped in `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` — skipped entirely under reduced motion | Yes — GSAP `.from()` sets the hidden starting state via inline styles only when the tween actually runs; with JS off or the tab hidden at load, elements keep their normal CSS (fully visible), never end up stuck invisible. Safety `setTimeout` forces `tl.progress(1)` at 3500ms as a belt-and-braces guard against a stalled timeline |
| Hero parallax (image drift + copy fade on scroll) | index.astro `<script>`, ScrollTrigger `scrub` | Scroll position | Same matchMedia gate as above | Yes, same reasoning |
| Mission word-brighten | index.astro `<script>`, ScrollTrigger `scrub` on `.m-word` | Scroll | Same matchMedia gate | Yes — opacity only ever set via JS |
| Magnetic buttons (`[data-magnetic]`) | index.astro `<script>` | `mousemove`/`mouseleave`, gated to `(hover:hover) and (pointer:fine)` | Implicitly motion-gated (nested inside the reduced-motion matchMedia block) | Yes, no-op without JS |
| **Pillars pin** (each `.pillar-panel` pins and hands off) | index.astro `<script>`, `ScrollTrigger.create({ pin:true, pinSpacing:false })` | Scroll, desktop only | Gated `(min-width:901px) and (prefers-reduced-motion:no-preference)`; on mobile or reduced motion, panels stack and scroll normally (plain flex layout, no JS needed) | Yes |
| **Garage horizontal pan** (`#garage`) | index.astro `<script>`, ScrollTrigger `pin` + `scrub:1`, vertical scroll drives `x` translation, plus per-image `containerAnimation` drift and a progress-bar fill | Scroll, desktop only | Same gate as Pillars; on mobile/reduced-motion the CSS media query switches `.garage-track` to native `overflow-x:auto` with `scroll-snap-type:x proximity` (touch-swipe instead of scroll-jacked pan) | Yes |
| CTA marquee ("On the hunt" looping text) | index.astro `<style>`, pure CSS `@keyframes` (40s linear infinite) | Always-on background decoration | Yes — `@media (prefers-reduced-motion:reduce) { animation:none }` | Yes, purely decorative `aria-hidden` |
| Mobile menu toggle | Nav.astro inline `<script>` | Click | N/A (not motion, just attribute/visibility toggle; the X-icon transform transition is a plain CSS transition, not gated to reduced-motion) | Menu is unusable without JS (button has no `href` fallback) — acceptable since it's an interactive control, not content |

Base.astro confirms Lenis is imported/initialized site-wide; index.astro is the only page with GSAP/ScrollTrigger (pinned Pillars and Garage sections specifically called out in the task brief are both here). No other page imports GSAP.

## Data schemas

**site.json** (singleton object): `name, tagline, heroSub, mission, focus, contactEmail` (strings); `socials: { twitter, instagram, twitch, youtube, discord }` (all string, **all currently `""`**); `hashtags: string[]` (4 entries); `pillars: { title: string, line: string }[]` (4 entries). All real/final copy, not placeholders.

**drivers.json** (array, 4 entries) — fields: `name, role ("driver"|"pitwall"|"staff"), number (string, "" for crew), country, focus, bio, socials (object, currently always `{}`)`. **All 4 entries are placeholders**: names are literally "Driver One", "Driver Two", "Driver Three", "Pitwall One"; every `bio` reads "Replace with the driver's one-line bio." / "Replace with the crew member's one-line bio." CONTENT.md confirms explicitly: "The current entries are placeholders." No `staff`-role entries exist.

**cars.json** (array, 10 entries) — fields: `image` (filename in `src/assets/racing/`), `car` (string), `caption` (string). Real, specific content (not placeholder) — feeds the homepage Garage only.

**partners.json** (array, 1 entry) — fields: `name, logo` (filename in `src/assets/partners/`), `url, blurb`. Only GLYTCH Energy present; CONTENT.md notes more partners (e.g. NordVPN) are expected once confirmed.

## Image inventory — src/assets/** (pixel dimensions + file size)

| File | Dimensions | Size |
|---|---|---|
| Background.png | 1920×1080 | 2.8 MB |
| logos/Artemis White Logo.png | 531×406 | 7.8 KB |
| logos/Icon.png | 500×500 | 376.9 KB |
| logos/Logo_Layout_1.png | 1000×400 | 68.9 KB |
| logos/Logo_Layout_2.png | 600×600 | 34.2 KB |
| partners/glytch-white.png | 732×221 | 12.3 KB |
| photos/DSC03590.jpeg | 4000×6000 | **10.0 MB** |
| photos/DSC03992.jpg | 3936×2624 | **6.3 MB** |
| photos/IMG_1119.jpg | 4032×3024 | 1.3 MB |
| photos/IMG_1127.jpg | 4032×3024 | 1.4 MB |
| photos/IMG_1142.jpg | 4032×3024 | 1.5 MB |
| photos/IMG_1174.jpg | 4032×3024 | 1.6 MB |
| photos/IMG_1187.jpg | 4032×3024 | 2.4 MB |
| photos/IMG_1224.jpg | 4032×3024 | 1.6 MB |
| racing/indy-pack.png | 2048×857 | 1.8 MB |
| racing/interlagos-lmp2.png | 1919×1079 | **3.6 MB** |
| racing/IRacing_Daytona_24_2024_allmode.png | 1804×1304 | 106 KB |
| racing/iRacingSim64DX11 2024-01-17 21-26-54.png | 1920×1080 | 2.6 MB |
| racing/iRacingSim64DX11 2024-01-17 21-29-02.png | 1920×1080 | **3.1 MB** |
| racing/iRacingSim64DX11 2024-01-17 21-29-25.png | 1920×1080 | **3.6 MB** |
| racing/iRacingSim64DX11 2024-01-17 21-30-06.png | 1920×1080 | **4.1 MB** |
| racing/iRacingSim64DX11 2024-01-17 21-56-09.png (hero + garage dup.) | 1920×1080 | **3.9 MB** |
| racing/iRacingSim64DX11 2024-01-17 22-00-53.png | 1920×1080 | 2.5 MB |
| racing/iRacingSim64DX11 2024-01-17 22-02-01.png | 1920×1080 | **3.7 MB** |
| racing/iRacingSim64DX11 2024-01-17 22-03-27.png | 1920×1080 | **3.7 MB** |
| racing/iRacingSim64DX11 2024-01-17 22-04-19.png | 1920×1080 | 2.7 MB |
| racing/nascar-chevy.png | 1920×1080 | 2.1 MB |
| racing/nordschleife-bmw.png | 1919×1078 | **4.4 MB** |
| racing/sebring-mustang-front.jpg | 2983×3729 | **5.1 MB** |
| racing/sebring-mustang-rear.jpg | 3088×3860 | **7.3 MB** |
| racing/watkins-gtp.jpg | 3130×3912 | **6.5 MB** |

**Flagged >3 MB (12 files, bold above):** DSC03590.jpeg (10.0 MB, largest source asset in the repo), sebring-mustang-rear.jpg (7.3 MB), watkins-gtp.jpg (6.5 MB), DSC03992.jpg (6.3 MB), sebring-mustang-front.jpg (5.1 MB), nordschleife-bmw.png (4.4 MB), 21-30-06.png (4.1 MB), 21-56-09.png (3.9 MB — used twice, as hero and in the Garage), 22-02-01.png / 22-03-27.png (3.7 MB each), interlagos-lmp2.png / 21-29-25.png (3.6 MB each), 21-29-02.png (3.1 MB). All are `Image`/`getImage`-processed at build time (webp, capped `widths`), so these large source sizes do not ship as-is to `dist/` — see Build section for actual output sizes — but they slow every `astro build` and bloat the repo/backup.

`public/` assets (not in scope of the >3 MB table above, listed for completeness): `favicon.ico`, `favicon.png`, `fonts/nexa-bold.woff2`, `fonts/nexa-light.woff2`, `og.png` — all small, not individually measured (out of `src/assets/**` scope per task).

## Inconsistencies / unfinished items found

1. **Roster is placeholder data.** All 4 `drivers.json` entries are literally named "Driver One/Two/Three" and "Pitwall One" with boilerplate "Replace with..." bios — CONTENT.md flags this explicitly as an open item.
2. **Socials are empty everywhere** — `site.json` has all 5 social URLs as `""`; the footer correctly hides the socials row entirely rather than rendering broken/empty links (verified in code, not just assumed).
3. **Only one partner** (GLYTCH Energy) is live; CONTENT.md notes others (e.g. NordVPN) pending.
4. **No dedicated body/display font** — `--font-display` and `--font-body` are distinct tokens but resolve to the identical Nexa stack; CONTENT.md explains an "Eastman" font was intended but never licensed/added.
5. **Duplicate hero/garage image** — `iRacingSim64DX11 2024-01-17 21-56-09.png` is used both as the homepage hero background and as garage-carousel item #3 ("On the grid at Daytona").
6. **Homepage headline is a hardcoded 3-line array** (`['Quiet.','Precise.','On the hunt.']`) that duplicates but does not derive from `site.json`'s `tagline` ("Quiet. Precise. On the hunt.") — editing the tagline in the CMS-like JSON file will not update the homepage headline.
7. **CTA marquee text is a hardcoded literal** ("On the hunt" × 12), not pulled from `site.hashtags` or any data file.
8. **Mission "accent" word is matched by `word.startsWith('precision')`** — a brittle string check tied to the exact current wording of `site.mission`; rewording the mission copy silently drops the accent color with no warning.
9. **Nav links and Footer links are two separate hardcoded arrays/literals** rather than one shared source, so adding/renaming a page requires updating both files plus the `roles` array in `team.astro` (unrelated but also hardcoded) independently.
10. **Copyright year in the footer is baked in at build time** (`new Date().getFullYear()` runs during `astro build`, not client-side), so it will read the wrong year starting each January until the next rebuild.
11. **`--z-menu` token is declared in global.css but never used** anywhere in the codebase (dead token).
12. **Team page's "Staff" section never renders** (0 entries with `role: "staff"` in drivers.json) — not a bug (the section is correctly filtered out when empty), but worth knowing before redesigning the roster grid, since it's currently a 2-section, 4-person page.
13. **No missing `alt` text found** — every `<Image>`/`<img>` has appropriate alt content; the one empty `alt=""` (homepage hero background) is intentional/decorative and its container is `aria-hidden="true"`.
14. **No dead/`#`-only links found** anywhere in `src/` (grepped for `href="#"` and empty hrefs — none present); every `/partners#contact` reference resolves to a real `id="contact"` on the Partners page.
15. **12 of 24 photo/racing source images exceed 3 MB** (see Image inventory) — largest is 10.0 MB (`DSC03590.jpeg`). Astro's `<Image>`/`getImage` pipeline downsamples/converts these to webp at defined widths for the shipped `dist/`, but the raw sources bloat the repo and slow local builds.

## Build

First two attempts (by me, prior session) failed: `node_modules` had been `npm install`ed on macOS/Apple Silicon and copied onto this Windows machine rather than installed here (no `.cmd`/`.ps1` shims in `node_modules\.bin`, `@esbuild` had only `darwin-arm64`, `@rollup` was missing its win32 native package) — `astro` was not recognized as a command, exit code 1 both times. That was an environment problem, not a site problem.

**Build (re-run by orchestrator) — PASSED.** After `npm ci` restored a Windows-native `node_modules` (`node_modules\.bin\astro.cmd` present, `@esbuild\win32-x64` present): `npm run build` → **exit 0, ~15 s**, 5 pages emitted (`/`, `/team`, `/about`, `/partners`, `/404`), no warnings/errors reported by Astro.

`dist/` totals **72.4 MB** (75,953,621 bytes) across 92 files. `dist/_astro/` alone is 82 files / ~71.7 MB: 60 `.webp`, 14 `.png`, 3 `.jpg`, 3 `.js`, 2 `.css`. Largest 10 files, all under `dist/_astro/`:

| Size | File |
|---|---|
| 7.33 MB | sebring-mustang-rear.B736Bu8H.jpg |
| 6.47 MB | watkins-gtp.8WHFdnDz.jpg |
| 5.14 MB | sebring-mustang-front.DyHHqb_J.jpg |
| 4.32 MB | nordschleife-bmw.B8dgbtDg.png |
| 4.00 MB | iRacingSim64DX11 2024-01-17 21-30-06.DzzOd_xw.png |
| 3.91 MB | iRacingSim64DX11 2024-01-17 21-56-09.SnblkS1R.png |
| 3.62 MB | interlagos-lmp2.rlllk1Sx.png |
| 3.62 MB | iRacingSim64DX11 2024-01-17 22-03-27.D5Xs3ruR.png |
| 3.61 MB | iRacingSim64DX11 2024-01-17 22-02-01.D5Km-CdN.png |
| 3.56 MB | iRacingSim64DX11 2024-01-17 21-29-25.BkHHIbYD.png |

**Why the raw originals are copied into `dist/_astro` alongside the webp derivatives:** `src/pages/index.astro` (lines 8–10) does
```js
const racingImages = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/racing/*.{png,jpg,jpeg}'
);
```
a non-eager `import.meta.glob` over the entire `src/assets/racing/` folder. Vite's static analysis treats every file matched by that glob as a reachable asset module and emits a hashed raw copy of **each one** into `dist/_astro` at build time — regardless of whether the corresponding dynamic import is ever actually invoked. Confirms: the 6 racing images that are *not* referenced anywhere (`IRacing_Daytona_24_2024_allmode.png` and the `21-26-54`/`21-29-02`/`21-29-25`/`22-00-53`/`22-02-01`/`22-03-27` screenshots — none are in `cars.json` or used as the hero) still appear in `dist/_astro` as a **raw copy only, with zero webp derivatives**, because the glob alone is enough to make Vite ship them, even though nothing ever calls `<Image>`/`getImage` on them. The 11 images that *are* actually consumed (the 10 in `cars.json` + the 1 hero image, `21-56-09.png`, which is both) get **both** the automatic raw copy (from the glob reference) **and** their optimized webp srcset derivatives from `<Image widths=... format="webp">` / `getImage({ format: 'webp' })` — hence originals sitting next to webp files for the same image. The same pattern exists for `partnerImages = import.meta.glob('../assets/partners/*.{png,svg,webp}')` in index.astro/partners.astro, but that folder only has the one GLYTCH logo so it has no extra cost. Net effect: dist ships ~14 MB+ of large PNG/JPG originals that no `<img>`/`<source>` tag on the site actually points to.

