# Pass 2 — Critique C: motion, interaction, performance

Reviewer role: design engineer, read-only. Target: `D:\Artemis\Website\Website` (Astro 7 static).
Method: `anthropic-skills:emil` review path (`review-animations.md` + `review-animations.STANDARDS.md`),
`anthropic-skills:impeccable` (`animate.md`, `optimize.md`), `npm run build` + byte measurement of `dist/`,
Lighthouse 13 against a local static server, and a scripted Chrome (playwright-core, real OS Chrome)
interaction pass at 1440×900 and 390×844.

Evidence scripts and raw output live in `<scratchpad>\perf-tool\` (`measure.mjs`, `audit.mjs`,
`audit-results.json`, `lh-home.json`, `lh-team.json`) and `<scratchpad>\shots-tool\`
(`audit2.mjs`–`audit6.mjs`). Build ran clean: `5 page(s) built in 717ms`, exit 0, no warnings.

**Headline:** the site is genuinely well built — no scroll-jacking, no `transition: all`, no `ease-in`,
no `scale(0)`, every `:hover` correctly gated behind `(hover: hover) and (pointer: fine)`, JS is 2.87 KB
inline, CLS is a measured 0.0000, and Lighthouse is 98/97/100/100. Two things are quietly broken in the
**built** output that do not reproduce in dev, and one motion decision costs 2.26 s of LCP.

---

## 1. emil review — findings table

Per `review-animations.md`, one row per issue. Standards cited as `STD n` (the Ten Non-Negotiable
Standards) or by section of `review-animations.STANDARDS.md`.

| Before | After | Why |
| --- | --- | --- |
| `global.css:480-482` + `:498-507` — `html.js [data-enter-media] { animation: enter-media 1100ms ... both }` with `@keyframes enter-media { from { opacity: 0; transform: scale(1.06) } }` on the hero LCP image | Drop `opacity` from the keyframe, keep only `scale(1.04) → scale(1)`, and cut to `640ms`: `@keyframes enter-media { from { transform: scale(1.04) } }` | **Measured: LCP 3332 ms with the fade vs 1072 ms without it**, same 1.6 Mbps / 4× CPU run, only this rule changed (`audit3.mjs`). An LCP image that starts at `opacity: 0` is not a paint candidate, so the browser cannot credit it until the fade renders it — and the 1100 ms animation then stacks on top of the download. STD 1 (justified motion — the fade buys nothing the scale doesn't) and STD 4 (1100 ms is the longest animation on the site, on the one element that must not be delayed). Violates the brief's binding LCP ≤ 2.5 s rule. |
| `Hero.astro:201-209` — `animation: hero-drift linear both; animation-timeline: scroll(root block);` (two declarations) | Longhands the minifier cannot fold: `animation-name: hero-drift; animation-duration: auto; animation-timing-function: linear; animation-fill-mode: both; animation-timeline: scroll(root block);` | Astro's minifier folds these into `animation: linear both hero-drift scroll(root)` (verified in `dist/_astro/index.DTwiExiR.css`). `animation-timeline` is **not** a component of the `animation` shorthand, so Chrome rejects the whole declaration: measured `animationName: "none"`, `animationTimeline: "auto"`, `0` running animations on `.hero-media`, while the sibling `animation-range: 0px 900px` from the same rule *did* apply — proving the block matched and only the shorthand was dropped. `CSS.supports('animation-timeline','scroll(root block)')` is `true` in the same browser, and the longhand form works. **The hero parallax has never run in a production build**, in any browser. Contradicts `pass1-report.md` known gap #7, which assumes it works in Chromium. |
| `global.css:452-458` — `.reveal { transition: opacity 460ms, transform 460ms }` for a `translateY(14px)` travel | `--dur-reveal: 320ms` | STD 4 and the STANDARDS duration table. 460 ms to move 14 px means the last ~250 ms is sub-pixel: the eye reads it as lag, not as easing. 320 ms with the same `--ease-out-quart` lands the same distance and feels deliberate rather than slow. |
| `PillarBand.astro:22` — `<div class="pillar reveal">` ×4, all with `transition-delay: 0s` (measured) | `<div class="pillar reveal" style={`--reveal-delay: ${i * 60}ms`}> ` | Escalation trigger: *"Everything-at-once entrance where a 30–80 ms stagger belongs."* Measured, the four pillars flip to `in-view` at 86/88/88/87 % of the viewport — they pop independently as scroll position decides, which is neither a stagger nor a single group reveal. STD 10 (cohesion): `JoinCta.astro:45` and `partners.astro:75` *do* stagger (0/70/140 ms and `i*60ms`), so the same list pattern has three different treatments across the site. |
| `index.astro:64` `<div class="reveal">` (results table wrapper), `index.astro:84` `<ul class="roster-teaser reveal">`, `PillarBand.astro:22` — 9 reveals on `/`, 11 on `/team`, all the identical 14 px fade-and-rise | Delete `.reveal` from whole-section wrappers; keep it only on genuine sibling lists (join steps, partner offer items, driver rows) | STD 1 (justified motion) and STD 10 (cohesion), and impeccable `animate.md`: *"The saturated AI default is fade-and-rise reveals on every scrolled section; that's a tell, not a choreography."* A `<div>` wrapping a table is not a list and gains nothing from entering. The remedial hierarchy puts **delete** first. |
| `GarageSlide.astro:57` + `:61-63` — `img { transition: transform 600ms var(--ease-out) }`, `:hover { transform: scale(1.02) }` | `transition: transform 200ms var(--ease-out)`; `:hover { transform: scale(1.03) }` | STD 4 — 600 ms is double the UI ceiling, on a hover. STD 2 — hover is a "tens of times/day" action, which the frequency table says to *reduce*. A 2 % scale spread over 600 ms is a movement the user cannot perceive as motion, only as sluggishness; the shorter, slightly larger version reads as a response. |
| `global.css:112` `--dur-entrance: 820ms` + `Hero.astro:61` `--enter-delay: 420ms` | `--dur-entrance: 560ms`; re-space the delays to 0 / 70 / 180 / 230 / 280 ms | The last hero element (the CTA row) finishes at 420 + 820 = **1240 ms**, past the brief's own "≤ 1.2 s total" hero rule. STANDARDS allows marketing entrances to run long, but the CTA is the click target — it should not be the last thing to settle. |
| `global.css:413-428` — `.skip-link { transform: translateY(-120%); transition: transform 240ms var(--ease-out) }` | `transition: none` on `.skip-link` (keep the transform for the off-screen position) | STD 2, verbatim: *"Never animate keyboard-initiated actions."* The skip link is reached by Tab, by keyboard users, on every page load. Measured: it does arrive correctly (top `0`, focus ring present, `Enter` moves focus to `#main`) — it just takes 240 ms to do it, on the one interaction where instant is the whole point. |
| `global.css:512-527` — reduced-motion block resets `animation-duration` and `animation-iteration-count` but never `transition-duration` | Add to the same block: `.text-link:hover svg, .nav-link::after, .garage-frame img, .btn:active { transition-property: opacity, color, background-color, border-color }` (i.e. keep the colour transitions, drop the transform ones) | STD 8. Measured under `prefers-reduced-motion: reduce`: `.text-link svg` still carries `transform 0.18s` and still `translateX(3px)` on hover; `.garage-frame img` still `scale(1.02)` over 600 ms; `.nav-link::after` still `scaleX()`. Reduced motion means *gentler*, not zero — colour and opacity should stay — but position and scale changes are exactly what it is meant to remove. The `.reveal` override (`transform: none; transition: opacity 240ms linear`) is the correct model; it just wasn't extended to the hover layer. |
| `Nav.astro:95-100` — `.site-nav.is-stuck { background: color-mix(in srgb, var(--bg) 94%, transparent); backdrop-filter: blur(14px) }` | Drop the two `backdrop-filter` lines; or, to keep the glass, take the background to ~70 % so the blur is actually visible | Two problems in one rule. (a) A 14 px blur behind a **94 % opaque** surface is imperceptible while still forcing a backdrop layer on a `position: fixed` element for the whole scroll — impeccable's absolute ban on *"blurs and glass cards used decoratively"*. (b) The minifier drops the unprefixed property: `dist/_astro/Base.B0bt-yKI.css` ships only `-webkit-backdrop-filter: blur(14px)`, and Chrome computes `backdropFilter: "none"` on the genuinely stuck nav. Firefox, which has no `-webkit-` alias, gets nothing at all. The rest of `.is-stuck` works correctly (background, border and the `::before` scrim fade to 0 all verified on real scroll). |
| `Nav.astro` + `site.ts:58-62` — `setOpen()` toggles `menu.hidden`; the full-screen mobile panel appears and vanishes with no transition | `@starting-style` entry: panel at `opacity: 0; translateY(-8px)` → `opacity: 1; translateY(0)` over 200 ms enter / 150 ms exit, inside `@media (prefers-reduced-motion: no-preference)` | STD 9 (asymmetric enter/exit) and the frequency table — a mobile nav is an "occasional" action, the row that says *standard animation*. This is the one state change on the site with no feedback at all, and impeccable `animate.md` lists *"instant state changes that feel abrupt (show/hide)"* as a motion opportunity. Lowest-confidence row in this table: the instant swap is defensible as "crisp", and it is cohesive with the square, no-radius system. Worth one look in a real browser before changing. |

### Verdict

**1. Feel-breaking regressions**
The hero parallax (`Hero.astro:201-209`) is dead in every production build and nobody noticed, because it
works in `astro dev` where the CSS is not minified. The hero image fade (`global.css:480-482`) is the most
expensive animation on the site and buys nothing the scale transform doesn't already give.

**2. Missed simplifications**
Nine reveals on the home page, eleven on `/team`, all the same 14 px fade-and-rise, three of them on
whole-section wrappers rather than lists. Delete those three. The 600 ms garage hover should be 200 ms.

**3. Performance**
Covered in §2 below. The motion-specific item: the reveal system is `opacity` + `transform` only and the
garage progress bar writes `transform: scaleX()` directly on the element rather than through a parent CSS
variable — both correct per STD 7 and the STANDARDS performance section. No non-GPU animation anywhere.

**4. Interruptibility & timing**
`.reveal` uses transitions, not keyframes, and unobserves after firing — correct. The hero entrance uses
keyframes, which is right for a one-shot entrance that cannot be interrupted. No findings.

**5. Origin, physicality & cohesion**
No popovers, dropdowns or tooltips exist, so STD 5 has nothing to bite on. `.btn:active { transform:
scale(0.97) }` with `transition: transform 120ms var(--ease-out)` is exactly the STANDARDS press-feedback
spec (0.95–0.98, 100–160 ms) — a pass worth recording. The cohesion failure is the three different list
treatments noted above.

**6. Accessibility**
Every one of the 15 `:hover` rules on the home page is gated behind `(hover: hover) and (pointer: fine)` —
verified by walking the live CSSOM. That is a clean sweep of the hover half of STD 8. The reduced-motion
half is incomplete: transform *transitions* survive `prefers-reduced-motion: reduce`.

**Decision: Block.** One feel-breaking regression (a shipped animation that does not run), one animation
on a keyboard-initiated action (the skip link), and one animation with a measured 2.26 s cost to the
project's own binding LCP budget. None is hard to fix; the fixes are small and local.

---

## 2. Performance evidence

Build: `npm run build` → exit 0, 5 pages, 717 ms. `dist/` = **2.24 MB** across 45 files, zero non-webp
images in `_astro`.

### Lighthouse 13.0.1 — mobile preset, `dist/` over localhost

| Route | Performance | Accessibility | Best practices | SEO | FCP | LCP | CLS | TBT | Speed Index |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | **98** | **97** | **100** | **100** | 2.0 s | 2.0 s | **0** | 0 ms | 2.1 s |
| `/team` | **99** | **100** | **100** | **100** | 1.6 s | 1.6 s | **0** | 0 ms | 1.6 s |

All four categories clear the brief's ≥ 95 target on both routes. The one point of accessibility lost on
`/` is a single audit — `listitem`, see C4.

Two "failures" are artifacts of my test server, not the site: `bf-cache` (my server sends
`cache-control: no-store`) and `document-latency-insight` "Est savings of 34 KiB" (my server does not
gzip). A real host with compression and cache headers removes both.

### Bytes

| | raw | gzip | brotli |
| --- | --- | --- | --- |
| `/` HTML | 51.2 KB | **12.4 KB** | 9.3 KB |
| `/` CSS (3 files) | 26.1 KB | **6.2 KB** | 5.5 KB |
| `/` JS | **0 external** — 2.87 KB inline `type="module"` | ~1.2 KB | — |
| `/` route total (html+css+js) | — | **18.7 KB** | — |
| `/team` route total | — | 12.3 KB | — |
| `/about` route total | — | 12.3 KB | — |
| `/partners` route total | — | 14.1 KB | — |
| `/404` route total | — | 10.0 KB | — |
| Fonts (4 × woff2) | 76.8 KB | — | — |
| All images | 1995.6 KB | — | — |
| **`dist/` total** | **2.24 MB** | — | — |

**JS budget: 2.87 KB inline vs the 120 KB gz ceiling — 2 % of budget.** Comfortably the strongest number
on the project. Note there is no external JS file at all; Astro inlines the whole of `site.ts`, so it
cannot 404 and adds no request.

### LCP, measured

Identical runs at 1.6 Mbps / 150 ms RTT / 4× CPU, 1440×900, only the `enter-media` rule differing:

| Condition | LCP | LCP element |
| --- | --- | --- |
| As shipped (hero image fades from `opacity: 0`) | **3332 ms** | `<img>` hero |
| `html.js [data-enter-media] { animation: none }` | **1072 ms** | `<span>` hero headline |
| **Delta** | **+2260 ms** | |

On a fast connection the hero image never registers as an LCP candidate at all (LCP = 84–108 ms on a text
span at 1440 DPR1, DPR2 and 390 DPR2), which is why Lighthouse reports a flattering LCP = FCP = 2.0 s. The
metric and the user disagree: the photo is not on screen at 2.0 s. Under reduced motion — where the fade
rule does not apply — the `<img>` becomes the LCP candidate immediately (108 ms, size 829434). That
asymmetry is the proof.

### Hero image delivery

`index.astro:20-25` → `widths: [640, 1280, 1920]`, `format: 'webp'`, `quality: 64`.
`sizes="(max-width: 900px) 100vw, 62vw"`. Preload at `Base.astro:35-46` is correct: `rel="preload"
as="image"` with matching `imagesrcset` + `imagesizes` + `fetchpriority="high"`, and the `<img>` itself
carries `fetchpriority="high"` and explicit `width="1920" height="1080"`.

| Viewport | DPR | CSS slot | Candidate chosen | Bytes |
| --- | --- | --- | --- | --- |
| 1440 | 1 | 892 px | `…_2m4Qtm.webp` (1280w) | 180.3 KB |
| 1440 | **2** | 892 px | `…_1mwv57.webp` (1920w) | **403.9 KB** |
| 390 | 2 | 390 px | `…_2m4Qtm.webp` (1280w) | 180.3 KB |
| 390 | 3 | 390 px | `…_2m4Qtm.webp` (1280w) | 180.3 KB |
| 412 (LH mobile) | 1.75 | 412 px | `…_2m4Qtm.webp` (1280w) | 184.7 KB, **143.9 KB wasted** per Lighthouse |

The brief's rule is "≤ 250 KB webp at 1440 px". A 1440 retina display gets **403.9 KB**. The cause is the
gap in the width ladder: nothing sits between 1280 and 1920, and nothing between 640 and 1280, so both a
phone and a retina laptop over-fetch. Adding `828` and `1536` steps and dropping quality to ~58 fixes both
rows.

### Images, fonts, render-blocking

- **Every image has explicit `width`/`height`** (9 on `/`, all attributes present) or an `aspect-ratio`
  on its frame (`GarageSlide.astro:107-115`). Measured **CLS = 0.0000** at 1440 and at 390, and Lighthouse
  agrees. The countdown line is pre-reserved with `min-height: 2.6em` (`NextRace.astro:119-121`) — that
  works, the countdown fills in with no shift.
- All below-fold images carry `loading="lazy" decoding="async"`; the hero correctly does **not**.
- **Fonts:** `nexa-bold.woff2` and `nexa-light.woff2` are preloaded (`Base.astro:33-34`); all four faces
  use `font-display: swap`. **`jetbrains-mono-400.woff2` is not preloaded but is used above the fold** —
  measured, two above-the-fold elements render in it (`.hero-pos` "P2" at weight 700 and
  `.hero-proof-meta` "GT3 class, 06 SEP 2026"). Both mono files are fetched at +92 ms vs +75 ms for the
  preloaded Nexa, so the gap is small here, but it widens on a real connection.
- **Render-blocking:** 3 `<link rel="stylesheet">` in `<head>` on `/` (Base + index + results), 26.1 KB raw
  / 6.2 KB gzip. Lighthouse: **est. savings 590 ms**. For a stylesheet budget this small, inlining is
  strictly better than three blocking round trips.
- **Forced reflow: 65.6 ms**, attributed by Lighthouse to `index.html` line 5 col 42484, which I mapped
  into the inline module: it is `track.scrollWidth` inside `initGarage`'s `update()` (`site.ts:134`). A
  second 0.4 ms entry lands on `track.scrollLeft` (`site.ts:137`), a read after the
  `progress.style.transform` write on line 136.

---

## 3. Interaction audit

Real OS Chrome via playwright-core, `dist/` served locally. 1440×900 and 390×844 (DPR 3, touch).
Raw output: `<scratchpad>\perf-tool\audit-results.json`.

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Hero entrance completes, never leaves text hidden (1440, motion on) | **PASS** | At 2.6 s: title, lead, proof and actions all `opacity: 1`, `transform: none`, non-zero height, in viewport; `document.getAnimations()` returns zero unfinished. Confirmed visually in `shots/r1b/desktop-home-hero.png`. |
| 2 | Every `.reveal` reaches full opacity after a normal scroll | **PASS** | 9/9 on `/`, 11/11 on `/team`, zero below `opacity: 0.99`. |
| 3 | Nav `.is-stuck` toggles on scroll away from / back to top | **PASS** | Scrolled: `is-stuck=true`, background `color(srgb 0 .039 .031 / .94)`, border `rgba(235,255,251,.12)`, `::before` scrim `opacity: 0`. At top: all reverted. |
| 4 | Garage arrows change scroll position; disabled states update at both ends | **PASS** | Start `scrollLeft=0`, `prev.disabled=true`; after "next" `scrollLeft=300`, `prev.disabled=false`; at `scrollLeft=2035` (max) `next.disabled=true`. Progress bar `scaleX` tracked 0.001 → 0.147. Closes `pass1-report.md` known gap #8. |
| 5 | Countdown renders | **PASS** | `hidden=false`, text `"In 11d 09h 44m"` from `data-countdown="2026-09-25T16:00:00Z"`. |
| 6 | Mobile menu opens on click | **PASS** | `aria-expanded="true"`, `hidden=false`, `display: flex`. |
| 7 | Body scroll locked while the menu is open (real wheel input) | **PASS** | `scrollY` 600 before open → 600 after open → 600 after an 800 px wheel over the panel → 600 after Escape. Position preserved and restored. (An earlier `window.scrollTo()` probe appeared to fail; that bypasses `overflow: hidden` and was a test artifact, not a defect.) |
| 8 | Escape closes the menu, returns focus to the toggle, unlocks scroll | **PASS** | `aria-expanded="false"`, `hidden=true`, `document.activeElement.className` contains `menu-toggle`, `html` overflow back to `visible`. |
| 9 | Clicking the toggle again closes the menu | **PASS** | `aria-expanded="false"`, `hidden=true`. |
| 10 | **Focus stays inside the open menu** | **FAIL** | Tab stops while open: `Team(in menu) > About(in menu) > Partners(in menu) > Join the team(in menu) > Join the team(OUTSIDE) > See results(OUTSIDE) > Next car(OUTSIDE) > garage-track(OUTSIDE)`. Focus walks into content hidden behind the full-screen panel. See C5. |
| 11 | Keyboard tab order reaches every control with a visible focus ring | **PASS** | From a fresh load: Skip → brand → Team → About → Partners → Join the team → hero CTAs → garage → roster → footer. All 14 sampled stops carry `outline: solid 2px rgb(15,255,207)`, `outline-offset: 3px`. |
| 12 | Skip link works | **PASS** | First tab stop; after the 240 ms transition it sits at `top: 0, left: 0`, `transform: matrix(1,0,0,1,0,0)`, `outline-offset: -4px`; `Enter` sets `location.hash = "#main"` and moves `document.activeElement` to `main`. (It is slow to arrive — see C13.) |
| 13 | `prefers-reduced-motion: reduce` removes movement | **PARTIAL** | Hero: `animation-name: none`, `scroll-behavior: auto`, title `opacity: 1`, zero running animations — correct. `.reveal`: `transform: none`, `transition: opacity 0.24s linear` — correct. **But** transform *transitions* survive: `.text-link svg` keeps `transform 0.18s` + `translateX(3px)` on hover, `.garage-frame img` keeps `scale(1.02)` over 600 ms. See C6. |
| 14 | Reduced motion: all reveals still become visible | **PASS** | 0 of 9 left faded after a full scroll. |
| 15 | Nothing invisible without JS | **PASS** | JS disabled: `html` has no `js` class, hero title box `576×157`, all 9 `.reveal` elements laid out at full size, countdown stays `hidden`, garage controls stay `hidden`. The no-JS render is the finished state, exactly as the brief requires. |
| 16 | No horizontal overflow at 390 | **PASS** | `documentElement.scrollWidth === innerWidth`; hero title `opacity: 1`, height 92 px. |
| 17 | Garage arrows present on mobile | **PASS** | `controls.hidden=false`, 44 px tall, track overflow 1611 px. |
| 18 | No console errors / failed requests | **PASS** | Zero on `/` desktop, `/` mobile, `/` reduced-motion, and `/team`. |
| 19 | **Deep link leaves reveals blank above the viewport** | **FAIL** | `/#join`: 6 of 9 `.reveal` elements sit at `opacity: 0.00` above the fold (tops at −2777 to −483 px). They self-heal when scrolled back to (0 left faded), so no permanent blank — but content fades in *upward* as you scroll back, which reads as broken. See C15. |
| 20 | Hero parallax runs | **FAIL** | `.hero-media` computed `animation-name: none`, `animation-timeline: auto`, `getAnimations().length === 0`, while `animation-range: 0px 900px` from the same rule applied. See C2. |

**20 checks: 16 pass, 1 partial, 3 fail.**

---

## 4. Ranked findings

| ID | Sev | Where | Issue | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| **C1** | **P0** | `src/styles/global.css:480-482`, `:498-507` | The hero LCP image fades in from `opacity: 0` over 1100 ms, delaying the largest paint past the project's binding budget. | Controlled A/B at 1.6 Mbps + 4× CPU, only this rule changed: **LCP 3332 ms with the fade, 1072 ms without — +2260 ms**. On fast connections the image never becomes an LCP candidate at all (LCP lands on a text span at 84–108 ms), so Lighthouse's 2.0 s understates what the user waits for. Under reduced motion the `<img>` registers immediately at 108 ms. Brief §6: LCP ≤ 2.5 s. | Remove `opacity: 0` from `@keyframes enter-media`; keep `transform: scale(1.04) → scale(1)` and cut the duration to ~640 ms. The entrance still reads; the image is paintable from its first frame. |
| **C2** | **P1** | `src/components/Hero.astro:201-209` | The hero parallax has never run in a production build. Astro's minifier folds `animation-timeline` into the `animation` shorthand, producing a declaration browsers reject. | Built CSS ships `animation:linear both hero-drift scroll(root)`. Chrome: `animationName: "none"`, `animationTimeline: "auto"`, `0` animations on `.hero-media`; sibling `animation-range: 0px 900px` from the same rule *did* apply. `probe.style.animation = 'linear both hero-drift scroll(root)'` → rejected; the longhand form → accepted. `CSS.supports(...)` is `true`. Only reproduces in `dist/`, not `astro dev`. | Split into longhands (`animation-name` / `-duration` / `-timing-function` / `-fill-mode` + `animation-timeline`) so the shorthand is never emitted. Then re-verify in `dist/`, not dev. Also correct `pass1-report.md` gap #7. |
| **C3** | **P1** | `src/scripts/site.ts:134` (called from `:160`) | `initGarage()` calls `update()` synchronously at `DOMContentLoaded`; its first statement reads `track.scrollWidth`, forcing a full layout of the 5163 px page before first paint. | Lighthouse `forced-reflow-insight` scores 0 with **65.6 ms** total reflow, source mapped to the inline module at exactly `track.scrollWidth`. It is the largest single main-thread cost on the page. | Replace the bare `update()` on line 160 with `schedule()` (the rAF wrapper already defined on line 142), so the first measurement happens after first paint instead of before it. |
| **C4** | **P1** | `src/components/Garage.astro:41-48` | `role="region"` on `<ul id="garage-track">` overrides the implicit `list` role, orphaning all six `<li class="garage-slide">`. | Lighthouse `listitem` audit **scores 0** on `/`, naming all six slides with path `ul#garage-track > li.garage-slide`. This is the only audit costing `/` its accessibility point (97 vs `/team`'s 100). | Move `role="region"`, `aria-label` and `tabindex="0"` onto a wrapping `<div>`, leaving the `<ul>` a plain list. Keyboard scrolling and the region label both survive. |
| **C5** | **P1** | `src/scripts/site.ts:53-83` | The mobile menu has no focus trap. Tab walks out of the full-screen panel into the content behind it. | Measured tab sequence with the menu open: 4 stops inside the menu, then `Join the team`, `See results`, `Next car`, `garage-track` — all behind the panel and visually hidden. Everything else about the menu is correct: `aria-expanded`, `aria-controls`, Escape-to-close, focus return to the toggle, and a working scroll lock. | In `setOpen(true)`, focus the first link and add a `keydown` handler that cycles Tab/Shift+Tab within `#mobile-menu`. Alternatively make the panel a `<dialog>` and call `showModal()`, which gives the trap and the inert background for free. |
| **C6** | **P1** | `src/styles/global.css:512-527` | The reduced-motion block resets `animation-duration` but never `transition-duration`, so every transform-based hover still moves. | Under `prefers-reduced-motion: reduce`: `.text-link svg` → `transform 0.18s` + `translateX(3px)`; `.garage-frame img` → `scale(1.02)` over 600 ms; `.nav-link::after` → `scaleX()`. emil STD 8. Brief §6: "Every animation has a `prefers-reduced-motion` alternative." | Add a rule inside the existing block neutralising the transform half of those transitions while keeping colour/opacity — reduced motion is gentler, not zero. Do **not** add a blanket `transition: none !important`: the skip link depends on `transform` for its position. |
| **C7** | **P1** | `src/pages/index.astro:20-25` | The hero width ladder has no step between 640/1280 and 1280/1920, so both phones and retina laptops over-fetch. | 1440 @ DPR2 pulls the 1920w file: **403.9 KB**, against the brief's "≤ 250 KB webp at 1440 px". Lighthouse `image-delivery-insight` on mobile: 184.7 KB delivered, **143.9 KB wasted**. | `widths: [640, 828, 1280, 1536, 1920]` and `quality: 58`. A 412 px phone then lands on ~828w (~70 KB) and a retina 1440 on 1536w (~250 KB). |
| **C8** | **P2** | `index.astro:64`, `index.astro:84`, `PillarBand.astro:22` | Three `.reveal` instances sit on whole-section wrappers rather than lists — the uniform fade-and-rise reflex. | 9 reveals on `/`, 11 on `/team`, all identical. impeccable `animate.md`: "fade-and-rise reveals on every scrolled section... a tell, not a choreography." emil STD 1 + STD 10. | Delete `.reveal` from the results-table wrapper, the `roster-teaser` `<ul>` and the pillar rows. Keep it on the join steps, partner offer items and driver rows, where siblings genuinely stagger. |
| **C9** | **P2** | `src/styles/global.css:111`, `:452-458` | `--dur-reveal: 460ms` for a 14 px travel — the last ~250 ms is sub-pixel and reads as lag. | Measured `transition-duration: 0.46s, 0.46s` on all 9 reveals. emil STD 4 + STANDARDS duration table. | `--dur-reveal: 320ms`. |
| **C10** | **P2** | `src/components/PillarBand.astro:22` | The four pillars have no stagger; they pop independently as scroll position decides. | Measured `transition-delay: 0s` on all four; they flip to `in-view` at 86/88/88/87 % of viewport. `JoinCta.astro:45` and `partners.astro:75` stagger correctly, so the site has three treatments for the same pattern. Escalation trigger: "everything-at-once entrance where a 30–80 ms stagger belongs." | `style={`--reveal-delay: ${i * 60}ms`}`, matching `JoinCta`. (Or delete per C8 — decide which lists reveal, then be consistent.) |
| **C11** | **P2** | `src/components/GarageSlide.astro:57`, `:61-63` | 600 ms transition on a hover, for a 2 % scale — double the UI ceiling, on a "tens of times/day" action. | emil STD 4 and STD 2 (frequency table says *reduce* hover motion). | `transition: transform 200ms var(--ease-out)`; `scale(1.03)`. |
| **C12** | **P2** | `src/styles/global.css:112`, `src/components/Hero.astro:61` | The hero CTA row finishes entering at 420 + 820 = **1240 ms**, past the brief's "≤ 1.2 s total" and last in a sequence it should not be last in. | `--dur-entrance: 820ms`; `--enter-delay: 420ms` on `.hero-actions`. | `--dur-entrance: 560ms`; delays 0 / 70 / 180 / 230 / 280 ms. |
| **C13** | **P2** | `src/styles/global.css:413-428` | The skip link slides in over 240 ms — an animation on a keyboard-initiated action. | emil STD 2, verbatim: "Never animate keyboard-initiated actions." Verified it does arrive correctly, just slowly. | `transition: none` on `.skip-link`; keep the `translateY(-120%)` resting position. |
| **C14** | **P2** | `src/components/Nav.astro:95-100` | A 14 px backdrop blur behind a 94 %-opaque background: invisible, but it forces a backdrop layer on a fixed element for the whole scroll — and the unprefixed property is dropped in the build. | `dist/_astro/Base.B0bt-yKI.css` ships only `-webkit-backdrop-filter: blur(14px)`; Chrome computes `backdropFilter: "none"` on the genuinely stuck nav; Firefox has no `-webkit-` alias. impeccable absolute ban: glassmorphism as decoration. | Drop both `backdrop-filter` lines — the 94 % background already does the job. If the glass is wanted, take the background to ~70 % and put the unprefixed property **last**. |
| **C15** | **P2** | `src/scripts/site.ts:16-37` | Deep-linking to an in-page anchor leaves every reveal above the target at `opacity: 0`; content then fades in *upward* as the user scrolls back. | `/#join`: 6 of 9 reveals at `opacity: 0.00`, tops at −2777 … −483 px. Self-heals on scroll-up (0 left faded), so not a permanent blank. `#results`, `#garage` and `#join` are all real links in the page. | On init, add `in-view` to any `.reveal` whose `getBoundingClientRect().bottom < 0` before observing the rest. Three lines. |
| **C16** | **P2** | `src/components/Garage.astro:28` + `src/scripts/site.ts:139` | The garage arrows ship `hidden` and JS un-hides them, growing the section header by 11 px at 390. | Measured at 390: `.section-head` 33 px with controls hidden, 44 px shown — an **11 px** delta. Measured CLS is 0.0000 only because the garage is below the fold at load, so the shift never enters the viewport. Latent, not yet realised. | Reserve the height (`min-height: 44px` on `.garage-controls`), or use `visibility: hidden` rather than `hidden` so the box is always allocated. |
| **C17** | **P2** | `src/scripts/site.ts:136-138` | `update()` writes `progress.style.transform`, then reads `track.scrollLeft` twice — a read-after-write that re-forces layout on every scroll frame. | Lighthouse attributes a second forced-reflow entry (0.4 ms) to exactly `track.scrollLeft` on line 137. Small now; it scales with page complexity. optimize.md, "Avoid Layout Thrashing". | Hoist `const left = track.scrollLeft;` up with the other reads on line 134, then do all three writes. |
| **C18** | **P2** | `src/layouts/Base.astro:33-34` | `jetbrains-mono-400.woff2` renders above the fold but is not preloaded. | Measured above-the-fold mono elements: `.hero-pos` ("P2", weight 700) and `.hero-proof-meta` ("GT3 class, 06 SEP 2026"). Mono files fetch at +92 ms vs +75 ms for the preloaded Nexa; the gap widens off localhost. `font-display: swap` means a visible reflow of tabular figures. | Add a preload for `jetbrains-mono-400.woff2` beside the two Nexa preloads. 20.7 KB. Leave the 700 weight unpreloaded — its first use (`.pos`) is below the fold. |
| **C19** | **P2** | `astro.config.mjs` | Three render-blocking stylesheets on `/` for 6.2 KB gzipped total. | Lighthouse `render-blocking-insight`: `Base.css` + `index.css` + `results.css`, **est. savings 590 ms**. At this size, three blocking round trips cost more than the bytes. | `build: { inlineStylesheets: 'always' }` in `astro.config.mjs`. The whole CSS budget is smaller than one HTTP round trip. |
| **C20** | **P2** | `src/components/Nav.astro` + `src/scripts/site.ts:58-62` | The full-screen mobile menu appears and disappears instantly — the only state change on the site with no feedback. | `setOpen()` toggles `menu.hidden` with no transition. emil STD 9 and the frequency table ("occasional" → standard animation); impeccable `animate.md` lists instant show/hide as a motion opportunity. | 200 ms enter / 150 ms exit fade + 8 px translate via `@starting-style`, inside `@media (prefers-reduced-motion: no-preference)`. **Lowest-confidence item here** — the instant swap is defensible as crisp and matches the square, radius-free system. Look at it on a real phone before changing it. |

---

## 5. What is already right

Worth recording so a later pass does not "fix" it:

- **No scroll-jacking anywhere.** The garage is native `scroll-snap-type: x mandatory`; the only scroll
  listener is passive and attached to the track itself. Nav state comes from an IntersectionObserver
  sentinel, not a scroll handler.
- **Nothing is invisible without JS**, verified with JS disabled: every `.reveal` is laid out at full size,
  the hero title renders, the countdown and garage controls stay correctly hidden.
- **Every `:hover` rule is gated** behind `(hover: hover) and (pointer: fine)` — all 15 on the home page,
  verified against the live CSSOM. No false hovers on touch.
- **No `transition: all` with a real duration** anywhere on the site. No `ease-in`. No `scale(0)`. No
  bounce or elastic curves. Custom cubic-beziers throughout (`--ease-out-quart` is exactly the curve
  `animate.md` recommends).
- **`.btn:active { transform: scale(0.97) }` over 120 ms** is the STANDARDS press-feedback spec, to the digit.
- **CLS is a measured 0.0000** at both viewports, and Lighthouse agrees. Explicit dimensions on all 9
  images, `aspect-ratio` on every garage frame, and the countdown line pre-reserved.
- **JS is 2.87 KB inline** — 2 % of the 120 KB budget, zero external requests, and it cannot 404.
- **The garage arrows, progress bar and disabled states all work**, which closes `pass1-report.md`
  known gap #8.
- **Lighthouse ≥ 95 in all four categories on both routes tested**, which closes known gap #1.
