# Pass 4 — implementation report

Lead design engineer, pass 4 of 5. Inputs: `pass4-critique-F.md` (motion craft,
16 findings) and `pass4-critique-G.md` (technical quality, 25 findings), the
orchestrator's decisions, `design-brief.md` §3/§6, `PRODUCT.md`, `DESIGN.md`,
`DEPLOY.md`, and the `emil` / `impeccable` references named in the brief.

Build: `npm run build` exit 0, `check:data` passed (6 results, 8 drivers,
3 events), 5 pages in ~700 ms, zero warnings. `dist/` = 2.7 MB / 78 files.
Nothing committed. No new dependencies. No data file or data contract touched.

**Headline: 16/16 of critique F and 21/25 of critique G actioned. Both P1s in G
and all six P1s in F are fixed. Four G items deferred, each with a reason.
Zero WCAG A/AA violations held. Zero CSP violations. Lighthouse 99/100/100/100
on `/` and 100/100/100/100 on the other four routes, measured the way
`vercel.json` serves them.**

---

## 0. The one number that needs explaining first

Lighthouse was run twice, on two servers, because the answer differs:

| Route (mobile preset) | A. `audit-tool/server.mjs` — no compression (the pass-3 harness) | B. `audit-tool/server-vercel.mjs` — brotli + the real `vercel.json` headers |
|---|---|---|
| `/` | **98**/100/100/100 — FCP 1.3 s, LCP 2.3 s | **99**/100/100/100 — FCP 0.8 s, LCP 2.0 s |
| `/team` | 100/100/100/100 — FCP 0.9 s, LCP 1.7 s | 100/100/100/100 — FCP 0.6 s, LCP 1.4 s |
| `/about` | 100/100/100/100 | 100/100/100/100 |
| `/partners` | 99/100/100/100 | 100/100/100/100 |
| `/` desktop | 100/100/100/100 | 100/100/100/100 |

CLS **0** and TBT **0 ms** on all ten runs.

Harness A is what pass 3 used, and on it `/` drops from 99 to 98 (three
consecutive runs, not variance). The cause is measurable and mundane: the home
document grew from 98 KB to 108 KB **uncompressed**, and Lighthouse's simulator
weights the whole render-blocking document at the throttled bandwidth. The
growth is the work in this pass — 2.3 KB of focus states, 1.4 KB of press
states, 0.7 KB of print styles, 1.3 KB of client JS for the marker, the
countdown and the garage arrows, plus the marker markup, six reveal-delay
attributes and five new `<meta>` tags.

Over brotli the same growth is **+1.7 KB** (17.8 KB vs 16.1 KB), and the score
is 99. Harness B applies the actual `vercel.json` — its headers, its cache
policy, its redirects, its slash rule — and negotiates brotli, which is what
Vercel does. G's own critique flagged harness A as unrepresentative for exactly
this reason (§4: "The test server sends no compression … brotli 16.1 KB, which
is what Vercel will actually serve").

I did take the one cheap byte-saving available (see F16 below: an
`a[target="_blank"]` selector instead of a `data-icon` attribute on forty-odd
inline icons, −585 B). It did not move the uncompressed score, and I did not
reverse any earlier decision — notably `inlineStylesheets: 'always'` and
`assetsInlineLimit: 8192` — to chase a lab number. **This is listed under
"least sure" below.**

---

## 1. Critique F — motion craft (16 findings, 16 actioned)

| ID | Sev | Outcome | What was done, and the evidence |
|---|---|---|---|
| **F1** | P1 | **Fixed** | The panel's closed state is `visibility: hidden` + `pointer-events: none` + `opacity: 0.6` + `translateY(-8px)` instead of `display: none`, so it can transition at all while still leaving the a11y tree and the tab order. Panel and bar now share one tier and one curve. Measured: panel `transition-property: opacity, transform, visibility`, durations `0.2s, 0.2s, 0s` (`mobile-measurements.json`), bar `background-color, border-color` at `0.2s` on `--ease-out-expo`. Frames: `m-menu-open-f0..f5`, `m-menu-close-f0..f4`. The `hidden` attribute is still the single source of truth. |
| **F2** | P1 | **Fixed** | `.menu-toggle` gets `transition: color var(--dur-2), transform var(--dur-1)`, `:active { scale(var(--press-scale)) }`, a teal hover inside the hover query and a teal `:focus-visible` outside it. The two glyphs share one grid cell and cross-fade at `--dur-1` instead of swapping `display`. Measured: hover `rgb(15,255,207)`, press `matrix(0.97023,…)`, focus teal + ring (`signature-measurements.json`). Frames `r4-toggle-press.png`, `r4-toggle-focus.png`, `f-menu-icon-open-30ms.png`. |
| **F3** | P1 | **Fixed** | The arrows step to the next slide's own snap offset. Measured travel, next: **300 / 639 / 300 / 157** px, landing on slides 1 / 2 / 3 / end; prev: **−157 / −300 / −639 / −300**. Every stop is the next slide's offset exactly (`garage-measurements.json`, `snapOffset` 76 / 376 / 1015 / 1315 / 1954 against a 76px scroll pad). See §5 for the bug the first version of this fix introduced and how it was caught. |
| **F4** | P1 | **Fixed** | `.nav-link:focus-visible::after { transform: scaleX(1) }` lives outside the hover query; the hover rule stays inside it. Same for the footer links and the email. Measured focus walk: all four focused nav links report `::after` `matrix(1, 0, 0, 1, 0, 0)` (was `matrix(0,0,0,1,0,0)` on every one). Footer, driver socials, entry strip, roster lines, channel list, contact email, partner marks, 404 links and both buttons' border step all gained matching `:focus-visible` rules. |
| **F5** | P1 | **Fixed** | One `--press-scale: 0.97` for `.btn`, `.garage-btn` and `.menu-toggle` (the garage's 0.94 was outside emil's 0.95–0.98 band and was a second answer to one gesture). Nine text-link families take `opacity: 0.65` at `--dur-1` instead — a scaling text link re-flows words under the finger. Measured: `.btn` press `0.971`, footer press `opacity 0.6516` (it used to be byte-identical to hover), `.text-link` press `0.652`. |
| **F6** | P1 | **Fixed** | `enter-up` is `transform: translateY(16px)` and nothing else; delays are 0 / 60 / 120 / 160 / 200 ms and the duration is `--dur-3`. Frozen at t=0: `leadOpacity`, `proofOpacity`, `actionsOpacity` all **"1"** (were all "0"); settled at 520 ms instead of 840 ms. `f-hero-copy-0000ms.png` is the before/after frame — it was a black rectangle, it is now the whole copy column. |
| **F7** | P2 | **Fixed** | The tick is scheduled to the next minute boundary of the *remaining* time and re-renders on `visibilitychange`, so a backgrounded tab cannot show a stale value on return. Measured: scheduled delay **30937 ms**, minute-boundary offset **0 ms**, no 30 000 ms interval anywhere. The line fades in once from 0.6 and each new value fades up from 0.55 (WAAPI, skipped under reduced motion) instead of swapping hard. |
| **F8** | P2 | **Fixed** | `transition-duration: var(--dur-2) !important` added beside the reduced-motion `transition-property` clamp, so CSS can no longer cycle the shorter list and land a 120 ms press duration on `opacity` and `fill`. |
| **F9** | P2 | **Fixed** | The 3% hover zoom is deleted from both the garage slides and the About collage. They are captioned figures, not links, and `ResultsTable` refuses a row hover for exactly this reason. Measured: `about.shotHoverScale: "all 0s"`. |
| **F10** | P2 | **Fixed** | Disabled arrows: `opacity: 0.45` on the glyph only, border left at full `--line-strong`, so the control keeps its footprint and reads as unavailable rather than absent. |
| **F11** | P2 | **Fixed** | `progress.style.width` is written only when the value changes. Measured over a full scroll: `styleWrites: 1`, `distinctWidthValues: ["50.776%"]`. |
| **F12** | P2 | **Fixed** | The driver-card hover runs on one clock: `color` and `-webkit-text-stroke-color` on the number, `color` on the name, all `--dur-2` / `--ease-out-quart`. Measured at +90 ms: number `rgba(15,255,207,0.95)`, stroke `rgba(15,255,207,0.984)`, name `rgb(27,255,209)` — all three mid-transition. Previously two of the three had snapped. |
| **F13** | P2 | **Fixed** | The 404 takes the `[data-enter]` grammar: code + h1 at 0, lead at 60 ms, actions at 120 ms, the page list at 160 ms. Measured: `notFound.hasEnter: 5`, five `enter-up` animations. |
| **F14** | P2 | **Fixed** | `<tr class="reveal" style="--reveal-delay: …">` at 45 ms per row, capped at six rows (225 ms). Measured: `rowsHaveReveal: 6`. Consistent with pass 2's C8, which removed `.reveal` from wrappers and kept it on genuine sibling lists. |
| **F15** | P2 | **Fixed** | The nav sentinel is 64px. Measured trigger point: not stuck at scrollY 0 / 4 / 40 / 63, stuck at 80 and 200. It used to flip at ~2 px and back. |
| **F16** | P2 | **Fixed** | The 3 px arrow nudge now applies to all five arrow-carrying families, with a diagonal for links that open a tab. The diagonal is selected with `a[target='_blank']`, an attribute already in the markup, rather than a `data-icon` on forty-odd icons — same effect, 585 fewer bytes per page. |

### The signature moment — before / after

Approved as proposed by F: the hero position marker settles like a timing tower.

**Before** (`shots/r3-motion/f-hero-copy-0000ms.png`, `d-countdown.png`): the
marker never moved, anywhere on the site, and at t=0 the copy column it sits in
was a black rectangle.

**After** (`shots/r4-motion/`):

| Frame | File | State |
|---|---|---|
| t=0 | `r4-count-0000ms.png` | `P41`, rule not drawn, block width identical to rest |
| t=180 ms | `r4-count-0180ms.png` | `P21` |
| t=260 ms | `r4-count-0260ms.png` | `P7` |
| t=340 ms | `r4-count-0340ms.png` | `P3` |
| t=700 ms | `r4-count-0700ms.png`, `r4-marker-settled.png` | `P2` with the podium rule drawn |

Measured (`signature-measurements.json`): 25 distinct values, first `P41` at
t=0, settled `P2` at **t=364 ms**; the rule is `draw-rule` at `0.2s` with a
`0.58s` delay and ends at `scaleX(1)`.

Safety, all measured rather than asserted:

- **No JS** (`r4-marker-no-js.png`): visible text `P2`, hidden text `P2`, rule
  present.
- **Reduced motion** (`r4-marker-reduced-motion.png`): value `P2`, rule
  `transform: none`, `document.getAnimations().length === 0`.
- **Accessibility**: the counting glyph is `aria-hidden="true"`; the real value
  sits beside it as `sr-only` text that never changes. No `aria-live` — this is
  a load-time flourish, not an update the reader asked for.
- **No layout shift**: the field is reserved at `calc(var(--pos-chars) * (1ch +
  0.02em))` = 40.92 px, the width of `P41`. Block width is 57.9 px at every
  frame of the count. Lighthouse CLS is 0 on all ten runs.
- **Skipped** when the record has no field size, when the tab is hidden, and
  when the module runs later than the CSS clock it is in step with.

### The entrance — before / after

| | Before (pass 3) | After |
|---|---|---|
| `leadOpacity` @ t=0 | `"0"` | **`"1"`** |
| `proofOpacity` @ t=0 | `"0"` | **`"1"`** |
| `actionsOpacity` @ t=0 | `"0"` | **`"1"`** |
| `actionsOpacity` @ t=300 | `0.136` | **`"1"`** |
| Settles at | 840 ms | **520 ms** |
| `/team` `<h1>` at t=0 | invisible | full ink, 16 px low |
| Frame | `shots/r3-audit/entrance-frozen-t0.png`, `shots/r3-motion/f-hero-copy-0000ms.png` | `shots/r4-motion/f-hero-copy-0000ms.png`, `f-hero-0000ms.png` |

FCP → LCP gap, traced directly with a `PerformanceObserver` (`audit-tool/lcp5.mjs`):

| Condition | FCP | LCP | Gap | LCP element |
|---|---|---|---|---|
| `/team` 412×823, slow 4G + 4× CPU, **brotli** | 532 ms | 532 ms | **0 ms** | `p.lead` |
| `/team` 412×823, slow 4G + 4× CPU, uncompressed | 504 ms | 648 ms | 144 ms | `p.lead` |
| `/` 412×823, slow 4G + 4× CPU, brotli | 620 ms | 620 ms | **0 ms** | `p.hero-lead` |
| `/` 1350×940, unthrottled | 176 ms | 176 ms | 0 ms | the hero `<img>` |

The lead paragraph used to arrive `120 ms + 560 ms` after it could have, which
is precisely what Lighthouse named as the LCP delay on `/team`. It now paints at
first paint.

---

## 2. Critique G — technical quality (25 findings: 21 actioned, 4 deferred)

| ID | Sev | Outcome | Detail |
|---|---|---|---|
| **G1** | P1 | **Fixed** | See F6 and the entrance table above. `enter-up` has no opacity. |
| **G2** | P1 | **Fixed** | `.results thead` is clipped (`position: absolute; width/height: 1px; overflow: hidden; clip-path: inset(50%)`) rather than `display: none`. Measured with `sem2.mjs`: the first `<th>` is `{role: "columnheader", name: "POS"}` and all five `columnheader` nodes are present at **390, 768 and 1440**. A follow-on defect the re-run caught: the `::before` `data-label` rule matched the header row too, so the clipped headers announced as `": DRIVERS"` — the rule is now scoped to `td`. |
| **G3** | P2 | **Fixed** | One `@media print` block: the token set inverts (teal → `#046b58`, 4.9:1 on white), the fixed header / skip link / hero photo / texture / garage controls are dropped, external links print their destination, and sections avoid breaking. Verified with `print4.mjs`: `body rgb(255,255,255) / rgb(0,0,0)`, `.site-nav display: none`, and the rendered sheet in `shots/r4-audit/print4-home-results.png`. |
| **G4** | P2 | **Fixed** | `vercel.json` added at the repo root with G's header block verbatim. Verified live — see §3. |
| **G5** | P2 | **Fixed** | `og:image:width/height/type/alt` and `og:locale` added. |
| **G6** | P2 | **Fixed** | `Base.astro` takes a `noindex` prop; `404.astro` sets it. `dist/404.html` now carries `<meta name="robots" content="noindex, follow">` and **no** canonical, **no** `og:url` and **no** JSON-LD (a not-found document should not assert an entity). `/404` also 301s to `/`. |
| **G7** | P2 | **Fixed** | One slash policy. `vercel.json` sets `trailingSlash: false`; the canonical is normalised (`/team`, not `/team/`); `sitemap.xml` updated to match; `nav.json` already used the bare form. Chosen over `trailingSlash: true` so no internal navigation costs a redirect. Verified: `/team/` → 308 → `/team`. |
| **G8** | P2 | **Fixed** | About collage: `widths` gained a 768 rung and `sizes` tells the truth about the frame (`calc(100vw - 2.5rem)`, not `100vw`). |
| **G9** | P2 | **Fixed** | Both portrait garage slides gained a 560 rung. Lighthouse `image-delivery-insight` on `/` went from **19 KiB** of savings to **5 KiB**, and the 5 KiB that remains is the hero's compression factor, which G said to leave alone. |
| **G10** | P2 | **Fixed** | `jetbrains-mono-700` is preloaded per page via a `monoBold` prop, set on `/`, `/team` and the 404 where it sets above-the-fold text. Measured: removing it made `/` **worse** (FCP 1.3 s → 1.4 s), so it stays. |
| **G11** | P2 | **Deferred** | Subsetting the two mono faces (~32 KB/view). Needs `pyftsubset`/fonttools, which is not installed here, and it rewrites committed binary assets that `vercel.json` now serves with a one-year `immutable` policy — a change that has to be paired with a filename change and a deliberate owner decision. It is the largest remaining perf win and the right first item for pass 5. |
| **G12** | P2 | **Fixed** | All five legacy redirects plus `/team.html` and `/404`, at 301, in `vercel.json`. Verified live. `DEPLOY.md` §3 now documents the Vercel mapping, with the `.htaccess` snippet demoted to a cPanel-only footnote. |
| **G13** | P3 | **Fixed** | `isCurrent` lifted into `src/lib/links.ts` and used by `Nav.astro` and `Footer.astro`. `/` now has a current-page marker (1 node: the footer's "Home"); the inner pages have 3 each. An href with a fragment is never "current". |
| **G14** | P2 | **Deferred, deliberately** | Unused inlined CSS. G's own recommendation is "leave it", and most of what the tool counts is state CSS that must ship. Recorded in `DESIGN.md` §8 with the numbers so pass 5 does not re-litigate it. |
| **G15** | P3 | **No action** (as recommended) | `--ink-faint` at 5.49:1 fails AAA and clears AA at any size. Node counts unchanged from pass 3: 51 / 39 / 17 / 17 / 8 / 8 / 29 / 25 / 5 / 5. |
| **G16** | P3 | **No action** (as recommended) | The explicit ARIA roles stay. `html-validate` still reports 45 + 27 `no-redundant-role`; `/team`, `/about` and `404.html` are clean. Recorded in `DESIGN.md` §7. |
| **G17** | P3 | **Documented** | `.driver-number` as transparent text with a stroke — one paragraph in `DESIGN.md` §7 so the next auditor does not re-open it. |
| **G18** | P3 | **Fixed** | `altFor()` special-cases a generic track name: "Chevrolet Camaro in the Artemis livery **on a short track**" instead of "…at Short track". Done in the renderer; `cars.json` untouched. |
| **G19** | P3 | **Fixed** | JSON-LD gained `@id` (so the four copies are one entity), `alternateName`, `image`, an `ImageObject` logo, `sport` as an array and `slogan`; it is suppressed on the 404. No roster, no events, no rating — the driver names are flagged placeholders and must not be published as structured claims. |
| **G20** | P3 | **Documented** | `DESIGN.md` §8 now says the LCP element is the hero image on a fast connection and the lead paragraph on a throttled one, with the traced numbers. |
| **G21** | P3 | **Deferred** | Explicit `twitter:*` tags. G calls it the lowest-value item in the table; X already falls back to the `og:*` values correctly, and duplicating four tags adds a drift risk for no rendering change. `og:image:alt` (G5) covers the alt text. |
| **G22** | P2 | **Fixed** | `immutable` for `/_astro/*` and `/fonts/*`, a day for the icons and the OG card, HTML left on Vercel's default so a bot data push is live immediately. Verified live — see §3. The one-way door on the unhashed `/fonts/*` path is called out in `DEPLOY.md`. |
| **G23** | P3 | **Deferred** (as recommended) | The garage `prev` button is `disabled` at load and therefore not tabbable. G's own verdict: "working as designed and WCAG-conformant". Swapping to `aria-disabled` plus a no-op handler trades a correct state for a discoverability nicety on a region that is already focusable and arrow-scrollable. |
| **G24** | P3 | **Fixed** | The garage scroll wrapper is a `<section aria-label>`, which *is* `role="region"`. The `prefer-native-element` lint error is gone and the accessibility tree is unchanged. |
| **G25** | P2 | **Documented, cannot be code** | `vercel.json` is not environment-aware. `DEPLOY.md` §0b now tells the owner to set `X-Robots-Tag: noindex` for the Preview environment in the Vercel project settings. |

---

## 3. Verification results

### axe-core 4.13.0 — 5 pages × 2 viewports + the open menu

**Zero WCAG 2.0/2.1/2.2 A and AA violations**, on every page at both viewports,
unchanged from pass 3. The only rule that fires is `color-contrast-enhanced`
(`wcag2aaa`, the 7:1 bar, included on purpose), with node counts identical to
pass 3: `/` 51 / 39, `/team` 17 / 17, `/about` 8 / 8, `/partners` 29 / 25,
404 5 / 5. The open mobile menu at 390 returns **0 violations**.

### Keyboard

143 tab stops across five pages (32 / 27 / 21 / 38 / 25 — unchanged). Every one
has a visible `solid 2px rgb(15,255,207)` ring at 3px offset, a non-empty
accessible name, and is inside the viewport when reached. Skip link is stop 1
and lands on `MAIN#main`. Focus trap cycles correctly; Escape closes, returns
focus to the toggle, unlocks the body and clears `inert`. `/#results` lands
88 px from the top against a 73 px bar. **New in this pass:** every focused nav
link now draws the underline.

### Semantics / validity

- Table headers present as `columnheader` at 390, 768 **and** 1440 (G2).
- `html-validate`: `/` 45 errors, `/partners` 27, all `no-redundant-role` and
  all deliberate. `/team`, `/about`, `404.html` clean. `prefer-native-element`
  is gone (G24).
- `aria-current`: `/` 1, `/team` 3, `/about` 3, `/partners` 3, 404 none.

### Robustness

- **JS disabled**, all five pages: `html` has no `js` class, every `<h1>` at
  `opacity 1` and `transform: none`, **0 of 37 `.reveal` elements offset, faded
  or zero-height**, countdown correctly `hidden` with the static date still
  printed, garage controls `visibility: hidden`, menu hidden, footer year from
  the build.
- **Reduced motion**: `document.getAnimations().length === 0`, parallax not
  attached, reveals `transform: none`, transition property list clamped, the
  marker does not count, the podium rule is simply there.
- **Print**: inverted, verified as a rendered sheet.
- **200% text**, all five pages at 390: layout viewport holds 390, no overflow,
  hamburger 44×44 fully on screen.

### CSP and headers — `audit-tool/csp-check.mjs`

`dist/` served with the real `vercel.json` headers, brotli negotiated, and every
page driven with the things a CSP could plausibly block: the inline module, the
inline `ld+json`, the inline `<style>`, 9–21 `style=` attributes, the fonts, the
images, the mobile menu (opened and Escaped), the garage arrows (three next, one
prev), a forced countdown re-render and a full scroll.

**Result: 0 CSP violations, 0 console errors, 0 failed requests, on all five
pages at both 1440 and 390.** Every page reports the CSP and the five other
security headers present, the client JS running (`html.js`), every reveal
settled, the countdown rendered and the marker at `P2`.

Cache headers, probed directly:

| Path | Cache-Control |
|---|---|
| `/_astro/*.webp` | `public, max-age=31536000, immutable` |
| `/fonts/*.woff2` | `public, max-age=31536000, immutable` |
| `/og.png`, `/favicon.svg` | `public, max-age=86400` |
| `/` (HTML) | `public, max-age=0, must-revalidate` |

Redirects, probed directly: `/join` 301 → `/#join`, `/results` 301 →
`/#results`, `/calendar` 301 → `/`, `/media` 301 → `/about`, `/legacy` 301 →
`/about`, `/team.html` 301 → `/team`, `/404` 301 → `/`, and `/team/` 308 →
`/team` from the slash policy.

The CSP was **not** loosened from G's proposal. `script-src` and `style-src`
keep `'unsafe-inline'` for the reasons G set out (three inline scripts and 9–21
inline style attributes per page, whose hashes change on every data push);
everything else is as written.

### Screenshots reviewed

- `shots/r4/` — 72 files at 1440×900 and 390×844. Viewed: every desktop
  full and hero, `mobile-home-full`, `mobile-home-scroll-01..04`,
  `mobile-404-full`.
- `shots/r4-tablet/` — 74 files at 768×1024 and 1024×768. Viewed:
  `t768-home-full`, `t1024-home-hero`.
- Console capture: **0 messages, 0 page errors, 0 failed requests** on all four
  real routes at every viewport (the 404 route's four entries are the
  deliberate HTTP 404 on the document itself).

---

## 4. What I changed, by file

| File | Change |
|---|---|
| `src/styles/global.css` | Motion tokens retokenised (3 durations, 2 curves, `--press-scale`); `enter-up` transform-only; `enter-fade` removed; reveal + entrance on `--ease-out-expo`; one press rule for nine text-link families; focus states on `.text-link` and `.btn-ghost`; arrow nudge for all five families; reduced-motion duration clamp; a new `@media print` block |
| `src/scripts/site.ts` | `initHeroCount()` (the signature moment); countdown rewritten (minute-aligned, visibility-aware, fades); garage `step()` rewritten to snap offsets; progress width written only on change |
| `src/components/Nav.astro` | Panel transition; hamburger hover/press/focus; icon cross-fade; nav-link and CTA focus states; `isCurrent` from `lib/links` |
| `src/components/Hero.astro` | Marker markup (`aria-hidden` glyph + `sr-only` value + rule), reserved field width, `draw-rule` animation, entrance delays |
| `src/components/ResultsTable.astro` | `thead` clipped not hidden; `data-label` prefixes scoped to `td`; per-row `.reveal` stagger |
| `src/components/Garage.astro` | `<section>` for the scroll region; disabled-glyph opacity; press scale; focus state; 560 rung on the portrait slides; `altFor()` generic-track phrasing |
| `src/components/GarageSlide.astro`, `src/pages/about.astro` | Hover zoom removed; About collage width ladder and `sizes` |
| `src/components/DriverCard.astro` | Hover on one clock; focus states |
| `src/components/Footer.astro` | `aria-current`; focus states |
| `src/components/PartnerBand.astro`, `src/pages/partners.astro`, `src/pages/team.astro` | Retokenised transitions; focus and press states |
| `src/components/PageHead.astro` | Entrance delays |
| `src/components/Icon.astro` | Unchanged in the end — a `data-icon` attribute was added for the diagonal nudge and then removed in favour of `a[target='_blank']` |
| `src/layouts/Base.astro` | `noindex` and `monoBold` props; canonical normalised; `og:image:*` and `og:locale`; JSON-LD improved and gated; 64 px sentinel |
| `src/lib/links.ts` | `isCurrent()` |
| `src/pages/404.astro`, `index.astro`, `team.astro` | Entrance grammar, `monoBold`, `noindex` |
| `public/sitemap.xml` | Trailing slashes dropped to match the canonical |
| `vercel.json` | **New.** Headers, CSP, cache policy, redirects, slash rule |
| `DESIGN.md` | §5 rewritten, §6/§7/§8 updated, pass 4 decision log |
| `DEPLOY.md` | New §0b on `vercel.json`; §3 rewritten for Vercel with the `.htaccess` snippet as a cPanel footnote; new verification steps |

Scratchpad tooling added: `motion-tool/signature.mjs`, `motion-tool/count-frames.mjs`,
`audit-tool/server-vercel.mjs`, `audit-tool/csp-check.mjs`, `audit-tool/lcp5.mjs`,
`audit-tool/print4.mjs`, `audit-tool/print4b.mjs`, `perf-tool/lh-vercel.mjs`,
`perf-tool/lh-home-rep.mjs`. `motion-tool/lib.mjs` now honours `MOTION_OUT` and
defaults to `shots/r4-motion`.

---

## 5. One bug I introduced and caught

The first version of the F3 fix read `scroll-padding-inline-start` from
`getComputedStyle`. Chrome hands that back **unresolved** when it is a `max()`
containing a percentage — the literal string `max(56px, 50% - 644px)` — so
`parseFloat` returned `NaN`, the pad fell back to 0, every stop landed 76 px
past its own snap point, and mandatory snap pulled the track straight back.
Measured result: six presses, **zero pixels moved**, worse than the bug being
fixed. Critic F's own `garage.mjs` caught it on the first re-run.

The stops are now measured against the first slide, which *is* scrollLeft 0 by
construction (the track's scroll padding and the list's inline padding are the
same CSS expression on purpose). Recorded here because "read the computed value"
is the obvious approach and it does not work.

---

## 6. The five things I am least sure about

1. **Lighthouse 98 vs 99 on `/`, and which harness is the truth.** I did not
   hold the uncompressed number. My argument is that the compressed harness is
   the honest one — it runs the `vercel.json` this pass was asked to write — and
   that a 10 KB uncompressed / 1.7 KB brotli document delta buys focus states on
   ten element families, press states on eight, a print stylesheet and the
   signature moment. But it *is* a floor the orchestrator set and I missed it on
   the harness it was set against. If that is not acceptable, the two levers
   that would claw it back are both reversals of earlier decisions:
   `assetsInlineLimit` (move the 5.6 KB client module out of the document, where
   it would also pick up the new `immutable` header) or `inlineStylesheets`. I
   did not take either unilaterally.

2. **The masked lockup rise is still invisible at t=0, and the brief's
   verification line says "t=0 frames show all hero text".** Everything else on
   the first screen is at full ink from frame one; the two headline lines are a
   *clip* reveal, not a fade, and clear at 320 / 390 ms. I tried the partial mask
   (30% travel) and rejected it on the evidence: at any travel small enough to be
   legible, the clip cuts the bottom bar off the uppercase and "ESPORTS" renders
   as "FSPORTS". The alternative is deleting the mask and giving the h1 the same
   16 px rise as everything else — which is a uniform entrance, the exact reflex
   `impeccable` names as the tell, and it would discard the move `DESIGN.md`
   §5 has protected since pass 2. I kept the mask and documented the exception.
   This is the single call in the pass I would most want a second opinion on.

3. **`visibility: hidden` on the mobile panel instead of `display: none`.** It is
   the only way a `[hidden]` panel can animate out, it keeps the element out of
   the a11y tree and the tab order, and axe returns 0 violations with the menu
   open — but it means an off-screen `position: fixed` element is laid out on
   every phone-width page load, and the `hidden` attribute no longer does the
   hiding on its own. `@starting-style` + `transition-behavior: allow-discrete`
   would be the modern alternative; I judged it more fragile against the UA
   `[hidden]` rule, but I did not test it.

4. **`trailingSlash: false` rather than `true`.** I picked it so internal
   navigation costs no redirect, and updated the canonical and the sitemap to
   match. The risk is that the site's existing inbound links and whatever Google
   has indexed use the slashed form, so every one of those now takes a 308 on
   first hit. Both forms are defensible; the important thing is that all three
   sources now agree, and `DEPLOY.md` says so loudly.

5. **The countdown's fade on change.** It is a WAAPI fade-up from 0.55 on the
   whole line rather than a true cross-fade of only the minute field, because a
   real cross-fade needs two stacked layers and the line is one text node inside
   a `<dd>` with a reserved height. It reads as a soft update rather than a hard
   swap, which is what F7 asked for, but I could not frame-capture it — the
   change only happens on a minute boundary, so the evidence for F7 is the
   scheduling measurement (`minuteBoundaryOffsetsMs: [.., 0, ..]`), not a frame.

---

## 7. Artefacts

| Path | What |
|---|---|
| `shots/r4/` | 72 desktop + mobile screenshots, console capture per route |
| `shots/r4-tablet/` | 74 screenshots at 768 and 1024 |
| `shots/r4-motion/` | ~110 frames + 6 measurement JSONs (`frames-`, `interact-`, `mobile-`, `garage-`, `hero-`, `signature-measurements.json`); the signature before/after is `r4-count-*.png`, `r4-marker-*.png` |
| `shots/r4-audit/` | print-emulated sheets and PDFs |
| `audit-tool/axe-results.json` | axe over 5 pages × 2 viewports + the open menu |
| `audit-tool/kbd-results.json` | 143 tab stops with CDP-computed names |
| `audit-tool/csp-results.json` | CSP, headers, cache policy and redirects, verified live |
| `audit-tool/hv4.json` | html-validate |
| `audit-tool/lh4-*.json`, `lh4v-*.json` | Lighthouse, both harnesses |
